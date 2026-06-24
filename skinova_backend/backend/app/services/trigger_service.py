# app/services/trigger_service.py
"""
Personalized Trigger Detection Engine for Skinova.

Core idea:
  - No hardcoded "dairy is bad" assumptions
  - Learns from EACH user's own food_logs + face_logs
  - Detects: if user ate X → skin worsened within 24–72 hrs → X is a trigger
  - Builds confidence over repeated occurrences
  - Stores learned triggers in user_triggers collection so it improves over time
"""

import logging
from datetime import datetime, timezone, timedelta
from collections import defaultdict

from bson import ObjectId

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

# How many hours after eating can a food still cause a flare?
# Research shows acne triggers typically appear 24–72 hrs later.
TRIGGER_WINDOW_HOURS = [24, 48, 72]

# Skin score thresholds
SKIN_WORSENED_THRESHOLD = 10   # skin score dropped by this much = worsening
SKIN_BAD_ABSOLUTE = 60         # skin score below this = bad skin day

# How many times a food must co-occur with a flare to be called a trigger
# Kept at 1 so early users see signals immediately; severity scales with count
MIN_OCCURRENCES_MEDIUM = 1
MIN_OCCURRENCES_HIGH = 3

# Ingredient-level keywords to split compound food names
# (used only for ingredient extraction from text, NOT for hardcoded risk)
INGREDIENT_SPLIT_CHARS = [",", "+", "with", "and"]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _normalize_food_name(name: str) -> str:
    """Lowercase + strip. Keep it simple for matching."""
    return name.strip().lower()


def _skin_worsened(score_before: float, score_after: float) -> bool:
    """True if skin got meaningfully worse."""
    if score_after < SKIN_BAD_ABSOLUTE:
        return True
    if score_before - score_after >= SKIN_WORSENED_THRESHOLD:
        return True
    return False


def _severity_from_count(count: int) -> str:
    if count >= MIN_OCCURRENCES_HIGH:
        return "high"
    if count >= 2:
        return "medium"
    return "low"  # 1 occurrence = low confidence, still surfaces it


# ── Core engine ───────────────────────────────────────────────────────────────

async def detect_personal_triggers(db, user_id: str) -> list[dict]:
    """
    Analyze a user's own history and return a list of personalized triggers.

    Returns:
        [
          {
            "food_name": "chocolate",
            "count": 3,
            "avg_skin_drop": 15.2,
            "last_seen": "2025-07-10",
            "severity": "high",
            "window_hrs": 48,   # which time window showed strongest correlation
          },
          ...
        ]
    """

    # ── 1. Load food logs (last 90 days for enough history) ──────────────────
    ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)

    food_logs = []
    async for doc in db["food_logs"].find(
        {"user_id": user_id, "timestamp": {"$gte": ninety_days_ago}}
    ).sort("timestamp", 1):
        food_logs.append(doc)

    if not food_logs:
        return []

    # ── 2. Load face logs (last 90 days) ────────────────────────────────────
    face_logs = []
    async for doc in db["face_logs"].find(
        {"user_id": user_id, "timestamp": {"$gte": ninety_days_ago}}
    ).sort("timestamp", 1):
        raw = doc.get("skin_score") or doc.get("overall_skin_score") or 0
        face_logs.append({
            "timestamp": doc["timestamp"],
            "skin_score": float(raw),
        })

    if len(face_logs) < 2:
        return []

    # ── 3. For each food, check if skin worsened within each time window ─────
    # Structure: { food_name: { window_hrs: [skin_drop_per_occurrence] } }
    food_correlations: dict[str, dict[int, list[float]]] = defaultdict(
        lambda: {w: [] for w in TRIGGER_WINDOW_HOURS}
    )

    for food in food_logs:
        food_name = _normalize_food_name(food.get("food_name", ""))
        if not food_name:
            continue

        food_time: datetime = food.get("timestamp")
        if food_time is None:
            continue

        # Make timezone-aware if needed
        if food_time.tzinfo is None:
            food_time = food_time.replace(tzinfo=timezone.utc)

        # Find the skin score closest to (just before) this food was eaten
        score_before = _get_skin_score_before(face_logs, food_time)
        if score_before is None:
            continue

        # For each time window, find skin score AFTER the food
        for window_hrs in TRIGGER_WINDOW_HOURS:
            score_after = _get_skin_score_in_window(
                face_logs, food_time, window_hrs
            )
            if score_after is None:
                continue

            if _skin_worsened(score_before, score_after):
                drop = score_before - score_after
                food_correlations[food_name][window_hrs].append(drop)

    # ── 4. Score each food ───────────────────────────────────────────────────
    triggers = []
    for food_name, windows in food_correlations.items():
        # Find the window with the most occurrences (strongest signal)
        best_window = max(windows, key=lambda w: len(windows[w]))
        occurrences = windows[best_window]
        count = len(occurrences)

        if count < MIN_OCCURRENCES_MEDIUM:
            continue  # not enough evidence yet

        avg_drop = sum(occurrences) / len(occurrences) if occurrences else 0

        # Find last time this food was logged
        last_logged = max(
            (f.get("timestamp") for f in food_logs
             if _normalize_food_name(f.get("food_name", "")) == food_name),
            default=None,
        )
        last_seen = (
            last_logged.strftime("%Y-%m-%d")
            if isinstance(last_logged, datetime)
            else str(last_logged)[:10]
        )

        triggers.append({
            "food_name": food_name,
            "count": count,
            "avg_skin_drop": round(avg_drop, 1),
            "last_seen": last_seen,
            "severity": _severity_from_count(count),
            "window_hrs": best_window,
        })

    # Sort: highest count first, then worst avg_drop
    triggers.sort(key=lambda x: (-x["count"], -x["avg_skin_drop"]))

    return triggers


def _get_skin_score_before(
    face_logs: list[dict], food_time: datetime
) -> float | None:
    """
    Return the skin score from the log entry closest to (but before)
    the given food_time. Returns None if no prior scan exists.
    """
    best = None
    best_score = None

    for log in face_logs:
        ts: datetime = log["timestamp"]
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        if ts <= food_time:
            best = ts
            best_score = log["skin_score"]

    return best_score


def _get_skin_score_in_window(
    face_logs: list[dict], food_time: datetime, window_hrs: int
) -> float | None:
    """
    Return the LOWEST skin score within [food_time, food_time + window_hrs].
    Using the lowest captures worst-case flare within the window.
    Returns None if no scan in that window.
    """
    window_end = food_time + timedelta(hours=window_hrs)
    scores_in_window = []

    for log in face_logs:
        ts: datetime = log["timestamp"]
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        if food_time < ts <= window_end:
            scores_in_window.append(log["skin_score"])

    if not scores_in_window:
        return None
    return min(scores_in_window)  # worst score in the window


# ── Persistence: save & load learned triggers ─────────────────────────────────

async def save_triggers(db, user_id: str, triggers: list[dict]):
    """
    Upsert learned triggers into user_triggers collection.
    One document per user, updated every time this runs.
    """
    await db["user_triggers"].update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "triggers": triggers,
                "updated_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )
    logger.info(f"[TriggerService] Saved {len(triggers)} triggers for {user_id}")


async def load_triggers(db, user_id: str) -> list[dict]:
    """
    Load previously learned triggers from DB.
    Returns [] if none exist yet.
    """
    doc = await db["user_triggers"].find_one({"user_id": user_id})
    if not doc:
        return []
    return doc.get("triggers", [])


# ── Main entry: get triggers for dashboard ────────────────────────────────────

async def get_personalized_trigger_events(db, user_id: str) -> list[dict]:
    """
    Full pipeline:
      1. Detect triggers from user's own history
      2. Save them (so they improve over time + persist)
      3. Format for dashboard display

    Returns list of trigger_event dicts ready for the dashboard.
    """
    from datetime import datetime, timezone, timedelta

    # Step 1: Detect from history
    try:
        learned = await detect_personal_triggers(db, user_id)
    except Exception as e:
        logger.warning(f"[TriggerService] detect failed: {e}")
        learned = []

    # Step 2: Merge with previously saved (keeps triggers even when no new data)
    saved = await load_triggers(db, user_id)

    # Merge: update existing with new counts, add new ones
    saved_map = {t["food_name"]: t for t in saved}
    for trigger in learned:
        saved_map[trigger["food_name"]] = trigger  # new detection wins

    merged = list(saved_map.values())
    merged.sort(key=lambda x: (-x["count"], -x["avg_skin_drop"]))

    # Step 3: Save merged back
    if merged:
        await save_triggers(db, user_id, merged)

    # Step 4: Also pull recent high-risk food logs (last 7 days) for timeline
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    trigger_names = {t["food_name"] for t in merged}

    recent_trigger_events = []

    async for doc in db["food_logs"].find(
        {"user_id": user_id, "timestamp": {"$gte": seven_days_ago}}
    ).sort("timestamp", -1).limit(30):
        food_name = _normalize_food_name(doc.get("food_name", ""))
        if not food_name:
            continue

        # Only surface if it's a LEARNED trigger OR has a notable risk score
        risk_score = float(doc.get("risk_score", 0))
        is_learned_trigger = food_name in trigger_names

        if not is_learned_trigger and risk_score < 30:
            continue

        # Find severity from learned triggers
        trigger_meta = saved_map.get(food_name)
        if trigger_meta:
            severity = trigger_meta["severity"]
            cause_label = (
                f"{doc.get('food_name', food_name).title()} "
                f"(detected {trigger_meta['count']}× as trigger)"
            )
        else:
            # High-risk food but not yet a confirmed trigger
            severity = "medium" if risk_score >= 70 else "low"
            cause_label = f"{doc.get('food_name', food_name).title()} (high risk score)"

        ts = doc.get("timestamp")
        time_str = (
            ts.strftime("%b %d · %I:%M %p")
            if isinstance(ts, datetime) else str(ts)[:10]
        )

        recent_trigger_events.append({
            "id": str(doc.get("_id")),
            "time": time_str,
            "cause": cause_label,
            "severity": severity,
            "source": "food",
        })

    # Step 5: Add product triggers — flag anything comedogenic score >= 2.5
    async for doc in db["user_products"].find(
        {"user_id": user_id, "is_active": True}
    ):
        score = float(doc.get("comedogenic_score", 0))
        if score < 2.5:
            continue
        recent_trigger_events.append({
            "id": str(doc.get("_id")),
            "time": "Active product",
            "cause": f"{doc.get('product_name', 'Unknown')} (comedogenic {score:.1f}/5)",
            "severity": "high" if score >= 4 else "medium",
            "source": "product",
        })

    # Step 6: Add skin scan triggers (last 7 days)
    async for doc in db["face_logs"].find(
        {"user_id": user_id, "timestamp": {"$gte": seven_days_ago}}
    ).sort("timestamp", -1).limit(5):
        condition = doc.get("primary_condition", "")
        if not condition or condition in ("Normal", "Pending", ""):
            continue

        lesions = int(doc.get("lesion_count", 0) or 0)
        severity = "high" if lesions >= 5 else "medium" if lesions >= 2 else "low"

        ts = doc.get("timestamp")
        time_str = (
            ts.strftime("%b %d · Skin scan")
            if isinstance(ts, datetime) else str(ts)[:10]
        )

        recent_trigger_events.append({
            "id": str(doc.get("_id")),
            "time": time_str,
            "cause": f"Skin: {condition}",
            "severity": severity,
            "source": "skin",
        })

    # Step 7: Sort and limit
    severity_order = {"high": 0, "medium": 1, "low": 2}
    recent_trigger_events.sort(
        key=lambda x: (severity_order.get(x["severity"], 3), x["time"])
    )

    return recent_trigger_events[:6]


# ── Summary for AI forecast context ──────────────────────────────────────────

async def get_trigger_summary_for_llm(db, user_id: str) -> str:
    """
    Returns a plain-text summary of learned triggers for use in
    LLM forecast prompts (passes personalized context to Llama 4).
    """
    triggers = await load_triggers(db, user_id)
    if not triggers:
        return "No personal food triggers have been identified yet."

    high = [t for t in triggers if t["severity"] == "high"]
    medium = [t for t in triggers if t["severity"] == "medium"]

    lines = ["Personalized trigger history (learned from user's own data):"]

    if high:
        names = ", ".join(t["food_name"].title() for t in high)
        lines.append(f"  HIGH confidence triggers: {names}")
    if medium:
        names = ", ".join(t["food_name"].title() for t in medium)
        lines.append(f"  MEDIUM confidence triggers: {names}")

    lines.append(
        f"  (Based on {sum(t['count'] for t in triggers)} observed flare correlations)"
    )
    return "\n".join(lines)
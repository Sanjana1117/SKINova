# app/services/dashboard_service.py
"""
Dashboard service — now uses fully personalized trigger detection.
No hardcoded ingredient keywords. Every trigger is learned from the user's data.
"""

import logging
from datetime import datetime, timezone, timedelta

from fastapi import HTTPException
from bson import ObjectId

from app.db.mongodb import get_db
from app.services.trigger_service import get_personalized_trigger_events

logger = logging.getLogger(__name__)


def _to_date(ts) -> str:
    if isinstance(ts, datetime):
        return ts.strftime("%Y-%m-%d")
    if isinstance(ts, str):
        return ts.replace("Z", "").split("T")[0][:10]
    return ""


def _normalize_risk(value) -> int:
    if value is None:
        return 0
    v = float(value)
    if v <= 1.0:
        return round(v * 100)
    return round(v)


async def get_dashboard(user_id: str) -> dict:
    db = get_db()

    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

    # ── Skin scores (last 7 days) ────────────────────────────────────────────
    skin_scores = []
    async for doc in db["face_logs"].find(
        {"user_id": user_id, "timestamp": {"$gte": seven_days_ago}}
    ).sort("timestamp", 1):
        raw_score = doc.get("skin_score") or doc.get("overall_skin_score") or 0
        skin_scores.append({
            "date": _to_date(doc.get("timestamp")),
            "score": round(float(raw_score)),
        })

    # ── Forecast ─────────────────────────────────────────────────────────────
    forecast_text = ""
    overall_risk = 0
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    try:
        from app.services.forecast_service import get_day_report_with_llm
        day_report = await get_day_report_with_llm(user_id, today_str)
        forecast_text = day_report.get("llm_explanation", "")
        overall_risk = _normalize_risk(day_report.get("risk_score", 0))
    except Exception as e:
        logger.warning(f"[Dashboard] forecast failed: {e}")

    # ── Cycle stats ──────────────────────────────────────────────────────────
    cycle_stats = {}
    cycle_phase = ""
    cycle_day = 0
    if user.get("gender") == "female":
        try:
            from app.services.cycle_service import get_cycle_stats
            cycle_stats = await get_cycle_stats(user_id)
            
            # Get current cycle phase
            last_period_start = user.get("last_period_start")
            if last_period_start:
                from app.pipelines.menstrual_pipeline.core.cycle_tracker import get_cycle_phase
                phase_data = get_cycle_phase(
                    last_period_start=last_period_start,
                    cycle_length=cycle_stats.get("average_cycle_length", 28),
                    target_date=datetime.now(timezone.utc).date()
                )
                cycle_phase = phase_data.get("phase", "")
                cycle_day = phase_data.get("day_of_cycle", 0)
        except Exception as e:
            logger.warning(f"[Dashboard] cycle stats failed: {e}")

    # ── Personalized trigger events ──────────────────────────────────────────
    # Fully learned from user's own food_logs + face_logs.
    # No hardcoded dairy/keyword lists.
    try:
        trigger_events = await get_personalized_trigger_events(db, user_id)
    except Exception as e:
        logger.warning(f"[Dashboard] trigger detection failed: {e}")
        trigger_events = []

    # ── Active products summary ───────────────────────────────────────────────
    active_products = []
    async for doc in db["user_products"].find({"user_id": user_id, "is_active": True}):
        active_products.append({
            "name": doc.get("product_name", ""),
            "comedogenic_score": doc.get("comedogenic_score", 0),
        })

    return {
        "skin_scores": skin_scores,
        "forecast": forecast_text or "Log data to get AI insights.",
        "risk_score": overall_risk,
        "trigger_events": trigger_events,
        "active_products": active_products,
        "cycle_stats": cycle_stats,
        "cycle_phase": cycle_phase,
        "cycle_day": cycle_day,
    }
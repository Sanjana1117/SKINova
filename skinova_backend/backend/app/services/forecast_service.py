# app/services/forecast_service.py

import logging
from datetime import datetime, timedelta
from app.db.mongodb import get_db
from app.pipelines.forecast_pipeline.tft_pipeline import run_tft_pipeline
from app.pipelines.forecast_pipeline.post_process import map_risk_level
from app.services.shap_explainer import get_top_triggers, generate_llm_explanation

logger = logging.getLogger(__name__)

DAIRY_KEYWORDS = {"milk", "cheese", "butter", "cream", "yogurt", "curd", "ghee",
                  "paneer", "dairy", "whey", "lactose", "lassi", "kheer", "rabri"}


def _date_range(start_str: str, end_str: str) -> list:
    start = datetime.fromisoformat(start_str.replace("Z", "")[:10])
    end   = datetime.fromisoformat(end_str.replace("Z", "")[:10])
    days, cur = [], start
    while cur <= end:
        days.append(cur.strftime("%Y-%m-%d"))
        cur += timedelta(days=1)
    return days


def _to_date(ts) -> str:
    if isinstance(ts, datetime):
        return ts.strftime("%Y-%m-%d")
    if isinstance(ts, str):
        return ts.replace("Z", "").split("T")[0][:10]
    return ""


def _has_dairy(doc: dict) -> bool:
    text = " ".join([str(doc.get("food_name", "")),
                     " ".join(doc.get("ingredients", []))]).lower()
    return any(kw in text for kw in DAIRY_KEYWORDS)


async def _get_product_risk(user_id: str, db) -> float:
    """
    Returns 0–1 aggregate comedogenic risk from user's active product registry.
    Products are registered once; this score is applied as a constant daily covariate.
    """
    scores = []
    async for doc in db["user_products"].find({"user_id": user_id, "is_active": True}):
        scores.append(float(doc.get("comedogenic_score", 0)))
    if not scores:
        return 0.0
    return min(1.0, max(scores) / 5.0)  # worst active product dominates


async def generate_forecast(user_id: str, start_date: str, end_date: str) -> list:
    db    = get_db()
    dates = _date_range(start_date, end_date)

    face_logs, food_logs = [], []
    async for d in db["face_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(90):
        face_logs.append(d)
    async for d in db["food_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(90):
        food_logs.append(d)

    cycle_doc = None
    async for d in db["cycles"].find({"user_id": user_id}).sort("_id", -1).limit(1):
        cycle_doc = d

    skin_map:   dict[str, float] = {}
    lesion_map: dict[str, float] = {}
    for d in face_logs:
        key = _to_date(d.get("timestamp"))
        raw = float(d.get("skin_score", 0) or 0)
        skin_map[key]   = (100.0 - raw) / 100.0
        lesion_map[key] = float(d.get("lesion_count", 0) or 0)

    food_map: dict[str, float] = {}
    for d in food_logs:
        key = _to_date(d.get("timestamp"))
        raw = float(d.get("risk_score", 0) or 0)
        food_map[key] = max(food_map.get(key, 0.0), raw / 100.0)

    # Product risk: one constant value from registry (not per-day logs)
    product_risk = await _get_product_risk(user_id, db)

    phase_to_idx = {"Menstrual": 0, "Follicular": 1, "Ovulatory": 2, "Luteal": 3}
    cycle_map: dict[str, int] = {}
    if cycle_doc:
        for p in cycle_doc.get("predictions", []):
            cycle_map[p.get("date", "")[:10]] = phase_to_idx.get(p.get("phase", "Follicular"), 1)

    logger.info(
        f"[Forecast] user={user_id} | face={len(face_logs)} skin_keys={list(skin_map.keys())[:3]} | "
        f"food={len(food_logs)} food_keys={list(food_map.keys())[:3]} | product_risk={product_risk:.2f}"
    )

    timeline     = [{"date": d} for d in dates]
    skin_list    = [{"score": skin_map.get(d, 0.0)}    for d in dates]
    food_list    = [{"score": food_map.get(d, 0.0)}    for d in dates]
    # Product risk is constant across all dates (registered products don't change daily)
    product_list = [{"score": product_risk}             for d in dates]
    cycle_list   = [{"phase": cycle_map.get(d, 1)}     for d in dates]
    lesion_list  = [{"count": lesion_map.get(d, 0.0)}  for d in dates]

    try:
        raw = run_tft_pipeline({
            "timeline": timeline, "skin": skin_list, "food": food_list,
            "cycle": cycle_list, "products": product_list, "lesions": lesion_list,
        })
    except Exception as e:
        logger.error(f"[Forecast] TFT failed: {e} — weighted fallback")
        phase_weights = {0: 1.2, 1: 0.8, 2: 0.7, 3: 1.5}
        raw = []
        for d in dates:
            s  = skin_map.get(d, 0.0)
            f  = food_map.get(d, 0.0)
            l  = min(lesion_map.get(d, 0.0) / 10.0, 1.0)
            pw = phase_weights.get(cycle_map.get(d, 1), 1.0)
            score = min(1.0, (s * 0.4 + f * 0.35 + l * 0.15 + product_risk * 0.1) * pw)
            raw.append({"date": d, "risk_score": round(score, 3)})

    results = []
    for r in raw:
        score = max(0.0, min(1.0, float(r.get("risk_score", 0))))
        results.append({
            "date":          r["date"],
            "risk_score":    round(score, 3),
            "trigger_level": map_risk_level(score),
            "trigger_count": int(score * 5),
        })

    try:
        await db["forecasts"].insert_one({
            "user_id": user_id, "start_date": start_date,
            "end_date": end_date, "results": results,
            "timestamp": datetime.utcnow(),
        })
    except Exception as e:
        logger.error(f"[Forecast] DB save: {e}")

    return results


async def get_day_report(user_id: str, date: str) -> dict:
    db  = get_db()
    day = _to_date(date)

    face_log = None
    async for doc in db["face_logs"].find({"user_id": user_id}).sort("timestamp", -1):
        if _to_date(doc.get("timestamp")) == day:
            doc.pop("_id", None)
            face_log = doc
            break

    food_logs_day = []
    async for doc in db["food_logs"].find({"user_id": user_id}):
        if _to_date(doc.get("timestamp")) == day:
            doc.pop("_id", None)
            food_logs_day.append(doc)

    logger.info(
        f"[DayReport] user={user_id} day={day} | "
        f"face={'FOUND=' + str(face_log.get('primary_condition')) if face_log else 'MISSING'} | "
        f"food={len(food_logs_day)} {[f.get('food_name') for f in food_logs_day]}"
    )

    risk_score = None
    async for doc in db["forecasts"].find({"user_id": user_id}).sort("timestamp", -1).limit(10):
        for r in doc.get("results", []):
            if _to_date(r.get("date", "")) == day:
                risk_score = r.get("risk_score")
                break
        if risk_score is not None:
            break

    if risk_score is None and (face_log or food_logs_day):
        skin_r   = (100.0 - float(face_log.get("skin_score", 50) or 50)) / 100.0 if face_log else 0.0
        food_r   = max((float(f.get("risk_score", 0) or 0) / 100.0 for f in food_logs_day), default=0.0)
        lesion_r = min(float(face_log.get("lesion_count", 0) or 0) / 10.0, 1.0) if face_log else 0.0
        product_r = await _get_product_risk(user_id, db)
        base = skin_r * 0.4 + food_r * 0.35 + lesion_r * 0.15 + product_r * 0.1
        risk_score = round(max(0.05, min(1.0, base)), 3)
        logger.info(f"[DayReport] Inline fallback risk={risk_score}")

    triggers = []
    if face_log and face_log.get("primary_condition") not in ["Normal", "Pending", None]:
        triggers.append(f"Skin: {face_log.get('primary_condition')}")
    for fl in food_logs_day:
        t = fl.get("trigger", "")
        if t and "low risk" not in t.lower() and t != "None":
            triggers.append(f"Food: {t}")
        if _has_dairy(fl):
            triggers.append(f"Dairy detected: {fl.get('food_name', '')}")

    return {
        "date":         day,
        "condition":    face_log.get("primary_condition", "No scan") if face_log else "No scan",
        "triggers":     triggers or ["No triggers detected"],
        "risk_score":   int((risk_score or 0) * 100),
        "skin_score":   face_log.get("skin_score") if face_log else None,
        "lesion_count": face_log.get("lesion_count", 0) if face_log else 0,
        "food_logs":    food_logs_day,
    }


async def get_day_report_with_llm(user_id: str, date: str) -> dict:
    db   = get_db()
    base = await get_day_report(user_id, date)
    day  = _to_date(date)

    lesion_count   = float(base.get("lesion_count") or 0)
    food_risk_norm = 0.0
    dairy_flag     = 0.0
    for doc in base.get("food_logs", []):
        raw = float(doc.get("risk_score", 0) or 0)
        food_risk_norm = max(food_risk_norm, raw / 100.0)
        if _has_dairy(doc):
            dairy_flag = 1.0

    # Get active products for LLaMA context
    active_products = []
    async for doc in db["user_products"].find({"user_id": user_id, "is_active": True}):
        active_products.append({
            "name":              doc.get("product_name", ""),
            "comedogenic_score": doc.get("comedogenic_score", 0),
            "flagged":           doc.get("flagged_ingredients", [])[:3],
        })

    user_data = {
        "Dairy_content":           dairy_flag,
        "hormonal_state_enc":      1,
        "lesion_count":            lesion_count,
        "inflammatory_food_score": food_risk_norm,
        "_has_sleep_data":         False,
    }

    phase = "Follicular"
    async for doc in db["cycles"].find({"user_id": user_id}).sort("_id", -1).limit(1):
        for p in doc.get("predictions", []):
            if _to_date(p.get("date", "")) == day:
                phase = p.get("phase", "Follicular")
                user_data["hormonal_state_enc"] = {
                    "Menstrual": 0, "Follicular": 1, "Luteal": 2, "Ovulatory": 1
                }.get(phase, 1)
                break

    shap_triggers = get_top_triggers(user_data)
    risk_float    = (base.get("risk_score") or 0) / 100.0

    explanation = await generate_llm_explanation(
        risk_score=risk_float,
        triggers=shap_triggers,
        phase=phase,
        condition=base.get("condition", "Normal"),
        food_logs=base.get("food_logs", []),
        lesion_count=int(lesion_count),
        skin_score=int(base.get("skin_score") or 100),
        active_products=active_products,
    )

    base["shap_triggers"]   = shap_triggers
    base["llm_explanation"] = explanation
    base["cycle_phase"]     = phase
    base.pop("recommendations", None)
    return base
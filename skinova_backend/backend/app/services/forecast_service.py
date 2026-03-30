# app/services/forecast_service.py

import logging
from datetime import datetime, timedelta
from app.db.mongodb import get_db
from app.pipelines.forecast_pipeline.tft_pipeline import run_tft_pipeline
from app.pipelines.forecast_pipeline.post_process import map_risk_level

logger = logging.getLogger(__name__)

# ── SHAP weights from TFT training ────────────────────────────────
SHAP_WEIGHTS = {
    "Dairy_content":           0.284,
    "hormonal_state_enc":      0.221,
    "sleep_hours":             0.187,
    "lesion_count":            0.156,
    "inflammatory_food_score": 0.132,
}
SHAP_LABELS = {
    "Dairy_content":           "Dairy intake",
    "hormonal_state_enc":      "Hormonal phase",
    "sleep_hours":             "Sleep quality",
    "lesion_count":            "Active lesions",
    "inflammatory_food_score": "Inflammatory food score",
}

GROQ_API_KEY = "YOUR_GROQ_API_KEY"   # ← paste your key here
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "meta-llama/llama-4-scout-17b-16e-instruct"


def _date_range(start_str: str, end_str: str):
    start = datetime.fromisoformat(start_str.replace("Z", "")[:10])
    end   = datetime.fromisoformat(end_str.replace("Z", "")[:10])
    days, cur = [], start
    while cur <= end:
        days.append(cur.strftime("%Y-%m-%d"))
        cur += timedelta(days=1)
    return days


def _ts_to_date(ts) -> str:
    if isinstance(ts, datetime): return ts.strftime("%Y-%m-%d")
    if isinstance(ts, str):      return ts[:10]
    return ""


def _compute_shap_triggers(user_data: dict) -> list:
    """Compute per-user SHAP impact = weight × normalized user value."""
    triggers = []
    for feature, shap_w in SHAP_WEIGHTS.items():
        raw = float(user_data.get(feature, 0) or 0)
        if feature == "sleep_hours":
            norm = max(0.0, (8.0 - raw) / 8.0)
        elif feature == "hormonal_state_enc":
            norm = {0: 0.4, 1: 0.2, 2: 0.9}.get(int(raw), 0.5)
        else:
            norm = min(raw, 1.0)
        triggers.append({
            "feature":     feature,
            "label":       SHAP_LABELS[feature],
            "shap_weight": shap_w,
            "user_value":  raw,
            "impact":      round(shap_w * norm, 3),
        })
    triggers.sort(key=lambda x: x["impact"], reverse=True)
    return triggers[:5]


async def _call_llama(risk_score: float, triggers: list, phase: str) -> str:
    """Call LLaMA 4 via Groq. Falls back to rule-based if key missing."""
    if GROQ_API_KEY == "YOUR_GROQ_API_KEY":
        return _fallback_explanation(risk_score, triggers, phase)
    try:
        import httpx
        trigger_text = "\n".join([
            f"- {t['label']}: SHAP impact {t['impact']:.3f}"
            for t in triggers[:3]
        ])
        prompt = f"""You are Skinova's AI skin advisor. Write a SHORT 2-3 sentence personalized skin forecast.

Risk Score: {int(risk_score * 100)}%
Hormonal Phase: {phase}
Top triggers by SHAP analysis:
{trigger_text}

Style: warm, specific, actionable. No disclaimers. No bullet points. Plain text only."""

        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}],
                      "max_tokens": 150, "temperature": 0.7},
            )
            return res.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.error(f"LLaMA call failed: {e}")
        return _fallback_explanation(risk_score, triggers, phase)


def _fallback_explanation(risk_score: float, triggers: list, phase: str) -> str:
    top = triggers[0]["label"] if triggers else "dietary triggers"
    if risk_score >= 0.7:
        return f"Your skin is at high risk of a flare in the coming days. The biggest contributing factor is {top} — consider reducing it for the next 48–72 hours. Stay hydrated and keep your skincare routine minimal."
    elif risk_score >= 0.4:
        return f"Your skin shows moderate flare risk. {top} is the primary driver — monitor your intake and watch for early signs. A gentle routine is recommended."
    return f"Your skin looks stable. {top} remains your most impactful variable to watch. Keep up your current routine."


def _get_recommendation(score):
    if score is None: return "Log your skin and food data for personalized recommendations."
    if score >= 0.7:  return "High risk day. Avoid dairy, sugar, and heavy products. Stay hydrated."
    if score >= 0.4:  return "Moderate risk. Monitor triggers and keep skincare routine light."
    return "Low risk day. Great time to try new products or treatments."


async def generate_forecast(user_id: str, start_date: str, end_date: str) -> list:
    db    = get_db()
    dates = _date_range(start_date, end_date)

    face_logs, food_logs, product_logs = [], [], []
    async for d in db["face_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(60):
        face_logs.append(d)
    async for d in db["food_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(60):
        food_logs.append(d)
    async for d in db["product_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(60):
        product_logs.append(d)

    cycle_doc = None
    async for d in db["cycles"].find({"user_id": user_id}).sort("_id", -1).limit(1):
        cycle_doc = d

    skin_map    = {_ts_to_date(d.get("timestamp")): d.get("skin_score", 0)  for d in face_logs}
    food_map    = {_ts_to_date(d.get("timestamp")): d.get("risk_score", 0)  for d in food_logs}
    product_map = {_ts_to_date(d.get("timestamp")): d.get("score", 0)       for d in product_logs}

    cycle_map = {}
    if cycle_doc:
        for p in cycle_doc.get("predictions", []):
            phase_index = {"Menstrual": 0, "Follicular": 1, "Ovulatory": 2, "Luteal": 3}.get(p.get("phase"), 1)
            cycle_map[p["date"][:10]] = phase_index

    timeline     = [{"date": d} for d in dates]
    skin_list    = [{"score": skin_map.get(d, 0)}    for d in dates]
    food_list    = [{"score": food_map.get(d, 0)}    for d in dates]
    product_list = [{"score": product_map.get(d, 0)} for d in dates]
    cycle_list   = [{"phase": cycle_map.get(d, 1)}   for d in dates]

    try:
        raw = run_tft_pipeline({
            "timeline": timeline, "skin": skin_list,
            "food": food_list, "cycle": cycle_list, "products": product_list,
        })
    except Exception as e:
        logger.error(f"TFT failed: {e}")
        raw = [{"date": d, "risk_score": 0.0} for d in dates]

    results = []
    for r in raw:
        score = r["risk_score"]
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
        logger.error(f"Forecast DB save: {e}")

    return results


async def get_day_report(user_id: str, date: str) -> dict:
    db  = get_db()
    day = date[:10]

    face_log = None
    async for doc in db["face_logs"].find({"user_id": user_id}).sort("timestamp", -1):
        if _ts_to_date(doc.get("timestamp")) == day:
            doc.pop("_id", None)
            face_log = doc
            break

    food_logs = []
    async for doc in db["food_logs"].find({"user_id": user_id}):
        if _ts_to_date(doc.get("timestamp")) == day:
            doc.pop("_id", None)
            food_logs.append(doc)

    risk_score = None
    async for doc in db["forecasts"].find({"user_id": user_id}).sort("timestamp", -1).limit(5):
        for r in doc.get("results", []):
            if r.get("date", "")[:10] == day:
                risk_score = r.get("risk_score")
                break
        if risk_score is not None:
            break

    triggers = []
    if face_log and face_log.get("primary_condition") not in ["Normal", "Pending", None]:
        triggers.append(f"Skin: {face_log.get('primary_condition')}")
    for fl in food_logs:
        if fl.get("trigger") and fl.get("trigger") != "None":
            triggers.append(f"Food: {fl.get('trigger')}")

    return {
        "date":         day,
        "condition":    face_log.get("primary_condition", "No data") if face_log else "No scan",
        "triggers":     triggers or ["No triggers detected"],
        "recommendations": _get_recommendation(risk_score),
        "risk_score":   int((risk_score or 0) * 100),
        "skin_score":   face_log.get("skin_score") if face_log else None,
        "food_logs":    food_logs,
    }


async def get_day_report_with_llm(user_id: str, date: str) -> dict:
    """Full report with SHAP triggers + LLaMA 4 explanation."""
    db   = get_db()
    base = await get_day_report(user_id, date)
    day  = date[:10]

    # Build user_data for SHAP
    user_data = {
        "Dairy_content":           0.0,
        "hormonal_state_enc":      1,
        "sleep_hours":             7.0,
        "lesion_count":            (base.get("skin_score") or 50) / 10,
        "inflammatory_food_score": (base.get("risk_score") or 0) / 100,
    }
    phase = "Follicular"

    # Pull cycle phase
    async for doc in db["cycles"].find({"user_id": user_id}).sort("_id", -1).limit(1):
        for p in doc.get("predictions", []):
            if p.get("date", "")[:10] == day:
                phase = p.get("phase", "Follicular")
                user_data["hormonal_state_enc"] = {"Menstrual": 0, "Follicular": 1, "Luteal": 2, "Ovulatory": 1}.get(phase, 1)
                break

    # Pull food nutritional profile
    async for doc in db["food_logs"].find({"user_id": user_id}):
        if _ts_to_date(doc.get("timestamp")) == day:
            prof = doc
            if prof.get("Dairy_content", 0) > 0:
                user_data["Dairy_content"] = 1.0
            user_data["inflammatory_food_score"] = max(
                user_data["inflammatory_food_score"],
                float(prof.get("inflammatory_food_score", 0))
            )

    shap_triggers = _compute_shap_triggers(user_data)
    risk_float    = (base.get("risk_score") or 0) / 100
    explanation   = await _call_llama(risk_float, shap_triggers, phase)

    base["shap_triggers"]   = shap_triggers
    base["llm_explanation"] = explanation
    base["cycle_phase"]     = phase
    return base
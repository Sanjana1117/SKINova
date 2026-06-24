# app/services/tft_service.py
"""
Delegates to forecast_service.py — the single source of truth for TFT + LLaMA.
The old external TFT_MODEL_URL / LLAMA_MODEL_URL endpoints are removed;
everything runs through the local pipeline + Groq.
"""
import logging
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from app.db.mongodb import get_db

logger = logging.getLogger(__name__)


async def update_tft(user_id: str) -> dict:
    """Force-regenerate the forecast for today + next 7 days."""
    from app.services.forecast_service import generate_forecast

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    end   = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")

    results = await generate_forecast(user_id, today, end)
    logger.info(f"TFT update triggered manually for {user_id}, {len(results)} days")
    return {"status": "updated", "days": len(results), "results": results}


async def get_tft_report(user_id: str) -> dict:
    """Return the latest stored forecast + today's LLM day report."""
    from app.services.forecast_service import get_day_report_with_llm

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Check a forecast exists; if not, generate one first
    db = get_db()
    forecast = await db["forecasts"].find_one({"user_id": user_id}, sort=[("timestamp", -1)])
    if not forecast:
        await update_tft(user_id)

    day_report = await get_day_report_with_llm(user_id, today)

    return {
        "date":            today,
        "risk_score":      day_report.get("risk_score"),
        "trigger_level":   "High" if day_report.get("risk_score", 0) >= 70
                           else "Moderate" if day_report.get("risk_score", 0) >= 40
                           else "Low",
        "condition":       day_report.get("condition"),
        "llm_explanation": day_report.get("llm_explanation"),
        "shap_triggers":   day_report.get("shap_triggers"),
        "recommendations": day_report.get("recommendations"),
        "cycle_phase":     day_report.get("cycle_phase"),
    }
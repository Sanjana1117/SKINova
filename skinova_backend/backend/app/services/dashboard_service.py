from datetime import datetime, timezone, timedelta
import httpx
import logging
from fastapi import HTTPException
from app.db.mongodb import get_db
from app.config import settings
from bson import ObjectId

logger = logging.getLogger(__name__)


async def _call_bilstm_model(last_period_end_date: str) -> str:
    if not settings.BILSTM_MODEL_URL:
        raise HTTPException(status_code=503, detail="BiLSTM model endpoint not configured")
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            settings.BILSTM_MODEL_URL,
            json={"last_period_end_date": last_period_end_date},
        )
        resp.raise_for_status()
        data = resp.json()
    return data.get("phase", "")


async def get_dashboard(user_id: str) -> dict:
    db = get_db()

    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

    skin_score_timeline = []
    async for doc in db["face_logs"].find(
        {"user_id": user_id, "timestamp": {"$gte": seven_days_ago}}
    ).sort("timestamp", 1):
        skin_score_timeline.append({
            "date": doc["timestamp"].strftime("%Y-%m-%d") if hasattr(doc["timestamp"], "strftime") else str(doc["timestamp"]),
            "score": doc.get("overall_skin_score", 0.0),
        })

    latest_forecast = await db["forecasts"].find_one(
        {"user_id": user_id}, sort=[("timestamp", -1)]
    )
    if latest_forecast:
        latest_forecast.pop("_id", None)
        if "timestamp" in latest_forecast and hasattr(latest_forecast["timestamp"], "isoformat"):
            latest_forecast["timestamp"] = latest_forecast["timestamp"].isoformat()

    trigger_timeline = []
    async for doc in db["triggers"].find(
        {"user_id": user_id, "timestamp": {"$gte": seven_days_ago}}
    ).sort("timestamp", 1):
        trigger_timeline.append({
            "date": doc.get("date"),
            "triggers": doc.get("triggers", []),
            "source": doc.get("source", ""),
        })

    hormonal_phase = None
    if user.get("gender", "").lower() == "female" and user.get("last_period_end_date"):
        hormonal_phase = await _call_bilstm_model(user["last_period_end_date"])

    return {
        "skin_score_timeline": skin_score_timeline,
        "forecast": latest_forecast,
        "trigger_timeline": trigger_timeline,
        "hormonal_phase": hormonal_phase,
    }

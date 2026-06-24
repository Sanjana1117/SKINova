# app/services/face_service.py

import logging
from datetime import datetime, timezone, timedelta
from fastapi import UploadFile
from app.db.mongodb import get_db

logger = logging.getLogger(__name__)


async def analyze_face(user_id: str, image: UploadFile) -> dict:
    image_bytes = await image.read()

    try:
        from app.pipelines.skin_pipeline.skin_pipeline import run_skin_pipeline
        result = run_skin_pipeline(image_bytes)
        logger.info(f"Skin pipeline ran. Models used: {result.get('models_used')}")
    except Exception as e:
        logger.error(f"Skin pipeline failed, using mock: {e}")
        result = _mock_result()

    try:
        db = get_db()
        log_doc = {
            "user_id":   user_id,
            "timestamp": datetime.now(timezone.utc),
            **result,
        }
        res = await db["face_logs"].insert_one(log_doc)
        log_doc["id"] = str(res.inserted_id)
        log_doc["timestamp"] = log_doc["timestamp"].isoformat()
        log_doc.pop("_id", None)

        # Refresh forecast so today's face scan is reflected immediately
        await _refresh_forecast(user_id)

        return log_doc
    except Exception as e:
        logger.error(f"DB save failed: {e}")
        result["id"] = "no-db"
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        return result


async def get_face_logs(user_id: str) -> list:
    try:
        db = get_db()
        logs = []
        async for doc in db["face_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(30):
            doc["id"] = str(doc.pop("_id"))
            if hasattr(doc.get("timestamp"), "isoformat"):
                doc["timestamp"] = doc["timestamp"].isoformat()
            logs.append(doc)
        return logs
    except Exception as e:
        logger.error(f"get_face_logs failed: {e}")
        return []


async def _refresh_forecast(user_id: str):
    """Re-run forecast for today + 7 days so day report is never stale after a new log."""
    try:
        from app.services.forecast_service import generate_forecast
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        end   = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
        await generate_forecast(user_id, today, end)
        logger.info(f"Forecast refreshed for {user_id} after face log")
    except Exception as e:
        logger.error(f"Forecast refresh failed: {e}")


def _mock_result() -> dict:
    return {
        "primary_condition": "Acne",
        "skin_score":        72.5,
        "severity":          "Mild",
        "lesion_count":      3,
        "lesion_breakdown":  {"Pustule": 2, "Papule": 1},
        "confidence":        0.84,
        "models_used":       [],
        "mock":              True,
    }
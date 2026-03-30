# app/services/face_service.py
# Works with real models if available, falls back to mock for demo

import logging
from datetime import datetime, timezone
from fastapi import UploadFile
from app.db.mongodb import get_db

logger = logging.getLogger(__name__)


async def analyze_face(user_id: str, image: UploadFile) -> dict:
    image_bytes = await image.read()

    # ── Try real pipeline ──────────────────────────────────────────
    try:
        from app.pipelines.skin_pipeline.skin_pipeline import run_skin_pipeline
        result = run_skin_pipeline(image_bytes)
        logger.info(f"Skin pipeline ran. Models used: {result.get('models_used')}")
    except Exception as e:
        logger.error(f"Skin pipeline failed, using mock: {e}")
        result = _mock_result()

    # ── Save to MongoDB ────────────────────────────────────────────
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


def _mock_result() -> dict:
    """Returned when model files are not present — safe for demo."""
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
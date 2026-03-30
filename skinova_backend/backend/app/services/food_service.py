# app/services/food_service.py
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import UploadFile, HTTPException
from app.db.mongodb import get_db

logger = logging.getLogger(__name__)


async def analyze_food(user_id: str, barcode=None, text=None, image: Optional[UploadFile] = None):
    from app.pipelines.food_pipeline.vit_pipeline import run_vit_pipeline

    result = {}

    if image:
        image_bytes = await image.read()
        result = run_vit_pipeline(image_bytes)
    elif text:
        # text mode — simple keyword risk check
        ingredients = [t.strip() for t in text.split(",")]
        bad = [i for i in ingredients if any(w in i.lower() for w in ["sugar","oil","dairy","cream","butter","fried"])]
        risk = min(len(bad) * 20, 90)
        result = {"food_name": text[:40], "risk_score": risk,
                  "trigger": ", ".join(bad) if bad else "None", "confidence": 1.0, "mock": False,
                  "ingredients": ingredients}
    else:
        raise HTTPException(status_code=400, detail="Provide image or text")

    log_doc = {
        "user_id":   user_id,
        "food_name": result.get("food_name", "Unknown"),
        "risk_score": result.get("risk_score", 0),
        "trigger":   result.get("trigger", ""),
        "confidence": result.get("confidence", 0),
        "ingredients": result.get("ingredients", [result.get("food_name","")]),
        "mock":      result.get("mock", False),
        "timestamp": datetime.now(timezone.utc),
    }
    log_doc.update(result)
    try:
        db = get_db()
        res = await db["food_logs"].insert_one(log_doc)
        log_doc["id"] = str(res.inserted_id)
    except Exception as e:
        logger.error(f"DB save failed: {e}")
        log_doc["id"] = "no-db"

    log_doc.pop("_id", None)
    log_doc["timestamp"] = datetime.now(timezone.utc).isoformat()
    return log_doc


async def get_food_logs(user_id: str):
    try:
        db = get_db()
        logs = []
        async for doc in db["food_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(30):
            doc["id"] = str(doc.pop("_id"))
            if hasattr(doc.get("timestamp"), "isoformat"):
                doc["timestamp"] = doc["timestamp"].isoformat()
            logs.append(doc)
        return logs
    except Exception as e:
        logger.error(f"get_food_logs: {e}")
        return []
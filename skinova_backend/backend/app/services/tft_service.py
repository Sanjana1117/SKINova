from datetime import datetime, timezone
import httpx
import logging
from fastapi import HTTPException
from app.db.mongodb import get_db
from app.config import settings

logger = logging.getLogger(__name__)


async def _call_tft_model(payload: dict) -> dict:
    if not settings.TFT_MODEL_URL:
        raise HTTPException(status_code=503, detail="TFT model endpoint not configured")
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(settings.TFT_MODEL_URL, json=payload)
        resp.raise_for_status()
        return resp.json()


async def _call_llama_model(tft_output: dict) -> dict:
    if not settings.LLAMA_MODEL_URL:
        raise HTTPException(status_code=503, detail="LLaMA model endpoint not configured")
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(settings.LLAMA_MODEL_URL, json=tft_output)
        resp.raise_for_status()
        return resp.json()


async def update_tft(user_id: str) -> dict:
    db = get_db()

    user = await db["users"].find_one({"_id": __import__("bson").ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    food_logs = []
    async for doc in db["food_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(30):
        doc["_id"] = str(doc["_id"])
        food_logs.append(doc)

    product_logs = []
    async for doc in db["product_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(30):
        doc["_id"] = str(doc["_id"])
        product_logs.append(doc)

    face_logs = []
    async for doc in db["face_logs"].find({"user_id": user_id}).sort("timestamp", -1).limit(30):
        doc["_id"] = str(doc["_id"])
        face_logs.append(doc)

    tft_payload = {
        "user_profile": {
            "gender": user.get("gender"),
            "skin_type": user.get("skin_type"),
            "bmi": user.get("bmi"),
            "allergens": user.get("allergens", []),
            "drugs": user.get("drugs"),
        },
        "food_logs": food_logs,
        "product_logs": product_logs,
        "face_logs": face_logs,
    }

    tft_output = await _call_tft_model(tft_payload)
    llama_output = await _call_llama_model(tft_output)

    forecast_doc = {
        "user_id": user_id,
        "forecast": llama_output.get("forecast", ""),
        "trigger_timeline": tft_output.get("trigger_timeline", []),
        "recommendations": llama_output.get("recommendations", ""),
        "timestamp": datetime.now(timezone.utc),
    }

    await db["forecasts"].insert_one(forecast_doc.copy())

    for trigger in tft_output.get("trigger_timeline", []):
        trigger_doc = {
            "user_id": user_id,
            "date": trigger.get("date"),
            "triggers": trigger.get("triggers", []),
            "source": trigger.get("source", "tft"),
            "timestamp": datetime.now(timezone.utc),
        }
        await db["triggers"].insert_one(trigger_doc)

    forecast_doc.pop("_id", None)
    return forecast_doc


async def get_tft_report(user_id: str) -> dict:
    db = get_db()
    forecast = await db["forecasts"].find_one(
        {"user_id": user_id}, sort=[("timestamp", -1)]
    )
    if not forecast:
        raise HTTPException(status_code=404, detail="No TFT report found. Run /api/tft/update first.")
    forecast.pop("_id", None)
    if "timestamp" in forecast and hasattr(forecast["timestamp"], "isoformat"):
        forecast["timestamp"] = forecast["timestamp"].isoformat()
    return {
        "forecast": forecast.get("forecast", ""),
        "trigger_timeline": forecast.get("trigger_timeline", []),
        "recommendations": forecast.get("recommendations", ""),
    }

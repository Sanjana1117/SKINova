from datetime import datetime, timezone
from typing import Optional
import httpx
import logging
from fastapi import UploadFile, HTTPException
from app.db.mongodb import get_db
from app.utils.s3 import upload_image
from app.utils.openfood import get_product_by_barcode
from app.config import settings
from bson import ObjectId

logger = logging.getLogger(__name__)


async def _call_vit_model(image_url: str) -> dict:
    if not settings.VIT_MODEL_URL:
        raise HTTPException(status_code=503, detail="ViT food model endpoint not configured")
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(settings.VIT_MODEL_URL, json={"image_url": image_url})
        resp.raise_for_status()
        return resp.json()


async def _call_food_text_model(text: str) -> dict:
    if not settings.FOOD_MODEL_URL:
        raise HTTPException(status_code=503, detail="Food text model endpoint not configured")
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(settings.FOOD_MODEL_URL, json={"text": text})
        resp.raise_for_status()
        return resp.json()


async def analyze_food(
    user_id: str,
    barcode: Optional[str] = None,
    text: Optional[str] = None,
    image: Optional[UploadFile] = None,
) -> dict:
    ingredients = []
    risk_score = 0.0
    triggers = []
    image_url = None

    if barcode:
        product_data = await get_product_by_barcode(barcode)
        if not product_data:
            raise HTTPException(status_code=404, detail="Product not found on OpenFoodFacts")
        combined_text = product_data.get("ingredients_text", "") or " ".join(product_data.get("ingredients", []))
        model_output = await _call_food_text_model(combined_text)
        ingredients = model_output.get("ingredients", [])
        risk_score = model_output.get("risk_score", 0.0)
        triggers = model_output.get("triggers", [])

    elif image:
        image_url = await upload_image(image, folder="food")
        model_output = await _call_vit_model(image_url)
        ingredients = model_output.get("ingredients", [])
        risk_score = model_output.get("risk_score", 0.0)
        triggers = model_output.get("triggers", [])

    elif text:
        model_output = await _call_food_text_model(text)
        ingredients = model_output.get("ingredients", [])
        risk_score = model_output.get("risk_score", 0.0)
        triggers = model_output.get("triggers", [])

    else:
        raise HTTPException(status_code=400, detail="Provide barcode, image, or text input")

    log_doc = {
        "user_id": user_id,
        "image_url": image_url,
        "ingredients": ingredients,
        "risk_score": risk_score,
        "triggers": triggers,
        "timestamp": datetime.now(timezone.utc),
    }
    db = get_db()
    result = await db["food_logs"].insert_one(log_doc)
    log_doc["id"] = str(result.inserted_id)
    log_doc["timestamp"] = log_doc["timestamp"].isoformat()
    return log_doc


async def get_food_logs(user_id: str) -> list:
    db = get_db()
    cursor = db["food_logs"].find({"user_id": user_id}).sort("timestamp", -1)
    logs = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["timestamp"] = doc["timestamp"].isoformat() if hasattr(doc["timestamp"], "isoformat") else doc["timestamp"]
        logs.append(doc)
    return logs

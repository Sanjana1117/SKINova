"""
product_service.py
Wraps the product pipeline for the /product/analyze route.
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import UploadFile, HTTPException
from app.db.mongodb import get_db
from app.pipelines.products_pipeline.product_pipeline import run_product_pipeline

logger = logging.getLogger(__name__)


async def analyze_product(
    user_id: str,
    barcode: Optional[str] = None,
    text: Optional[str] = None,
    image: Optional[UploadFile] = None,
) -> dict:

    input_data = {}

    if barcode:
        input_data["barcode"] = barcode

    elif image:
        input_data["image_bytes"] = await image.read()

    elif text:
        input_data["name"] = "Manual Entry"
        input_data["ingredients"] = text

    else:
        raise HTTPException(status_code=400, detail="Provide barcode, image, or text")

    result = await run_product_pipeline(user_id, input_data)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


async def get_product_logs(user_id: str) -> list:
    db = get_db()
    logs = []
    async for doc in db["product_logs"].find({"user_id": user_id}).sort("created_at", -1):
        doc["id"] = str(doc.pop("_id"))
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        logs.append(doc)
    return logs
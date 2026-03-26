# app/services/product_service.py

import io
import logging
import numpy as np
import httpx
from datetime import datetime
from PIL import Image

from app.db.mongodb import get_db

logger = logging.getLogger(__name__)


# 🔥 OCR FUNCTION
async def extract_text_from_image(image_bytes: bytes) -> str:
    try:
        import easyocr

        reader = easyocr.Reader(["en"], gpu=False)

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)

        results = reader.readtext(image_np, detail=0)

        return " ".join(results)

    except ImportError:
        pass

    try:
        import pytesseract

        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)

        return text.strip()

    except ImportError:
        logger.error("OCR libraries missing")
        raise RuntimeError("Install easyocr or pytesseract")


# 🔥 OPEN SOURCE API (OpenFoodFacts)
async def fetch_product(barcode: str):
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"

    async with httpx.AsyncClient() as client:
        res = await client.get(url)

    if res.status_code != 200:
        return None

    data = res.json()

    if data.get("status") != 1:
        return None

    product = data["product"]

    return {
        "name": product.get("product_name", "Unknown"),
        "ingredients": product.get("ingredients_text", ""),
    }


# 🔥 MAIN FUNCTION
async def analyze_product(user_id, barcode=None, text=None, image=None):
    # ❌ outside function
    print("DEBUG INPUT:", barcode, text, image)
    # 1️⃣ INPUT HANDLING
    if barcode:
        product = await fetch_product(barcode)
        if not product:
            raise Exception("Product not found")

        name = product["name"]
        ingredients_text = product["ingredients"]

    elif image:
        image_bytes = await image.read()
        ingredients_text = await extract_text_from_image(image_bytes)
        name = "Scanned Product"

    elif text:
        name = text
        ingredients_text = text

    else:
        raise Exception("Provide barcode, image, or text input")

    # 2️⃣ INGREDIENT PARSING
    ingredients = [
        i.strip().lower()
        for i in ingredients_text.split(",")
        if i.strip()
    ]

    # 3️⃣ TRIGGER DETECTION
    TRIGGERS = ["paraben", "silicone", "alcohol", "fragrance"]

    flagged = [
        i for i in ingredients
        if any(t in i for t in TRIGGERS)
    ]

    # 4️⃣ SIMPLE SCORE
    score = min(5, len(flagged))

    # 5️⃣ SAVE TO DB
    db = get_db()

    log = {
        "user_id": user_id,
        "product_name": name,
        "ingredients": ingredients,
        "flagged_ingredients": flagged,
        "comedogenic_score": score,
        "timestamp": datetime.utcnow(),
    }

    res = await db["product_logs"].insert_one(log)

    log["id"] = str(res.inserted_id)
    log["timestamp"] = log["timestamp"].isoformat()

    return log


# 🔥 FETCH LOGS
async def get_product_logs(user_id: str):
    db = get_db()

    logs = []
    cursor = db["product_logs"].find({"user_id": user_id}).sort("timestamp", -1)

    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc["timestamp"] = doc["timestamp"].isoformat()
        doc.pop("_id", None)
        logs.append(doc)

    return logs
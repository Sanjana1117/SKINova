from datetime import datetime
from app.pipelines.products_pipeline.api_clients import fetch_from_barcode
from app.pipelines.products_pipeline.ingredient_parser import parse_ingredients
from app.pipelines.products_pipeline.trigger_detector import detect_triggers
from app.db.mongodb import db


async def run_product_pipeline(user_id: str, input_data: dict):

    # 🔹 STEP 1: GET PRODUCT DATA
   # 🔹 IMAGE INPUT
    if input_data.get("image_bytes"):

        text = await extract_text_from_image(input_data["image_bytes"])

        product = {
            "name": "Scanned Product",
            "ingredients": text
        }

    # 🔹 BARCODE
    elif input_data.get("barcode"):
        product = fetch_from_barcode(input_data["barcode"])

    # 🔹 MANUAL
    else:
        product = {
            "name": input_data.get("name"),
            "ingredients": input_data.get("ingredients", "")
        }
    if not product:
        return {"error": "Product not found"}

    # 🔹 STEP 2: PARSE INGREDIENTS
    ingredients = parse_ingredients(product["ingredients"])

    # 🔹 STEP 3: DETECT TRIGGERS
    triggers = detect_triggers(ingredients)

    # 🔹 STEP 4: SCORE
    score = min(len(triggers), 5)  # simple logic (can upgrade later)

    # 🔹 STEP 5: SAVE TO DB
    doc = {
        "user_id": user_id,
        "product_name": product["name"],
        "ingredients": ingredients,
        "triggers": triggers,
        "score": score,
        "created_at": datetime.utcnow()
    }

    await db.product_logs.insert_one(doc)

    # 🔹 STEP 6: RETURN RESPONSE
    return {
        "product_name": product["name"],
        "ingredients": ingredients,
        "triggers": triggers,
        "score": score
    }
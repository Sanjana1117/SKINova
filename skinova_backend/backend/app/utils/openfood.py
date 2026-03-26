import httpx
import logging
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

OPENFOODFACTS_BASE_URL = "https://world.openfoodfacts.org/api/v0"


async def get_product_by_barcode(barcode: str) -> Optional[Dict[str, Any]]:
    url = f"{OPENFOODFACTS_BASE_URL}/product/{barcode}.json"
    headers = {"User-Agent": settings.OPENFOODFACTS_USER_AGENT}

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

    if data.get("status") != 1:
        logger.warning(f"Product not found on OpenFoodFacts: {barcode}")
        return None

    product = data.get("product", {})
    return {
        "product_name": product.get("product_name", ""),
        "brands": product.get("brands", ""),
        "ingredients_text": product.get("ingredients_text", ""),
        "ingredients": [
            ing.get("text", "")
            for ing in product.get("ingredients", [])
        ],
        "allergens": product.get("allergens_tags", []),
        "nutriments": product.get("nutriments", {}),
        "image_url": product.get("image_url", ""),
        "categories": product.get("categories", ""),
    }

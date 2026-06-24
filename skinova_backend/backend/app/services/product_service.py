# app/services/product_service.py
"""
Product Registry Service
- IMAGE FLOW: image → normalize to JPEG → try barcode decode → vision LLM → reads label
- vision+llm fallback: vision identifies product name → LLM looks up full ingredient list
- All ingredients feed into TFT model via _refresh_forecast
"""
import base64
import logging
import os
import json
import io
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional
from bson import ObjectId
from fastapi import UploadFile, HTTPException
from app.db.mongodb import get_db
from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)

GROQ_URL          = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL        = "meta-llama/llama-4-scout-17b-16e-instruct"
GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

COMEDOGENIC_DB = {
    "coconut oil": 4, "isopropyl myristate": 5, "isopropyl palmitate": 4,
    "lanolin": 4, "wheat germ oil": 5, "flaxseed oil": 4, "soybean oil": 3,
    "cocoa butter": 4, "acetylated lanolin": 4, "lauric acid": 4,
    "myristic acid": 3, "stearic acid": 2, "palmitic acid": 2,
    "petrolatum": 0, "mineral oil": 0, "dimethicone": 1, "cyclomethicone": 1,
    "glycerin": 0, "hyaluronic acid": 0, "niacinamide": 0, "retinol": 1,
    "salicylic acid": 0, "benzoyl peroxide": 0, "zinc oxide": 2,
    "titanium dioxide": 0, "shea butter": 0, "jojoba oil": 2,
    "argan oil": 0, "rosehip oil": 1, "marula oil": 3, "algae": 5,
    "carrageenan": 5, "sodium lauryl sulfate": 5, "ammonium lauryl sulfate": 4,
    "propylene glycol": 2, "butyl stearate": 3, "myristyl myristate": 5,
    "octyl stearate": 5, "octyl palmitate": 4, "corn oil": 3,
    "linseed oil": 4, "olive oil": 2, "avocado oil": 3,
    "sweet almond oil": 2, "grapeseed oil": 1, "sunflower oil": 0,
    "castor oil": 1, "tea tree oil": 1, "cetyl alcohol": 2,
    "beeswax": 2, "sodium chloride": 1, "fragrance": 3, "parfum": 3,
    "alcohol denat": 0, "sd alcohol": 0, "tocopherol": 2,
}

IRRITANT_DB = {
    "fragrance": {"category": "irritant", "reason": "Common allergen, can trigger inflammation"},
    "parfum": {"category": "irritant", "reason": "Common allergen, can trigger inflammation"},
    "sodium lauryl sulfate": {"category": "irritant", "reason": "Strips skin barrier, increases sensitivity"},
    "ammonium lauryl sulfate": {"category": "irritant", "reason": "Harsh surfactant, disrupts pH"},
    "alcohol denat": {"category": "drying", "reason": "Can disrupt moisture barrier with repeated use"},
    "sd alcohol": {"category": "drying", "reason": "Can disrupt moisture barrier with repeated use"},
    "methylisothiazolinone": {"category": "allergen", "reason": "Known contact allergen"},
    "methylchloroisothiazolinone": {"category": "allergen", "reason": "Known contact allergen"},
    "formaldehyde": {"category": "allergen", "reason": "Potent sensitizer"},
    "parabens": {"category": "preservative", "reason": "Some sensitivity in acne-prone skin"},
    "essential oil": {"category": "irritant", "reason": "Phototoxic potential, can cause sensitization"},
    "menthol": {"category": "irritant", "reason": "Creates false cooling, can worsen sensitive skin"},
    "citrus": {"category": "irritant", "reason": "Phototoxic, can trigger inflammation"},
    "retinol": {"category": "active", "reason": "Can cause purging and irritation initially"},
    "glycolic acid": {"category": "active", "reason": "Exfoliant — over-use disrupts barrier"},
    "salicylic acid": {"category": "active", "reason": "Effective for acne but can over-dry"},
}


def _score_ingredient(name: str) -> int:
    n = name.lower().strip()
    for key, score in COMEDOGENIC_DB.items():
        if key in n:
            return score
    return 0


def _compute_product_score(ingredients: list[str]) -> dict:
    scored     = [(ing, _score_ingredient(ing)) for ing in ingredients]
    flagged    = sorted([(ing, s) for ing, s in scored if s >= 3], key=lambda x: -x[1])
    all_scores = sorted([s for _, s in scored], reverse=True)
    top3       = all_scores[:3]
    overall    = round(sum(top3) / max(len(top3), 1), 1) if top3 else 0.0
    return {
        "comedogenic_score":   min(5.0, overall),
        "flagged_ingredients": [ing for ing, _ in flagged],
        "ingredient_scores":   {ing: s for ing, s in scored if s > 0},
    }


def _normalize_image(image_bytes: bytes) -> tuple[bytes, str]:
    """
    Convert ANY image format (HEIC, HEIF, BMP, TIFF, GIF, PNG, WEBP, JPEG …)
    to a JPEG the vision API can always consume.
    Falls back to raw bytes with best-guess MIME if Pillow can't open it.
    """
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes))
        # EXIF-aware rotation so the label isn't upside-down
        try:
            from PIL import ImageOps
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass
        # JPEG requires RGB
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=88, optimize=True)
        jpeg_bytes = out.getvalue()
        logger.info(f"[Image] Normalised to JPEG ({len(jpeg_bytes)} bytes, original {len(image_bytes)} bytes)")
        return jpeg_bytes, "image/jpeg"
    except Exception as e:
        logger.warning(f"[Image] Pillow normalisation failed ({e}), using raw bytes")
        # Best-effort MIME detection from magic bytes
        if image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
            return image_bytes, "image/png"
        if image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP":
            return image_bytes, "image/webp"
        return image_bytes, "image/jpeg"


async def _get_user_skin_context(user_id: str, db) -> dict:
    context = {"skin_type": "unknown", "acne_prone": False, "oily": False,
               "sensitive": False, "recent_flare_ingredients": [], "hormonal_pattern": False}
    try:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if user:
            context["skin_type"]  = user.get("skin_type", "unknown")
            context["acne_prone"] = user.get("acne_prone", False)
            context["sensitive"]  = user.get("sensitive_skin", False)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        bad_days = []
        async for log in db["skin_logs"].find({
            "user_id": user_id, "created_at": {"$gte": thirty_days_ago}, "skin_score": {"$lt": 60}
        }).limit(20):
            bad_days.append(log)
        if bad_days:
            context["acne_prone"] = True
        oily_count = await db["skin_logs"].count_documents({
            "user_id": user_id, "oiliness": {"$gte": 3}, "created_at": {"$gte": thirty_days_ago}
        })
        if oily_count > 5:
            context["oily"] = True
    except Exception as e:
        logger.warning(f"Could not fetch user skin context: {e}")
    return context


def _analyze_triggers_for_user(ingredients: list[str], user_context: dict) -> list[dict]:
    triggers      = []
    skin_type     = user_context.get("skin_type", "unknown").lower()
    is_oily       = user_context.get("oily", False)
    is_acne_prone = user_context.get("acne_prone", False)
    is_sensitive  = user_context.get("sensitive", False)

    for ing in ingredients:
        ing_lower     = ing.lower().strip()
        c_score       = _score_ingredient(ing)
        irritant_info = None
        for key, info in IRRITANT_DB.items():
            if key in ing_lower:
                irritant_info = info
                break
        severity = reason = category = None

        if c_score >= 4:
            severity = "high" if (is_oily or is_acne_prone) else "medium"
            reason   = (f"Highly comedogenic (score {c_score}/5) — likely to clog pores given your oily/acne-prone skin"
                        if (is_oily or is_acne_prone) else
                        f"Comedogenic (score {c_score}/5) — monitor for breakouts")
            category = "comedogenic"
        elif c_score == 3 and is_acne_prone:
            severity = "medium"
            reason   = "Moderately comedogenic — watch for congestion given your acne history"
            category = "comedogenic"

        if irritant_info:
            if irritant_info["category"] == "irritant":
                sev = "high" if is_sensitive else "medium"
                rsn = (f"{irritant_info['reason']} — especially risky for sensitive skin"
                       if is_sensitive else irritant_info["reason"])
                if severity is None or sev == "high":
                    severity = sev; reason = rsn; category = irritant_info["category"]
            elif irritant_info["category"] == "drying":
                if skin_type in ("dry", "combination") or is_sensitive:
                    severity = severity or "medium"
                    reason   = reason or f"{irritant_info['reason']} — particularly for your skin type"
                    category = category or "drying"
            elif irritant_info["category"] == "allergen":
                severity = "high"; reason = irritant_info["reason"]; category = "allergen"
            elif irritant_info["category"] == "active" and severity is None:
                severity = "low"; reason = irritant_info["reason"]; category = "active"

        if severity:
            triggers.append({"ingredient": ing, "severity": severity,
                              "reason": reason, "category": category, "comedogenic_score": c_score})

    order = {"high": 0, "medium": 1, "low": 2}
    triggers.sort(key=lambda x: order.get(x["severity"], 3))
    return triggers[:10]


# ── Lookup helpers ─────────────────────────────────────────────────────────────

async def _lookup_barcode_api(barcode: str) -> Optional[dict]:
    urls = [
        f"https://world.openbeautyfacts.org/api/v0/product/{barcode}.json",
        f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json",
    ]
    async with httpx.AsyncClient(timeout=8.0) as client:
        for url in urls:
            try:
                r    = await client.get(url)
                data = r.json()
                if data.get("status") == 1:
                    p    = data["product"]
                    raw  = p.get("ingredients_text", "") or ""
                    ings = _parse_ingredients_text(raw)
                    if not ings:
                        ings = [t.replace("en:", "").replace("-", " ").title()
                                for t in p.get("ingredients_tags", [])]
                    if ings:
                        return {"product_name": p.get("product_name") or p.get("brands", ""),
                                "brand": p.get("brands", ""), "ingredients": ings,
                                "image_url": p.get("image_url", ""), "barcode": barcode,
                                "category": p.get("categories", ""), "source": "open_beauty_facts"}
            except Exception as e:
                logger.warning(f"API lookup failed: {e}")
    return None


async def _lookup_via_llm(query: str, is_barcode: bool = False) -> dict:
    """Identify product by name/barcode and return INCI ingredient list."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return {}

    question = f"Barcode: {query}" if is_barcode else f"Product: {query}"
    context  = ("Try to identify the product by barcode." if is_barcode
                 else "Match to the exact product line if possible.")

    prompt = f"""You are a cosmetic chemist with encyclopedic knowledge of global beauty products.

{question}
{context}

Identify this skincare/cosmetic product and provide its INCI ingredient list.
For Indian brands (Minimalist, Dot & Key, Mamaearth, Plum, WOW, mCaffeine, Himalaya, Lotus, Lakme): be confident.
For Korean brands (COSRX, Laneige, Innisfree, Some By Mi, Klairs): list actual formulas.
Never invent ingredients — omit rather than guess.

Respond ONLY with this exact JSON (no markdown):
{{
  "product_name": "exact product name",
  "brand": "brand name",
  "category": "moisturiser | cleanser | serum | sunscreen | toner | exfoliant | mask | eye cream | lip care | body lotion",
  "ingredients": ["Ingredient1", "Ingredient2"],
  "confidence": "high | medium | low",
  "notes": "brief note if approximate or unidentified"
}}"""

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res  = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}],
                      "max_tokens": 800, "temperature": 0.05},
            )
            text = res.json()["choices"][0]["message"]["content"].strip()
            text = text.replace("```json", "").replace("```", "").strip()
            data = json.loads(text)
            logger.info(f"[LLM] '{data.get('product_name')}' conf={data.get('confidence')} ings={len(data.get('ingredients', []))}")
            return data
    except Exception as e:
        logger.error(f"[LLM] lookup failed: {e}")
        return {}


async def _lookup_via_vision(image_bytes: bytes, hint_text: str = "") -> dict:
    """
    Normalise the image to JPEG, send to Groq vision model, and parse the response.
    Accepts ANY image format (HEIC, HEIF, PNG, WEBP, BMP, TIFF, JPEG …).
    """
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return {}

    # ── Normalise to JPEG so the vision API always gets a supported format ────
    norm_bytes, mime_type = _normalize_image(image_bytes)
    b64_image = base64.b64encode(norm_bytes).decode("utf-8")

    hint_line = f"\nUser hint: {hint_text}" if hint_text else ""

    prompt = f"""You are a cosmetic chemist analysing a photo of a skincare or cosmetic product.{hint_line}

Carefully examine the product label in the image and extract:
1. Product name and brand (from front label)
2. The COMPLETE ingredient list exactly as printed (usually on back/side label, starting with "Ingredients:" or "INCI:")

RULES:
- Read ingredients EXACTLY as printed — do not guess or add anything not visible
- If the ingredient list is partially visible, list only what you can clearly read
- If you cannot see the ingredient list but can identify the product by name/brand, set confidence=medium and list known ingredients from your knowledge
- Set confidence=high if you can clearly read the label
- Set confidence=medium if partial visibility or identified by brand/product name
- Set confidence=low only if image is too blurry or no useful product information is visible

Respond ONLY with this exact JSON (no markdown, no extra text):
{{
  "product_name": "product name",
  "brand": "brand name",
  "category": "moisturiser | cleanser | serum | sunscreen | toner | exfoliant | mask | eye cream | lip care | body lotion",
  "ingredients": ["Ingredient1", "Ingredient2"],
  "confidence": "high | medium | low",
  "notes": "e.g. read from label / identified by brand / partial list"
}}"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": GROQ_VISION_MODEL,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "image_url",
                             "image_url": {"url": f"data:{mime_type};base64,{b64_image}"}},
                            {"type": "text", "text": prompt},
                        ],
                    }],
                    "max_tokens": 1000,
                    "temperature": 0.05,
                },
            )
            raw = res.json()
            if "error" in raw:
                logger.warning(f"[Vision] API error: {raw['error']}")
                return {}
            text = raw["choices"][0]["message"]["content"].strip()
            text = text.replace("```json", "").replace("```", "").strip()
            data = json.loads(text)
            logger.info(f"[Vision] '{data.get('product_name')}' conf={data.get('confidence')} ings={len(data.get('ingredients', []))}")
            return data
    except Exception as e:
        logger.error(f"[Vision] lookup failed: {e}")
        return {}


def _parse_ingredients_text(text: str) -> list[str]:
    if not text:
        return []
    import re
    text  = re.sub(r"\([^)]*\)", "", text)
    parts = re.split(r"[,;]", text)
    return [p.strip().strip(".*-–").strip() for p in parts if len(p.strip()) > 1][:60]


# ── Public service functions ───────────────────────────────────────────────────

async def add_product(
    user_id:            str,
    barcode:            Optional[str]        = None,
    text:               Optional[str]        = None,
    image:              Optional[UploadFile] = None,
    manual_ingredients: Optional[str]        = None,
) -> dict:
    product_info = {}
    source       = "unknown"

    # ── Barcode flow ───────────────────────────────────────────────────────────
    if barcode:
        barcode = barcode.strip()
        result  = await _lookup_barcode_api(barcode)
        if result:
            product_info = result; source = "open_beauty_facts"
        else:
            llm_data = await _lookup_via_llm(barcode, is_barcode=True)
            if llm_data and llm_data.get("ingredients"):
                product_info = {
                    "product_name": llm_data.get("product_name", "Unknown"),
                    "brand": llm_data.get("brand", ""), "ingredients": llm_data.get("ingredients", []),
                    "image_url": "", "barcode": barcode, "category": llm_data.get("category", ""),
                    "llm_notes": llm_data.get("notes", ""), "llm_confidence": llm_data.get("confidence", "low"),
                }
                source = "llm"
            else:
                raise HTTPException(status_code=404,
                    detail=f"Could not identify barcode {barcode}. Try the product name or upload a label photo.")

    # ── Image flow ─────────────────────────────────────────────────────────────
    elif image:
        raw_bytes = await image.read()
        if not raw_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        logger.info(f"[Product] Image received: {len(raw_bytes)} bytes, content_type={image.content_type!r}")

        # Normalise to JPEG once — used for both barcode decode and vision
        norm_bytes, _ = _normalize_image(raw_bytes)

        # Step 1: try fast barcode decode on the normalised image
        barcode_from_img = _decode_barcode_from_image(norm_bytes)
        if barcode_from_img:
            logger.info(f"[Product] Decoded barcode {barcode_from_img} from image")
            result = await _lookup_barcode_api(barcode_from_img)
            if result:
                product_info = result; source = "open_beauty_facts"
            else:
                llm_data = await _lookup_via_llm(barcode_from_img, is_barcode=True)
                if llm_data and llm_data.get("ingredients"):
                    product_info = {
                        "product_name": llm_data.get("product_name", "Unknown"),
                        "brand": llm_data.get("brand", ""), "ingredients": llm_data.get("ingredients", []),
                        "image_url": "", "barcode": barcode_from_img,
                        "category": llm_data.get("category", ""),
                        "llm_confidence": llm_data.get("confidence", "low"),
                    }
                    source = "llm"

        # Step 2: no barcode → send normalised image to vision model
        if not product_info:
            logger.info("[Product] Sending normalised image to vision model")
            # Pass norm_bytes directly; _lookup_via_vision will normalise again (no-op, already JPEG)
            vision_data = await _lookup_via_vision(norm_bytes, hint_text=text or "")

            if vision_data and vision_data.get("ingredients"):
                product_info = {
                    "product_name":   vision_data.get("product_name", text or "Unknown"),
                    "brand":          vision_data.get("brand", ""),
                    "ingredients":    vision_data.get("ingredients", []),
                    "image_url":      "",
                    "barcode":        "",
                    "category":       vision_data.get("category", ""),
                    "llm_notes":      vision_data.get("notes", "Ingredients read from product label photo"),
                    "llm_confidence": vision_data.get("confidence", "medium"),
                }
                source = "vision"

            elif vision_data and vision_data.get("product_name"):
                identified_name = vision_data.get("product_name", "")
                logger.info(f"[Product] Vision identified '{identified_name}' → looking up by name")
                llm_data = await _lookup_via_llm(identified_name, is_barcode=False)
                if llm_data and llm_data.get("ingredients"):
                    product_info = {
                        "product_name":   llm_data.get("product_name", identified_name),
                        "brand":          llm_data.get("brand", vision_data.get("brand", "")),
                        "ingredients":    llm_data.get("ingredients", []),
                        "image_url":      "",
                        "barcode":        "",
                        "category":       llm_data.get("category", ""),
                        "llm_notes":      "Product identified from photo, ingredients from AI knowledge base",
                        "llm_confidence": llm_data.get("confidence", "medium"),
                    }
                    source = "vision+llm"

        if not product_info:
            raise HTTPException(status_code=400,
                detail="Could not extract ingredients from the image. Ensure the ingredient list on the label is visible, or enter the product name manually.")

    # ── Name search ────────────────────────────────────────────────────────────
    elif text:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                r    = await client.get("https://world.openbeautyfacts.org/cgi/search.pl",
                                        params={"search_terms": text, "json": 1, "page_size": 3})
                data = r.json()
                for p in data.get("products", []):
                    raw  = p.get("ingredients_text", "") or ""
                    ings = _parse_ingredients_text(raw)
                    if ings and len(ings) >= 3:
                        product_info = {"product_name": p.get("product_name") or text,
                                        "brand": p.get("brands", ""), "ingredients": ings,
                                        "image_url": p.get("image_url", ""),
                                        "barcode": p.get("code", ""), "category": p.get("categories", "")}
                        source = "open_beauty_facts"; break
        except Exception:
            pass

        if not product_info:
            llm_data = await _lookup_via_llm(text, is_barcode=False)
            if llm_data and llm_data.get("confidence") != "low":
                product_info = {
                    "product_name": llm_data.get("product_name", text), "brand": llm_data.get("brand", ""),
                    "ingredients": llm_data.get("ingredients", []), "image_url": "", "barcode": "",
                    "category": llm_data.get("category", ""), "llm_notes": llm_data.get("notes", ""),
                    "llm_confidence": llm_data.get("confidence", "medium"),
                }
                source = "llm"
            elif llm_data:
                product_info = {
                    "product_name": llm_data.get("product_name", text), "brand": llm_data.get("brand", ""),
                    "ingredients": llm_data.get("ingredients", []), "image_url": "", "barcode": "",
                    "category": llm_data.get("category", ""),
                    "llm_notes": llm_data.get("notes", "Low confidence — consider adding ingredients manually"),
                    "llm_confidence": "low",
                }
                source = "llm"

    # ── Manual ─────────────────────────────────────────────────────────────────
    elif manual_ingredients:
        ingredients  = [i.strip() for i in manual_ingredients.split(",") if i.strip()]
        product_info = {"product_name": text or "Manual Entry", "brand": "",
                        "ingredients": ingredients, "image_url": "", "barcode": "", "category": ""}
        source = "manual"

    else:
        raise HTTPException(status_code=400, detail="Provide barcode, image, product name, or ingredients.")

    if not product_info:
        raise HTTPException(status_code=404, detail="Product could not be identified. Try entering ingredients manually.")

    # ── Score & triggers ───────────────────────────────────────────────────────
    scoring      = _compute_product_score(product_info.get("ingredients", []))
    db           = get_db()
    user_context = await _get_user_skin_context(user_id, db)
    personalized_triggers = _analyze_triggers_for_user(product_info.get("ingredients", []), user_context)

    now = datetime.now(timezone.utc)
    doc = {
        "user_id":               user_id,
        "product_name":          product_info.get("product_name", "Unknown"),
        "brand":                 product_info.get("brand", ""),
        "barcode":               product_info.get("barcode", ""),
        "category":              product_info.get("category", ""),
        "image_url":             product_info.get("image_url", ""),
        "ingredients":           product_info.get("ingredients", []),
        "comedogenic_score":     scoring["comedogenic_score"],
        "flagged_ingredients":   scoring["flagged_ingredients"],
        "ingredient_scores":     scoring["ingredient_scores"],
        "risk_score":            round(scoring["comedogenic_score"] * 20),
        "personalized_triggers": personalized_triggers,
        "source":                source,
        "llm_confidence":        product_info.get("llm_confidence", ""),
        "llm_notes":             product_info.get("llm_notes", ""),
        "is_active":             True,
        "added_at":              now,
        "updated_at":            now,
    }

    res = await db["user_products"].insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    doc["added_at"]   = now.isoformat()
    doc["updated_at"] = now.isoformat()

    await _refresh_forecast(user_id)
    logger.info(f"[Product] Added '{doc['product_name']}' source={source} score={scoring['comedogenic_score']}")
    return doc


async def update_product(user_id: str, product_id: str, updates: dict) -> dict:
    db = get_db()
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    doc = await db["user_products"].find_one({"_id": oid, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")

    set_fields = {"updated_at": datetime.now(timezone.utc)}
    if "product_name" in updates:
        set_fields["product_name"] = updates["product_name"]
    if "is_active" in updates:
        set_fields["is_active"] = updates["is_active"]
    if "ingredients" in updates:
        ingredients = [i.strip() for i in updates["ingredients"].split(",") if i.strip()]
        scoring     = _compute_product_score(ingredients)
        user_context = await _get_user_skin_context(user_id, db)
        personalized_triggers = _analyze_triggers_for_user(ingredients, user_context)
        set_fields.update({
            "ingredients": ingredients, "comedogenic_score": scoring["comedogenic_score"],
            "flagged_ingredients": scoring["flagged_ingredients"],
            "ingredient_scores": scoring["ingredient_scores"],
            "risk_score": round(scoring["comedogenic_score"] * 20),
            "personalized_triggers": personalized_triggers,
        })

    await db["user_products"].update_one({"_id": oid}, {"$set": set_fields})
    await _refresh_forecast(user_id)
    updated = await db["user_products"].find_one({"_id": oid})
    updated["id"] = str(updated.pop("_id"))
    _serialize_dates(updated)
    return updated


async def delete_product(user_id: str, product_id: str) -> dict:
    db = get_db()
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    result = await db["user_products"].delete_one({"_id": oid, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    await _refresh_forecast(user_id)
    return {"deleted": product_id}


async def get_products(user_id: str) -> list:
    db = get_db()
    products = []
    async for doc in db["user_products"].find({"user_id": user_id}).sort("added_at", -1):
        doc["id"] = str(doc.pop("_id"))
        _serialize_dates(doc)
        products.append(doc)
    return products


async def get_active_product_risk(user_id: str, db) -> float:
    scores = []
    async for doc in db["user_products"].find({"user_id": user_id, "is_active": True}):
        scores.append(float(doc.get("comedogenic_score", 0)))
    return min(1.0, max(scores) / 5.0) if scores else 0.0


def _decode_barcode_from_image(image_bytes: bytes) -> Optional[str]:
    try:
        from pyzbar.pyzbar import decode
        from PIL import Image
        codes = decode(Image.open(io.BytesIO(image_bytes)))
        if codes:
            return codes[0].data.decode("utf-8")
    except Exception as e:
        logger.warning(f"Barcode decode: {e}")
    return None


def _serialize_dates(doc: dict):
    for key in ("added_at", "updated_at", "created_at"):
        if isinstance(doc.get(key), datetime):
            doc[key] = doc[key].isoformat()


async def _refresh_forecast(user_id: str):
    try:
        from app.services.forecast_service import generate_forecast
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        end   = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
        await generate_forecast(user_id, today, end)
    except Exception as e:
        logger.error(f"Forecast refresh failed: {e}")
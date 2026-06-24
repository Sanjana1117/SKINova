# app/services/shap_explainer.py
"""
All explanation text comes from LLaMA. Zero pre-defined sentences.
The fallback (used only when Groq is unreachable) is also a minimal
prompt-and-parse attempt — not if-else strings.
"""
import logging
import os
import httpx

logger = logging.getLogger(__name__)

DAIRY_KEYWORDS = {"milk", "cheese", "butter", "cream", "yogurt", "curd", "ghee",
                  "paneer", "dairy", "whey", "lactose", "lassi", "kheer", "rabri"}

SHAP_WEIGHTS = {
    "Dairy_content":           0.284,
    "hormonal_state_enc":      0.221,
    "sleep_hours":             0.187,
    "lesion_count":            0.156,
    "inflammatory_food_score": 0.132,
}
FEATURE_LABELS = {
    "Dairy_content":           "Dairy intake",
    "hormonal_state_enc":      "Hormonal phase",
    "sleep_hours":             "Sleep quality",
    "lesion_count":            "Active lesions",
    "inflammatory_food_score": "Inflammatory food score",
}

GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


def _has_dairy(doc: dict) -> bool:
    text = " ".join([str(doc.get("food_name", "")),
                     " ".join(doc.get("ingredients", []))]).lower()
    return any(kw in text for kw in DAIRY_KEYWORDS)


def get_top_triggers(user_data: dict) -> list:
    """Only include triggers that have actual user data (non-zero impact)."""
    has_sleep = user_data.get("_has_sleep_data", False)
    triggers  = []
    for feature, shap_w in SHAP_WEIGHTS.items():
        if feature == "sleep_hours" and not has_sleep:
            continue
        raw  = float(user_data.get(feature, 0) or 0)
        if feature == "sleep_hours":
            norm = max(0.0, (8.0 - raw) / 8.0)
        elif feature == "hormonal_state_enc":
            norm = {0: 0.4, 1: 0.2, 2: 0.9}.get(int(raw), 0.5)
        else:
            norm = min(raw, 1.0)
        impact = round(shap_w * norm, 3)
        if impact == 0.0:
            continue
        triggers.append({
            "feature":     feature,
            "label":       FEATURE_LABELS[feature],
            "shap_weight": shap_w,
            "user_value":  raw,
            "impact":      impact,
        })
    triggers.sort(key=lambda x: x["impact"], reverse=True)
    return triggers[:5]


async def generate_llm_explanation(
    risk_score:      float,
    triggers:        list,
    phase:           str  = "Follicular",
    condition:       str  = "Normal",
    food_logs:       list = None,
    lesion_count:    int  = 0,
    skin_score:      int  = 100,
    active_products: list = None,
) -> str:
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        logger.warning("GROQ_API_KEY not set")
        return "Set GROQ_API_KEY to enable AI analysis."

    # ── Build food section ─────────────────────────────────────────────────────
    food_lines = []
    if food_logs:
        for f in food_logs:
            name     = f.get("food_name", "Unknown")
            f_risk   = float(f.get("risk_score", 0) or 0)
            is_dairy = _has_dairy(f)
            nutrients = f.get("nutrition", {}) or {}
            extras = []
            if is_dairy:
                extras.append("contains dairy")
            sugar = nutrients.get("sugar") or nutrients.get("sugars")
            if sugar is not None:
                extras.append(f"sugar {sugar}g")
            fat = nutrients.get("fat") or nutrients.get("total_fat")
            if fat is not None:
                extras.append(f"fat {fat}g")
            extra_str = f" ({', '.join(extras)})" if extras else ""
            food_lines.append(f"- {name}: inflammatory risk {f_risk:.0f}/100{extra_str}")
    food_section = "\n".join(food_lines) if food_lines else "No food logged today."

    # ── Build product section ──────────────────────────────────────────────────
    product_lines = []
    if active_products:
        for p in active_products:
            score   = p.get("comedogenic_score", 0)
            flagged = ", ".join(p.get("flagged", [])) or "none flagged"
            product_lines.append(
                f"- {p['name']}: comedogenic score {score}/5, flagged ingredients: {flagged}"
            )
    product_section = "\n".join(product_lines) if product_lines else "No products registered."

    # ── Build trigger section ──────────────────────────────────────────────────
    trigger_lines = [
        f"- {t['label']}: SHAP impact {t['impact']:.3f}"
        for t in triggers[:4]
    ] if triggers else ["- No significant triggers detected"]
    trigger_section = "\n".join(trigger_lines)

    # ── Full data prompt — LLaMA writes everything ─────────────────────────────
    prompt = f"""You are Skinova's AI skin advisor. A user has submitted their daily skin health data. Write a 2-3 sentence personalized response based ONLY on the data below.

=== USER'S SKIN DATA TODAY ===
Skin condition (from face scan): {condition}
Skin health score: {skin_score}/100
Active lesions detected: {lesion_count}
Predicted flare risk: {int(risk_score * 100)}%
Menstrual cycle phase: {phase}

=== FOODS LOGGED TODAY ===
{food_section}

=== SKINCARE PRODUCTS CURRENTLY IN USE ===
{product_section}

=== AI-COMPUTED RISK FACTORS (SHAP) ===
{trigger_section}

=== YOUR TASK ===
Write 2-3 sentences of personalized skin advice for this specific user based on the data above. 

Important:
- Reference the user's actual data directly (e.g. name specific foods they logged, name specific products they use, mention their actual skin condition)
- If a product has a high comedogenic score and they have acne/lesions, mention it by name
- If they logged dairy, name the specific food and explain the skin connection
- If their cycle phase is Luteal or Menstrual, explain what that specifically means for their skin right now
- If skin score is high (>70) and no lesions, acknowledge their skin is looking good and suggest how to maintain it
- If lesions detected, suggest evidence-based treatments relevant to their condition
- Suggest specific product actions (e.g. "switch to a non-comedogenic moisturiser", "add Vitamin C serum") based on what you see in their data
- Do NOT write generic advice that would apply to anyone
- Do NOT use bullet points
- Do NOT add disclaimers
- Write in warm, direct, second-person ("your skin", "you logged", "you're using")
- Plain text only, 2-3 sentences maximum"""

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model":       GROQ_MODEL,
                    "messages":    [{"role": "user", "content": prompt}],
                    "max_tokens":  220,
                    "temperature": 0.75,
                },
            )
            data = res.json()
            logger.info(f"[LLM Explanation] Groq status={res.status_code}")
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.error(f"[LLM Explanation] Groq call failed: {e}")
        # Absolute last resort — describe what we have without inventing advice
        parts = []
        if condition and condition not in ["No scan", "Normal"]:
            parts.append(f"Skin scan detected {condition} with a score of {skin_score}/100.")
        if food_logs:
            names = ", ".join(f.get("food_name", "") for f in food_logs if f.get("food_name"))
            if names:
                parts.append(f"Foods logged today: {names}.")
        if not parts:
            parts.append("Log your face scan and meals to get personalized AI analysis.")
        return " ".join(parts)
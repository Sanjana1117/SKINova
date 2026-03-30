# app/services/shap_explainer.py

import logging
import httpx
import os

logger = logging.getLogger(__name__)

# SHAP weights from your TFT training notebook
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

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "meta-llama/llama-4-scout-17b-16e-instruct"


def get_top_triggers(user_data: dict) -> list:
    triggers = []
    for feature, shap_w in SHAP_WEIGHTS.items():
        raw_val = float(user_data.get(feature, 0) or 0)
        if feature == "sleep_hours":
            norm = max(0.0, (8.0 - raw_val) / 8.0)
        elif feature == "hormonal_state_enc":
            norm = {0: 0.4, 1: 0.2, 2: 0.9}.get(int(raw_val), 0.5)
        else:
            norm = min(raw_val, 1.0)
        triggers.append({
            "feature":     feature,
            "label":       FEATURE_LABELS[feature],
            "shap_weight": shap_w,
            "user_value":  raw_val,
            "impact":      round(shap_w * norm, 3),
        })
    triggers.sort(key=lambda x: x["impact"], reverse=True)
    return triggers[:5]


async def generate_llm_explanation(
    risk_score: float,
    triggers: list,
    phase: str = "Follicular",
) -> str:
    trigger_text = "\n".join([
        f"- {t['label']}: SHAP impact {t['impact']:.3f}"
        for t in triggers[:3]
    ])

    prompt = f"""You are Skinova's AI skin advisor. Write a SHORT 2-3 sentence personalized skin forecast.

Risk Score: {int(risk_score * 100)}%
Hormonal Phase: {phase}
Top triggers by SHAP analysis:
{trigger_text}

Style: warm, specific, actionable. Like: "Your skin is likely to [state] in the coming days. The biggest factor is [top trigger] — your history shows [insight]. [1 recommendation]."
No disclaimers. No bullet points. Plain text only."""

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model":       GROQ_MODEL,
                    "messages":    [{"role": "user", "content": prompt}],
                    "max_tokens":  150,
                    "temperature": 0.7,
                },
            )
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.error(f"Groq LLaMA call failed: {e}")
        # Fallback rule-based explanation
        top = triggers[0]["label"] if triggers else "dietary triggers"
        if risk_score >= 0.7:
            return f"Your skin is at high risk of a flare in the coming days. The biggest contributing factor is {top} — consider reducing it for the next 48-72 hours. Stay hydrated and keep your skincare routine minimal."
        elif risk_score >= 0.4:
            return f"Your skin shows moderate flare risk. {top} is the primary driver — monitor your intake and watch for early signs. A gentle routine is recommended."
        return f"Your skin looks stable. {top} remains your most impactful variable to watch. Keep up your current routine."
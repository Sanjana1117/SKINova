from datetime import date
from app.pipelines.menstrual_pipeline.core.cycle import (
    predict_phase,
    predict_phase_detailed
)


# ── Skin risk per phase — clinically grounded ─────────────────────────────────
SKIN_RISK_MAP = {
    "Menstrual":  "moderate",   # estrogen/progesterone low → skin dull, sensitive
    "Follicular": "low",        # estrogen rising → skin clearing
    "Ovulatory":  "low",        # estrogen peak → best skin window
    "Luteal":     "high"        # progesterone + androgens → sebum surge, acne risk
}

# Phase descriptions for Llama 4 / UI context
PHASE_CONTEXT = {
    "Menstrual": {
        "description": "Estrogen and progesterone are at their lowest. Skin may appear dull and feel more sensitive.",
        "dietary_adjustment": "Increase iron-rich foods. Reduce dairy and sugar — skin sensitivity is elevated.",
        "tft_weight_multiplier": 1.2   # moderate sensitivity
    },
    "Follicular": {
        "description": "Estrogen is rising. Skin is typically clearer and more resilient during this phase.",
        "dietary_adjustment": "Normal dietary weights apply. Good window for introducing new products.",
        "tft_weight_multiplier": 0.8   # lower sensitivity
    },
    "Ovulatory": {
        "description": "Estrogen peaks around ovulation. Skin is typically at its best.",
        "dietary_adjustment": "Normal dietary weights apply. Skin is most resilient now.",
        "tft_weight_multiplier": 0.7   # lowest sensitivity
    },
    "Luteal": {
        "description": "Progesterone and androgens rise, increasing sebum production and pore sensitivity.",
        "dietary_adjustment": "Elevate dairy and sugar weights — skin sensitivity is clinically highest now.",
        "tft_weight_multiplier": 1.5   # highest sensitivity — key TFT covariate
    }
}


def get_cycle_phase(
    last_period_start: str,
    cycle_length: int        = 28,
    period_duration: int     = 5,
    pain: float              = 0.0,
    mood: float              = 0.5,
    flow: float              = 0.0,
    stress: float            = 0.0,
    cycle_history: list      = None,
    use_bilstm: bool         = True
) -> dict:
    """
    Get current hormonal phase using BiLSTM model.

    Args:
        last_period_start: ISO date string of last period start e.g. "2026-02-20"
        cycle_length:      average cycle length in days
        period_duration:   average period duration in days
        pain:              cramp intensity 0–1 (optional, improves BiLSTM accuracy)
        mood:              mood score 0–1 (optional)
        flow:              bleeding intensity 0–1 (optional)
        stress:            stress level 0–1 (optional)
        cycle_history:     list of past daily log dicts (optional, best accuracy)
        use_bilstm:        if False, falls back to rule-based calculation

    Returns:
        dict with phase, day_of_cycle, days_left_in_phase, skin_risk,
        tft_weight_multiplier, phase_context, confidence (if BiLSTM)
    """
    today = date.today()
    last_period = date.fromisoformat(last_period_start)
    days_since_period = (today - last_period).days % cycle_length
    day_of_cycle = days_since_period + 1

    if use_bilstm:
        try:
            result = predict_phase_detailed(
                day_of_cycle=day_of_cycle,
                cycle_length=cycle_length,
                period_duration=period_duration,
                cramps=pain,
                mood=mood,
                energy=1.0 - stress,
                menses_score=flow,
                cycle_history=cycle_history
            )
            phase      = result['phase_name']
            confidence = result['confidence']
            probs      = result['probabilities']

        except FileNotFoundError:
            # BiLSTM model not trained yet — fall back to rules silently
            phase      = _rule_based_phase(day_of_cycle, period_duration, cycle_length)
            confidence = None
            probs      = None

    else:
        phase      = _rule_based_phase(day_of_cycle, period_duration, cycle_length)
        confidence = None
        probs      = None

    # Days left in current phase
    days_left = _days_left_in_phase(phase, day_of_cycle, period_duration, cycle_length)

    context = PHASE_CONTEXT[phase]

    return {
        "phase":                   phase,
        "day_of_cycle":            day_of_cycle,
        "days_left_in_phase":      days_left,
        "cycle_length":            cycle_length,
        "skin_risk":               SKIN_RISK_MAP[phase],
        "tft_weight_multiplier":   context["tft_weight_multiplier"],
        "phase_description":       context["description"],
        "dietary_adjustment":      context["dietary_adjustment"],
        "confidence":              confidence,   # None if model not loaded yet
        "probabilities":           probs         # None if model not loaded yet
    }


def get_skin_risk_from_phase(phase: str) -> str:
    """Backward compatible — returns skin risk string for a given phase."""
    return SKIN_RISK_MAP.get(phase, "moderate")


def get_tft_hormonal_covariate(last_period_start: str, cycle_length: int = 28, period_duration: int = 5) -> dict:
    """
    Lightweight call for TFT pipeline — returns only what TFT needs.
    Called daily during data ingestion, no symptom inputs needed.

    Returns:
        dict: {
            'phase': str,
            'phase_index': int (0-3),
            'tft_weight_multiplier': float,
            'day_of_cycle': int
        }
    """
    result = get_cycle_phase(
        last_period_start=last_period_start,
        cycle_length=cycle_length,
        period_duration=period_duration,
        use_bilstm=True
    )
    return {
        "phase":                 result["phase"],
        "phase_index":           ["Menstrual", "Follicular", "Ovulatory", "Luteal"].index(result["phase"]),
        "tft_weight_multiplier": result["tft_weight_multiplier"],
        "day_of_cycle":          result["day_of_cycle"]
    }


# ── Internal helpers ──────────────────────────────────────────────────────────
def _rule_based_phase(day_of_cycle: int, period_duration: int, cycle_length: int) -> str:
    """Fallback rule-based phase calculation when BiLSTM model not available."""
    ovulation_day = cycle_length - 14
    if day_of_cycle <= period_duration:
        return "Menstrual"
    elif day_of_cycle < ovulation_day - 1:
        return "Follicular"
    elif day_of_cycle <= ovulation_day + 1:
        return "Ovulatory"
    else:
        return "Luteal"


def _days_left_in_phase(phase: str, day_of_cycle: int, period_duration: int, cycle_length: int) -> int:
    """Calculate how many days remain in the current phase."""
    ovulation_day = cycle_length - 14
    if phase == "Menstrual":
        return max(0, period_duration - day_of_cycle)
    elif phase == "Follicular":
        return max(0, ovulation_day - 2 - day_of_cycle)
    elif phase == "Ovulatory":
        return max(0, ovulation_day + 1 - day_of_cycle)
    else:  # Luteal
        return max(0, cycle_length - day_of_cycle)


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    result = get_cycle_phase(
        last_period_start="2026-02-20",
        cycle_length=28,
        period_duration=5,
        pain=0.1,
        mood=0.7,
        flow=0.0,
        stress=0.2
    )
    print(f"Phase:              {result['phase']}")
    print(f"Day of cycle:       {result['day_of_cycle']}")
    print(f"Days left:          {result['days_left_in_phase']}")
    print(f"Skin risk:          {result['skin_risk']}")
    print(f"TFT multiplier:     {result['tft_weight_multiplier']}")
    print(f"Confidence:         {result['confidence']}")
    print(f"Description:        {result['phase_description']}")
    print(f"Dietary note:       {result['dietary_adjustment']}")
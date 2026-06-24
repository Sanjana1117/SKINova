from datetime import date
from app.pipelines.menstrual_pipeline.core.cycle import (
    predict_phase,
    predict_phase_detailed
)


# ── Skin risk per phase — clinically grounded ─────────────────────────────────
SKIN_RISK_MAP = {
    "Menstrual":  "moderate",
    "Follicular": "low",
    "Ovulatory":  "low",
    "Luteal":     "high"
}

# Phase descriptions for Llama 4 / UI context
PHASE_CONTEXT = {
    "Menstrual": {
        "description": "Estrogen and progesterone are at their lowest. Skin may appear dull and feel more sensitive.",
        "dietary_adjustment": "Increase iron-rich foods. Reduce dairy and sugar — skin sensitivity is elevated.",
        "tft_weight_multiplier": 1.2
    },
    "Follicular": {
        "description": "Estrogen is rising. Skin is typically clearer and more resilient during this phase.",
        "dietary_adjustment": "Normal dietary weights apply. Good window for introducing new products.",
        "tft_weight_multiplier": 0.8
    },
    "Ovulatory": {
        "description": "Estrogen peaks around ovulation. Skin is typically at its best.",
        "dietary_adjustment": "Normal dietary weights apply. Skin is most resilient now.",
        "tft_weight_multiplier": 0.7
    },
    "Luteal": {
        "description": "Progesterone and androgens rise, increasing sebum production and pore sensitivity.",
        "dietary_adjustment": "Elevate dairy and sugar weights — skin sensitivity is clinically highest now.",
        "tft_weight_multiplier": 1.5
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
    use_bilstm: bool         = True,
    target_date: date        = None
) -> dict:
    """
    Get current hormonal phase using BiLSTM model.
    Falls back to rule-based if model not loaded.
    """
    today = target_date if target_date is not None else date.today()
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
            # FIX: read 'phase_name' (string), NOT 'phase' (int index)
            # Previously: phase = result['phase']  ← was an int → KeyError in PHASE_CONTEXT
            phase      = result['phase_name']
            confidence = result['confidence']
            probs      = result['probabilities']

        except FileNotFoundError:
            phase      = _rule_based_phase(day_of_cycle, period_duration, cycle_length)
            confidence = None
            probs      = None
    else:
        phase      = _rule_based_phase(day_of_cycle, period_duration, cycle_length)
        confidence = None
        probs      = None

    days_left = _days_left_in_phase(phase, day_of_cycle, period_duration, cycle_length)
    context   = PHASE_CONTEXT[phase]

    return {
        "phase":                   phase,
        "day_of_cycle":            day_of_cycle,
        "days_left_in_phase":      days_left,
        "cycle_length":            cycle_length,
        "skin_risk":               SKIN_RISK_MAP[phase],
        "tft_weight_multiplier":   context["tft_weight_multiplier"],
        "phase_description":       context["description"],
        "dietary_adjustment":      context["dietary_adjustment"],
        "confidence":              confidence,
        "probabilities":           probs
    }


def get_skin_risk_from_phase(phase: str) -> str:
    """Backward compatible — returns skin risk string for a given phase."""
    return SKIN_RISK_MAP.get(phase, "moderate")


def get_tft_hormonal_covariate(
    last_period_start: str,
    cycle_length: int    = 28,
    period_duration: int = 5
) -> dict:
    """
    Lightweight call for TFT pipeline — returns only what TFT needs.
    Called daily during data ingestion, no symptom inputs needed.
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
    ovulation_day = cycle_length - 14
    if phase == "Menstrual":
        return max(0, period_duration - day_of_cycle)
    elif phase == "Follicular":
        return max(0, ovulation_day - 2 - day_of_cycle)
    elif phase == "Ovulatory":
        return max(0, ovulation_day + 1 - day_of_cycle)
    else:
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
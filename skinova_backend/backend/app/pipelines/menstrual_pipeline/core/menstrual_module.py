from app.pipelines.menstrual_pipeline.core.cycle_tracker import (
    get_cycle_phase,
    get_skin_risk_from_phase,
    get_tft_hormonal_covariate
)

def get_phase(user_data: dict) -> dict:
    """
    Main entry point for hormonal phase prediction.

    user_data = {
        "last_period_start": "2026-02-20",  # ISO date string
        "cycle_length": 28,                  # learned over time
        "period_duration": 5,                # learned over time
        "has_history": False,                # True once user has 15+ days logged
        "cycle_history": [],                 # list of past daily dicts (optional)
        "symptoms": {
            "pain": 0.1,      # 0-1 scale (cramp intensity)
            "mood": 0.7,      # 0-1 scale
            "flow": 0.0,      # 0-1 scale (bleeding intensity)
            "stress": 0.2     # 0-1 scale
        }
    }

    Returns:
        dict: {
            "phase": str,
            "phase_index": int,
            "day_of_cycle": int,
            "days_left_in_phase": int,
            "skin_risk": str,
            "tft_weight_multiplier": float,
            "phase_description": str,
            "dietary_adjustment": str,
            "confidence": float or None,
            "probabilities": dict or None,
            "used_bilstm": bool
        }
    """
    symptoms      = user_data.get("symptoms", {})
    has_history   = user_data.get("has_history", False)
    cycle_history = user_data.get("cycle_history", None)

    # Always use BiLSTM -- falls back to rules automatically if model not loaded
    result = get_cycle_phase(
        last_period_start=user_data["last_period_start"],
        cycle_length=user_data.get("cycle_length", 28),
        period_duration=user_data.get("period_duration", 5),
        pain=symptoms.get("pain", 0.0),
        mood=symptoms.get("mood", 0.5),
        flow=symptoms.get("flow", 0.0),
        stress=symptoms.get("stress", 0.0),
        cycle_history=cycle_history if has_history else None,
        use_bilstm=True
    )

    return {
        "phase":                 result["phase"],
        "phase_index":           ["Menstrual", "Follicular", "Ovulatory", "Luteal"].index(result["phase"]),
        "day_of_cycle":          result["day_of_cycle"],
        "days_left_in_phase":    result["days_left_in_phase"],
        "skin_risk":             result["skin_risk"],
        "tft_weight_multiplier": result["tft_weight_multiplier"],
        "phase_description":     result["phase_description"],
        "dietary_adjustment":    result["dietary_adjustment"],
        "confidence":            result["confidence"],
        "probabilities":         result["probabilities"],
        "used_bilstm":           result["confidence"] is not None
    }


def get_tft_covariate(user_data: dict) -> dict:
    """
    Lightweight call specifically for TFT daily pipeline.
    Called during daily data ingestion -- no symptoms needed.

    Returns only what TFT needs:
        phase, phase_index, tft_weight_multiplier, day_of_cycle
    """
    return get_tft_hormonal_covariate(
        last_period_start=user_data["last_period_start"],
        cycle_length=user_data.get("cycle_length", 28),
        period_duration=user_data.get("period_duration", 5)
    )


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    user = {
        "last_period_start": "2026-02-20",
        "cycle_length": 28,
        "period_duration": 5,
        "has_history": False,
        "symptoms": {
            "pain": 0.1,
            "mood": 0.7,
            "flow": 0.0,
            "stress": 0.2
        }
    }

    result = get_phase(user)
    print(f"Phase:           {result['phase']}")
    print(f"Day of cycle:    {result['day_of_cycle']}")
    print(f"Days left:       {result['days_left_in_phase']}")
    print(f"Skin risk:       {result['skin_risk']}")
    print(f"TFT multiplier:  {result['tft_weight_multiplier']}")
    print(f"Confidence:      {result['confidence']}")
    print(f"Used BiLSTM:     {result['used_bilstm']}")
    print(f"Description:     {result['phase_description']}")

    # TFT covariate test
    tft = get_tft_covariate(user)
    print(f"\nTFT covariate:   {tft}")
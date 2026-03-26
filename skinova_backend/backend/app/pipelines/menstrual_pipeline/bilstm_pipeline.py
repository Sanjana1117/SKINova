from app.pipelines.menstrual_pipeline.core.menstrual_module import get_phase


def run_bilstm_pipeline(user_data: dict):

    result = get_phase(user_data)

    return {
        "phase": result["phase"],
        "phase_index": result["phase_index"],
        "day_of_cycle": result["day_of_cycle"],
        "days_left_in_phase": result["days_left_in_phase"],
        "skin_risk": result["skin_risk"],
        "tft_weight_multiplier": result["tft_weight_multiplier"],
        "phase_description": result["phase_description"],
        "dietary_adjustment": result["dietary_adjustment"],
        "confidence": result["confidence"]
    }
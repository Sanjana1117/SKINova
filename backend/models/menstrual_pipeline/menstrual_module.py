from backend.models.menstrual_pipeline.cycle_tracker import get_cycle_phase, get_skin_risk_from_phase
from backend.models.menstrual_pipeline.ann_cycle import predict_phase

def get_phase(user_data):
    """
    user_data = {
        "last_period_start": "2026-02-20",
        "cycle_length": 28,          # learned over time
        "period_duration": 5,        # learned over time
        "has_history": False,        # True once user has 3+ cycles logged
        "symptoms": {
            "pain": 1,
            "bloating": 2,
            "mood": 4,
            "flow": 0,
            "stress": 2
        }
    }
    """
    
    # get rule based calculation first
    rule_result = get_cycle_phase(
        user_data["last_period_start"],
        user_data.get("cycle_length", 28),
        user_data.get("period_duration", 5)
    )
    
    # if user has enough history use ANN
    if user_data.get("has_history", False):
        symptoms = user_data.get("symptoms", {})
        ann_phase = predict_phase(
            day_of_cycle=rule_result["day_of_cycle"],
            cycle_length=user_data.get("cycle_length", 28),
            period_duration=user_data.get("period_duration", 5),
            pain=symptoms.get("pain", 1),
            bloating=symptoms.get("bloating", 1),
            mood=symptoms.get("mood", 3),
            flow=symptoms.get("flow", 0),
            stress=symptoms.get("stress", 1)
        )
        phase = ann_phase
    else:
        phase = rule_result["phase"]

    return {
        "phase": phase,
        "day_of_cycle": rule_result["day_of_cycle"],
        "days_left_in_phase": rule_result["days_left_in_phase"],
        "skin_risk": get_skin_risk_from_phase(phase),
        "used_ann": user_data.get("has_history", False)
    }

# test it
user = {
    "last_period_start": "2026-02-20",
    "cycle_length": 28,
    "period_duration": 5,
    "has_history": False,
    "symptoms": {
        "pain": 1,
        "bloating": 2,
        "mood": 4,
        "flow": 0,
        "stress": 2
    }
}

result = get_phase(user)
print("Phase:", result["phase"])
print("Day of cycle:", result["day_of_cycle"])
print("Skin risk:", result["skin_risk"])
print("Used ANN:", result["used_ann"])
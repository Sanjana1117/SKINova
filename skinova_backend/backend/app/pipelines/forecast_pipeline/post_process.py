def map_risk_level(score):

    if score is None:
        return None

    if score >= 0.7:
        return "high"
    elif score >= 0.4:
        return "medium"
    else:
        return "low"
from datetime import date, timedelta

def get_cycle_phase(last_period_start, cycle_length=28, period_duration=5):
    today = date.today()
    last_period_start = date.fromisoformat(last_period_start)
    
    # how many days since last period started
    days_since_period = (today - last_period_start).days % cycle_length
    
    # determine phase
    if days_since_period < period_duration:
        phase = "Menstrual"
        days_left = period_duration - days_since_period
        
    elif days_since_period < 13:
        phase = "Follicular"
        days_left = 13 - days_since_period
        
    elif days_since_period < 16:
        phase = "Ovulatory"
        days_left = 16 - days_since_period
        
    else:
        phase = "Luteal"
        days_left = cycle_length - days_since_period

    return {
        "phase": phase,
        "day_of_cycle": days_since_period + 1,
        "days_left_in_phase": days_left,
        "cycle_length": cycle_length
    }

def get_skin_risk_from_phase(phase):
    risk_map = {
        "Menstrual": "moderate",
        "Follicular": "low",
        "Ovulatory": "low",
        "Luteal": "high"
    }
    return risk_map[phase]

# test it
result = get_cycle_phase("2026-02-20")
print("Phase:", result['phase'])
print("Day of cycle:", result['day_of_cycle'])
print("Days left in phase:", result['days_left_in_phase'])
print("Skin risk:", get_skin_risk_from_phase(result['phase']))

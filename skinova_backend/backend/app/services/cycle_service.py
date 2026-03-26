from datetime import datetime, timedelta
from app.pipelines.menstrual_pipeline.core.cycle import predict_cycle
from app.db import mongodb


# 🔥 FIX: handle timezone (Z) properly
def parse_date(date_str: str) -> datetime:
    """
    Converts ISO string to naive datetime (removes timezone)
    Handles:
    - 2026-03-01
    - 2026-03-01T00:00:00
    - 2026-03-01T00:00:00.000Z
    """
    return datetime.fromisoformat(date_str.replace("Z", "")).replace(tzinfo=None)


def get_phase_color(phase):
    return {
        "Menstrual": "#FF6B6B",
        "Follicular": "#4ECDC4",
        "Ovulatory": "#FFD93D",
        "Luteal": "#A29BFE"
    }.get(phase, "#999")


async def process_cycle_data(user_id, data):

    # ✅ FIXED DATE PARSING
    start_date = parse_date(data["start_date"])
    end_date = parse_date(data["end_date"])
    period_start = parse_date(data["period_start_date"])
    period_end = parse_date(data["period_end_date"])

    predictions = []
    current_date = start_date

    while current_date <= end_date:

        # 🔥 dynamic calculation per day
        days_since_period = (current_date - period_start).days

        cycle_length = data.get("cycle_length", 28)

# 🔥 FIX: wrap cycle
        days_since_period = days_since_period % cycle_length

        # 🔥 model call
        result = predict_cycle(
            days_since_period=days_since_period,
            past_cycle_lengths=[data.get("cycle_length", 28)],
            period_duration=(period_end - period_start).days
        )

        predictions.append({
            "date": current_date.isoformat(),
            "phase": result["current_phase"],
            "day_of_cycle": result["current_day"],
            "color": get_phase_color(result["current_phase"]),
            "skin_condition": result.get("skin_condition", "normal"),
            "hormone_info": (
                f"Cycle length: {result['predicted_cycle_length']} | "
                f"Ovulation: {result['predicted_ovulation_day']}"
            )
        })

        current_date += timedelta(days=1)

    # ✅ DB SAVE (async correct)
    await mongodb.db.cycles.insert_one({
        "user_id": user_id,
        "input": data,
        "predictions": predictions
    })

    return {"predictions": predictions}
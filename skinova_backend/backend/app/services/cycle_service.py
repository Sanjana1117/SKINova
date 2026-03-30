"""
cycle_service.py
Wraps the menstrual BiLSTM pipeline.
"""

from datetime import datetime, timedelta, date as date_type
from app.pipelines.menstrual_pipeline.bilstm_pipeline import run_bilstm_pipeline
from app.db.mongodb import get_db



def _parse_date(s: str) -> datetime:
    s = s.strip().replace(" ", "-").replace("Z", "")
    return datetime.fromisoformat(s).replace(tzinfo=None)


def _phase_color(phase: str) -> str:
    return {
        "Menstrual":  "#FF6B6B",
        "Follicular": "#4ECDC4",
        "Ovulatory":  "#FFD93D",
        "Luteal":     "#A29BFE",
    }.get(phase, "#999")


async def process_cycle_data(user_id: str, data: dict) -> dict:
    """
    Accepts:
      {
        "last_period_start": "YYYY-MM-DD",
        "cycle_length": 28,
        "period_duration": 5,
        "start_date": "YYYY-MM-DD",   # range to predict
        "end_date":   "YYYY-MM-DD",
        "symptoms": { "pain": 0.1, "mood": 0.7, "flow": 0.0, "stress": 0.2 }
      }
    """
    cycle_length    = data.get("cycle_length", 28)
    period_duration = data.get("period_duration", 5)
    last_period     = _parse_date(data["last_period_start"])

    start_date = _parse_date(data.get("start_date", data["last_period_start"]))
    end_date   = _parse_date(data.get("end_date",
                  (last_period + timedelta(days=cycle_length - 1)).isoformat()))

    symptoms = data.get("symptoms", {"pain": 0.1, "mood": 0.7, "flow": 0.0, "stress": 0.2})

    predictions = []
    cur = start_date

    while cur <= end_date:
        days_since = (cur - last_period).days % cycle_length

        pipeline_input = {
            "last_period_start": last_period.strftime("%Y-%m-%d"),
            "cycle_length":      cycle_length,
            "period_duration":   period_duration,
            "has_history":       data.get("has_history", False),
            "symptoms":          symptoms,
            "target_date":       cur.date() if isinstance(cur, datetime) else cur,
        }

        try:
            result = run_bilstm_pipeline(pipeline_input)
        except Exception:
            # fallback: simple phase calc
            result = _simple_phase(days_since, cycle_length, period_duration)

        predictions.append({
            "date":          cur.isoformat(),
            "phase":         result["phase"],
            "day_of_cycle":  result["day_of_cycle"],
            "color":         _phase_color(result["phase"]),
            "skin_risk":     result.get("skin_risk", 0.5),
            "phase_description": result.get("phase_description", ""),
            "dietary_adjustment": result.get("dietary_adjustment", ""),
            "skin_condition":     result.get("skin_risk", "moderate"),
            "hormone_info":       result.get("phase_description", ""),
        })

        cur += timedelta(days=1)

    # save to DB
    db = get_db()
    await db["cycles"].insert_one({
        "user_id":    user_id,
        "input":      data,
        "predictions": predictions,
        "created_at": datetime.utcnow(),
    })

    return {"predictions": predictions}


def _simple_phase(days_since: int, cycle_length: int, period_duration: int) -> dict:
    if days_since < period_duration:
        phase = "Menstrual"
    elif days_since < 13:
        phase = "Follicular"
    elif days_since < 16:
        phase = "Ovulatory"
    else:
        phase = "Luteal"

    return {
        "phase":              phase,
        "day_of_cycle":       days_since + 1,
        "skin_risk":          0.5,
        "phase_description":  "",
        "dietary_adjustment": "",
    }
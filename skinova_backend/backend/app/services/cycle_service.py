# app/services/cycle_service.py
from datetime import datetime, timedelta, date as date_type, timezone
from app.pipelines.menstrual_pipeline.bilstm_pipeline import run_bilstm_pipeline
from app.db.mongodb import get_db
import logging

logger = logging.getLogger(__name__)

PHASE_COLORS = {
    "Menstrual":  "#E87070",
    "Follicular": "#7CC98A",
    "Ovulatory":  "#F0A896",
    "Luteal":     "#9B8AD4",
}


def _parse_date(s: str) -> datetime:
    if not s:
        raise ValueError("Empty date string")
    s = s.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    if len(s) == 10 and s.count("-") == 2:
        return datetime.fromisoformat(s + "T00:00:00")
    s = s.replace(" ", "T", 1)
    try:
        dt = datetime.fromisoformat(s)
        return dt.replace(tzinfo=None)
    except ValueError as e:
        raise ValueError(f"Cannot parse date string '{s}': {e}")


def _phase_color(phase: str) -> str:
    return PHASE_COLORS.get(phase, "#999999")


async def process_cycle_data(user_id: str, data: dict) -> dict:
    # Get cycle stats to determine cycle length
    cycle_stats = await get_cycle_stats(user_id)
    cycle_length = cycle_stats["average_cycle_length"]
    
    period_duration = int(data.get("period_duration", 5))
    last_period     = _parse_date(data["last_period_start"])

    start_date = _parse_date(data.get("start_date", last_period.strftime("%Y-%m-%d")))
    end_date   = _parse_date(
        data.get("end_date", (last_period + timedelta(days=cycle_length - 1)).strftime("%Y-%m-%d"))
    )

    max_end = start_date + timedelta(days=90)
    if end_date > max_end:
        end_date = max_end

    symptoms = data.get("symptoms", {"pain": 0.0, "mood": 0.5, "flow": 0.0, "stress": 0.2})

    predictions = []
    cur = start_date

    while cur <= end_date:
        days_since = (cur - last_period).days % cycle_length

        pipeline_input = {
            "last_period_start": last_period.strftime("%Y-%m-%d"),
            "cycle_length":      cycle_length,
            "period_duration":   period_duration,
            "has_history":       data.get("has_history", False),
            "cycle_history":     data.get("cycle_history", None),
            "symptoms":          symptoms,
            "target_date":       cur.date(),
        }

        try:
            result = run_bilstm_pipeline(pipeline_input)
        except Exception:
            result = _simple_phase(days_since, cycle_length, period_duration)

        phase = result["phase"]

        predictions.append({
            "date":               cur.date().isoformat(),
            "phase":              phase,
            "day_of_cycle":       result["day_of_cycle"],
            "days_left_in_phase": result.get("days_left_in_phase", 0),
            "color":              _phase_color(phase),
            "skin_risk":          result.get("skin_risk", "moderate"),
            "skin_condition":     result.get("skin_risk", "moderate"),
            "phase_description":  result.get("phase_description", ""),
            "dietary_adjustment": result.get("dietary_adjustment", ""),
            "hormone_info":       result.get("phase_description", ""),
            "tft_weight_multiplier": result.get("tft_weight_multiplier", 1.0),
        })

        cur += timedelta(days=1)

    db = get_db()
    await db["cycles"].insert_one({
        "user_id":     user_id,
        "input":       data,
        "predictions": predictions,
        "created_at":  datetime.utcnow(),
    })

    # Refresh forecast — cycle phase is a key TFT input (Luteal = 1.5× risk weight)
    await _refresh_forecast(user_id)

    return {"predictions": predictions}


def _simple_phase(days_since: int, cycle_length: int, period_duration: int) -> dict:
    ovulation_day = max(cycle_length - 14, 10)
    if days_since < period_duration:
        phase = "Menstrual"
    elif days_since < ovulation_day - 1:
        phase = "Follicular"
    elif days_since <= ovulation_day + 1:
        phase = "Ovulatory"
    else:
        phase = "Luteal"
    return {
        "phase":              phase,
        "day_of_cycle":       days_since + 1,
        "days_left_in_phase": 0,
        "skin_risk":          "moderate",
        "phase_description":  "",
        "dietary_adjustment": "",
        "tft_weight_multiplier": 1.0,
    }


async def _refresh_forecast(user_id: str):
    try:
        from app.services.forecast_service import generate_forecast
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        end   = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
        await generate_forecast(user_id, today, end)
        logger.info(f"Forecast refreshed for {user_id} after cycle update")
    except Exception as e:
        logger.error(f"Forecast refresh failed: {e}")


async def log_period(user_id: str, period_start: str, period_end: str = None) -> dict:
    """Log a new period for the user."""
    db = get_db()
    
    # Validate dates
    start_date = _parse_date(period_start)
    end_date = _parse_date(period_end) if period_end else None
    
    if end_date and end_date < start_date:
        raise ValueError("Period end date cannot be before start date")
    
    # Insert the period log
    period_doc = {
        "user_id": user_id,
        "period_start": period_start,
        "period_end": period_end,
        "created_at": datetime.utcnow(),
    }
    
    result = await db["period_logs"].insert_one(period_doc)
    
    # Update user's last period dates
    update_data = {"last_period_start": period_start}
    if period_end:
        update_data["last_period_end"] = period_end
    
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    return {"id": str(result.inserted_id), "message": "Period logged successfully"}


async def get_cycle_stats(user_id: str) -> dict:
    """Calculate cycle statistics from period history."""
    db = get_db()
    
    # Get all completed periods (with end dates) sorted by start date
    cursor = db["period_logs"].find(
        {"user_id": user_id, "period_end": {"$ne": None}}
    ).sort("period_start", 1)
    
    periods = []
    async for doc in cursor:
        periods.append({
            "start": doc["period_start"],
            "end": doc["period_end"]
        })
    
    if len(periods) < 2:
        # Not enough data, return default
        return {
            "average_cycle_length": 28,
            "last_cycle_length": None,
            "period_count": len(periods),
            "is_irregular": False,
            "variability": 0
        }
    
    # Calculate cycle lengths (difference between consecutive start dates)
    cycle_lengths = []
    for i in range(1, len(periods)):
        prev_start = _parse_date(periods[i-1]["start"])
        curr_start = _parse_date(periods[i]["start"])
        length = (curr_start - prev_start).days
        if 21 <= length <= 45:  # Valid range
            cycle_lengths.append(length)
    
    if not cycle_lengths:
        return {
            "average_cycle_length": 28,
            "last_cycle_length": None,
            "period_count": len(periods),
            "is_irregular": False,
            "variability": 0
        }
    
    avg_length = sum(cycle_lengths) / len(cycle_lengths)
    last_length = cycle_lengths[-1] if cycle_lengths else None
    
    # Calculate variability (standard deviation)
    if len(cycle_lengths) > 1:
        variance = sum((x - avg_length) ** 2 for x in cycle_lengths) / len(cycle_lengths)
        variability = variance ** 0.5
    else:
        variability = 0
    
    # Consider irregular if variability > 5 days or any cycle outside 25-35
    is_irregular = variability > 5 or any(length < 25 or length > 35 for length in cycle_lengths)
    
    return {
        "average_cycle_length": round(avg_length),
        "last_cycle_length": last_length,
        "period_count": len(periods),
        "is_irregular": is_irregular,
        "variability": round(variability, 1)
    }
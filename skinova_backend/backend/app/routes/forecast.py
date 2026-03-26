from fastapi import APIRouter
from services.forecast_service import generate_forecast, get_day_report

router = APIRouter()

@router.post("/forecast/daily-data")
def daily_data(data: dict):
    return {
        "daily_data": generate_forecast(
            data["user_id"],
            data["start_date"],
            data["end_date"]
        )
    }


@router.post("/forecast/day-report")
def day_report(data: dict):
    return {
        "report": get_day_report(
            data["user_id"],
            data["date"]
        )
    }
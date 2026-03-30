# app/routes/forecast.py — replace existing file

from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services.forecast_service import generate_forecast, get_day_report_with_llm

router = APIRouter(prefix="/forecast", tags=["Forecast"])

@router.post("/daily-data")
async def daily_data(data: dict, current_user: dict = Depends(get_current_user)):
    return {
        "daily_data": await generate_forecast(
            current_user["id"],
            data["start_date"],
            data["end_date"]
        )
    }

@router.post("/day-report")
async def day_report(data: dict, current_user: dict = Depends(get_current_user)):
    return {
        "report": await get_day_report_with_llm(
            current_user["id"],
            data["date"]
        )
    }
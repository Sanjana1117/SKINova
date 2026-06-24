# app/routes/forecast.py 

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
    
    
@router.get("/debug-logs")
async def debug_logs(current_user: dict = Depends(get_current_user)):
    from app.db.mongodb import get_db
    db = get_db()
    face, food = [], []
    async for d in db["face_logs"].find({"user_id": current_user["id"]}).limit(2):
        d.pop("_id", None); face.append(d)
    async for d in db["food_logs"].find({"user_id": current_user["id"]}).limit(2):
        d.pop("_id", None); food.append(d)
    return {"face": face, "food": food}
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.auth import get_current_user
from app.services.cycle_service import process_cycle_data, log_period, get_cycle_stats
from app.schemas.cycle import PeriodLog

router = APIRouter(prefix="/cycle", tags=["Cycle"])

@router.post("/predict")
async def predict_cycle(data: dict, current_user: dict = Depends(get_current_user)):
    return await process_cycle_data(current_user["id"], data)

@router.post("/log-period")
async def log_user_period(period: PeriodLog, current_user: dict = Depends(get_current_user)):
    if period.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Cannot log periods for other users")
    return await log_period(period.user_id, period.period_start, period.period_end)

@router.get("/stats")
async def get_user_cycle_stats(current_user: dict = Depends(get_current_user)):
    return await get_cycle_stats(current_user["id"])
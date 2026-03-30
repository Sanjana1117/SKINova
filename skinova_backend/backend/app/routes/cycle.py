from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services.cycle_service import process_cycle_data

router = APIRouter(prefix="/cycle", tags=["Cycle"])

@router.post("/predict")
async def predict_cycle(data: dict, current_user: dict = Depends(get_current_user)):
    return await process_cycle_data(current_user["id"], data)
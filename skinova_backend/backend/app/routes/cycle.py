from fastapi import APIRouter
from app.services.cycle_service import process_cycle_data

router = APIRouter()

@router.post("/cycle/predict")
async def predict_cycle(data: dict):
    return await process_cycle_data(data["user_id"], data)
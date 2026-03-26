from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services import tft_service

router = APIRouter(prefix="/tft", tags=["TFT"])


@router.post("/update")
async def tft_update(current_user: dict = Depends(get_current_user)):
    return await tft_service.update_tft(current_user["id"])


@router.get("/report")
async def tft_report(current_user: dict = Depends(get_current_user)):
    return await tft_service.get_tft_report(current_user["id"])

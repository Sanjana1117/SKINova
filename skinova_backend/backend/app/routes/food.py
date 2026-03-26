from fastapi import APIRouter, Depends, File, UploadFile, Form
from typing import Optional
from app.dependencies import get_current_user
from app.services import food_service

router = APIRouter(prefix="/food", tags=["Food"])


@router.post("/analyze")
async def analyze_food(
    barcode: Optional[str] = Form(None),
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    return await food_service.analyze_food(
        user_id=current_user["id"],
        barcode=barcode,
        text=text,
        image=image,
    )


@router.get("/logs")
async def food_logs(current_user: dict = Depends(get_current_user)):
    return await food_service.get_food_logs(current_user["id"])

from fastapi import APIRouter, Depends, File, Request, UploadFile, Form
from typing import Optional
from app.dependencies import get_current_user
from app.services import product_service
from fastapi import Body
router = APIRouter(prefix="/product", tags=["Product"])


@router.post("/analyze")
async def analyze_product(
    request: Request,
    

    barcode: Optional[str] = Body(None),
    text: Optional[str] = Body(None),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    return await product_service.analyze_product(
        user_id=current_user["id"],
        barcode=barcode,
        text=text,
        image=image,
    )


@router.get("/logs")
async def product_logs(current_user: dict = Depends(get_current_user)):
    return await product_service.get_product_logs(current_user["id"])

# app/routes/product.py
from fastapi import APIRouter, Depends, File, UploadFile, Form, Body, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
from app.dependencies import get_current_user
from app.services import product_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/product", tags=["Product"])


@router.post("/add")
async def add_product(
    barcode:            Optional[str]        = Form(None),
    text:               Optional[str]        = Form(None),
    manual_ingredients: Optional[str]        = Form(None),
    image:              Optional[UploadFile] = File(None),
    file:               Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    """Add a product to user's registry (scanned once, persists)."""
    upload = image or file

    # Log what we received — no rejection here; service layer handles format conversion
    if upload:
        logger.info(f"[Product] Received file: filename={upload.filename!r} content_type={upload.content_type!r}")

    return await product_service.add_product(
        user_id=current_user["id"],
        barcode=barcode,
        text=text,
        image=upload,
        manual_ingredients=manual_ingredients,
    )


@router.put("/update/{product_id}")
async def update_product(
    product_id: str,
    updates: dict = Body(...),
    current_user: dict = Depends(get_current_user),
):
    """Edit product name, active status, or override ingredients."""
    return await product_service.update_product(
        user_id=current_user["id"],
        product_id=product_id,
        updates=updates,
    )


@router.delete("/delete/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Remove a product from the registry."""
    result = await product_service.delete_product(
        user_id=current_user["id"],
        product_id=product_id,
    )
    return JSONResponse(status_code=200, content=result)


@router.get("/list")
async def list_products(current_user: dict = Depends(get_current_user)):
    """Return all registered products for this user."""
    return await product_service.get_products(current_user["id"])


# Backward compat aliases
@router.post("/analyze")
async def analyze_product_compat(
    barcode:  Optional[str]        = Form(None),
    text:     Optional[str]        = Form(None),
    image:    Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    return await product_service.add_product(
        user_id=current_user["id"], barcode=barcode, text=text, image=image,
    )


@router.get("/logs")
async def product_logs_compat(current_user: dict = Depends(get_current_user)):
    return await product_service.get_products(current_user["id"])
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
async def dashboard(current_user: dict = Depends(get_current_user)):
    return await dashboard_service.get_dashboard(current_user["id"])

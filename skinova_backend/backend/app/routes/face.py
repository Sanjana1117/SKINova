from fastapi import APIRouter, Depends, File, UploadFile
from app.dependencies import get_current_user
from app.services import face_service

router = APIRouter(prefix="/face", tags=["Face"])


@router.post("/analyze")
async def analyze_face(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    return await face_service.analyze_face(
        user_id=current_user["id"],
        image=image,
    )


@router.get("/logs")
async def face_logs(current_user: dict = Depends(get_current_user)):
    return await face_service.get_face_logs(current_user["id"])

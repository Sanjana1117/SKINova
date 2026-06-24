from fastapi import APIRouter, Depends, File, UploadFile, Form, Query
from typing import Optional
from app.dependencies.auth import get_current_user
from app.services import food_service
from datetime import datetime, timezone, timedelta
from app.db.mongodb import get_db

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
async def get_food_logs(
    days: int = Query(default=3, ge=1, le=30),
    current_user=Depends(get_current_user),
):
    """
    Returns food logs for the last N days (default 3).
    Frontend uses this to populate the Recent Logs list on mount.
    """
    db = get_db()
    user_id = str(current_user["_id"])
    since = datetime.now(timezone.utc) - timedelta(days=days)
 
    logs = []
    async for doc in db["food_logs"].find(
        {"user_id": user_id, "timestamp": {"$gte": since}}
    ).sort("timestamp", -1).limit(50):
        doc["_id"] = str(doc["_id"])
        # Normalize risk_score to 0-100 int
        raw = doc.get("risk_score", 0)
        doc["risk_score"] = round(float(raw) * 100) if float(raw) <= 1.0 else round(float(raw))
        logs.append(doc)
 
    return {"logs": logs}
 
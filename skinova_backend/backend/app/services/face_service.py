# face_service now just calls pipeline directly
from app.pipelines.skin_pipeline.skin_pipeline import run_skin_pipeline
from fastapi import UploadFile
from datetime import datetime, timezone
from app.db.mongodb import get_db

async def get_face_logs(user_id: str):
    return {
        "success": True,
        "logs": []
    }

async def analyze_face(user_id: str, image: UploadFile) -> dict:
    image_bytes = await image.read()

    # Upload to S3
    image_url = ""
    

    # Run pipeline — models load automatically
    result = run_skin_pipeline(image_bytes)

    # Save to MongoDB
    log_doc = {
        "user_id":    user_id,
        "image_url":  image_url,
        "timestamp":  datetime.now(timezone.utc),
        **result,
    }
    db     = get_db()
    res    = await db["face_logs"].insert_one(log_doc)
    log_doc["id"] = str(res.inserted_id)
    log_doc["timestamp"] = log_doc["timestamp"].isoformat()
    log_doc.pop("_id", None)
    return log_doc
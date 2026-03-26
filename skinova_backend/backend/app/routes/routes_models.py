# app/routes/models.py
# Upload trained model files via API — no restart needed

import shutil
import logging
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException, Form

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/models", tags=["Models"])

SAVE_DIR = Path(__file__).parent.parent.parent / "saved_models"
SAVE_DIR.mkdir(exist_ok=True)

ALLOWED_NAMES = {
    "yolo_skin",
    "cnn_skin",
    # Add more as pipelines are built
    # "food_yolo",
    # "tft_model",
}

ALLOWED_EXTENSIONS = {".pt", ".pth", ".h5", ".pkl"}


@router.post("/upload")
async def upload_model(
    model_name: str = Form(...),       # e.g. "yolo_skin"
    file: UploadFile = File(...),
):
    """
    Upload a trained model file.
    - model_name: must be one of the registered names
    - file: .pt / .pth / .h5 / .pkl
    
    After upload the model is immediately available — no restart needed.
    """
    if model_name not in ALLOWED_NAMES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown model name '{model_name}'. Allowed: {sorted(ALLOWED_NAMES)}"
        )

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{suffix}' not allowed. Use: {sorted(ALLOWED_EXTENSIONS)}"
        )

    save_path = SAVE_DIR / f"{model_name}{suffix}"

    # Save file to disk
    try:
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save model: {e}")

    # Update model registry path
    from app.models.model_loader import MODEL_PATHS, _model_cache
    MODEL_PATHS[model_name] = save_path

    # Clear cache so next request reloads with new file
    _model_cache.pop(model_name, None)

    logger.info(f"Model '{model_name}' uploaded to {save_path}")

    return {
        "message":    f"Model '{model_name}' uploaded successfully",
        "model_name": model_name,
        "saved_to":   str(save_path),
        "ready":      True,
    }


@router.get("/status")
async def model_status():
    """Check which models are loaded and available"""
    from app.models.model_loader import MODEL_PATHS, _model_cache

    status = {}
    for name, path in MODEL_PATHS.items():
        status[name] = {
            "file_exists": Path(path).exists(),
            "loaded":      name in _model_cache,
            "path":        str(path),
        }
    return {"models": status}
# app/models/model_loader.py

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Each pipeline has its own models folder ───────────────────────
PIPELINES_DIR = Path(__file__).parent.parent / "pipelines"

MODEL_PATHS = {
    "yolo_skin": PIPELINES_DIR / "skin_pipeline" / "skinova_yolo_best.pt",
    "cnn_skin":  PIPELINES_DIR / "skin_pipeline" / "skin_cnn_scratch_best.pth",
    # future:
    # "food_yolo": PIPELINES_DIR / "food_pipeline" / "food_yolo.pt",
}

_model_cache: dict = {}


def load_yolo(model_path: Path):
    from ultralytics import YOLO
    model = YOLO(str(model_path))
    logger.info(f"YOLOv8 loaded from {model_path}")
    return model


def load_cnn(model_path: Path):
    ext = model_path.suffix.lower()
    if ext == ".h5":
        from tensorflow.keras.models import load_model
        model = load_model(str(model_path))
        logger.info(f"CNN (.h5) loaded from {model_path}")
        return model
    elif ext == ".pth":
        import torch
        from app.models.cnn_model import SkinCNN

        model = SkinCNN(num_classes=7)  # ⚠️ MUST MATCH TRAINING
        state_dict = torch.load(str(model_path), map_location="cpu")

        model.load_state_dict(state_dict)
        model.eval()

        logger.info(f"CNN (.pth) loaded from {model_path}")
        return model
    raise ValueError(f"Unsupported format: {ext}")


def get_model(name: str):
    if name in _model_cache:
        return _model_cache[name]

    if name not in MODEL_PATHS:
        logger.warning(f"Model '{name}' not in registry")
        return None

    path = MODEL_PATHS[name]
    if not path.exists():
        logger.warning(f"Model file not found: {path} — using mock")
        return None

    if "yolo" in name:
        model = load_yolo(path)
    elif "cnn" in name:
        model = load_cnn(path)
    else:
        return None

    _model_cache[name] = model
    return model


def is_model_available(name: str) -> bool:
    if name not in MODEL_PATHS:
        return False
    return MODEL_PATHS[name].exists()
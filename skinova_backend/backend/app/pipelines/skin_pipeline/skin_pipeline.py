# app/pipelines/skin_pipeline/skin_pipeline.py

import logging
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Load models directly inside pipeline ─────────────────────────
from app.models.model_loader import get_model

def get_skin_models():
    """Call this once per request — returns cached models"""
    yolo = get_model("yolo_skin")
    cnn  = get_model("cnn_skin")
    
    return yolo, cnn


# CNN class labels — update to match your training labels
CNN_CLASSES = [
    "Normal", "Acne", "Rosacea",
    "Eczema", "Hyperpigmentation",
    "Dryness", "Oiliness",
]


def run_yolo(model, image_bytes: bytes) -> dict:
    from PIL import Image
    import io

    img     = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = model(img, verbose=False)

    lesion_counts    = {}
    total_lesions    = 0
    confidence_scores = []

    for result in results:
        if result.boxes is not None:
            for box in result.boxes:
                cls_id   = int(box.cls[0])
                conf     = float(box.conf[0])
                cls_name = model.names.get(cls_id, f"condition_{cls_id}")
                lesion_counts[cls_name] = lesion_counts.get(cls_name, 0) + 1
                confidence_scores.append(conf)
                total_lesions += 1

    return {
        "total_lesions":  total_lesions,
        "lesion_counts":  lesion_counts,
        "avg_confidence": float(np.mean(confidence_scores)) if confidence_scores else 0.0,
    }


def run_cnn(model, image_bytes: bytes) -> dict:
    from PIL import Image
    import io, numpy as np

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)

    # Detect Keras vs PyTorch
    model_type = type(model).__module__
    if "keras" in model_type or "tensorflow" in model_type:
        preds = model.predict(arr, verbose=0)[0]
    else:
        import torch
        tensor = torch.tensor(arr).permute(0, 3, 1, 2)
        with torch.no_grad():
            preds = torch.softmax(model(tensor), dim=1)[0].numpy()

    class_idx = int(np.argmax(preds))
    confidence = float(preds[class_idx])
    primary    = CNN_CLASSES[class_idx] if class_idx < len(CNN_CLASSES) else "Unknown"

    return {
        "primary_condition": primary,
        "confidence":        confidence,
        "all_scores":        {CNN_CLASSES[i]: float(preds[i]) for i in range(min(len(preds), len(CNN_CLASSES)))},
    }


def calculate_skin_score(yolo_out: dict, cnn_out: dict) -> float:
    lesion_penalty = min(yolo_out.get("total_lesions", 0) / 30, 1.0) * 40

    CONDITION_WEIGHTS = {
        "Normal": 0.0, "Dryness": 0.15, "Oiliness": 0.15,
        "Acne": 0.35, "Hyperpigmentation": 0.25,
        "Rosacea": 0.30, "Eczema": 0.40,
    }
    condition_penalty = (
        CONDITION_WEIGHTS.get(cnn_out.get("primary_condition", "Normal"), 0.2)
        * cnn_out.get("confidence", 0.0) * 60
    )
    return round(max(0.0, min(100.0, 100.0 - lesion_penalty - condition_penalty)), 1)


def run_skin_pipeline(image_bytes: bytes) -> dict:
    """
    Main entry point — called by face_service.py
    Loads models automatically, runs inference, returns results
    """
    yolo_model, cnn_model = get_skin_models()
    models_used = []

    # YOLO
    if yolo_model:
        try:
            yolo_out = run_yolo(yolo_model, image_bytes)
            models_used.append("yolov8")
        except Exception as e:
            logger.error(f"YOLO failed: {e}")
            yolo_out = {"total_lesions": 0, "lesion_counts": {}, "avg_confidence": 0.0}
    else:
        yolo_out = {"total_lesions": 0, "lesion_counts": {}, "avg_confidence": 0.0}

    # CNN
    if cnn_model:
        try:
            cnn_out = run_cnn(cnn_model, image_bytes)
            models_used.append("cnn")
        except Exception as e:
            logger.error(f"CNN failed: {e}")
            cnn_out = {"primary_condition": "Pending", "confidence": 0.0}
    else:
        cnn_out = {"primary_condition": "Pending", "confidence": 0.0}

    skin_score = calculate_skin_score(yolo_out, cnn_out)
    severity   = "Mild" if skin_score >= 75 else "Moderate" if skin_score >= 45 else "Severe"

    return {
        "primary_condition": cnn_out["primary_condition"],
        "skin_score":        skin_score,
        "severity":          severity,
        "lesion_count":      yolo_out["total_lesions"],
        "lesion_breakdown":  yolo_out["lesion_counts"],
        "confidence":        cnn_out["confidence"],
        "models_used":       models_used,
        "mock":              len(models_used) == 0,
    }
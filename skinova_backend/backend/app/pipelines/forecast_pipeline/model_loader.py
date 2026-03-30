# app/pipelines/forecast_pipeline/model_loader.py

import logging
from pathlib import Path
import torch

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "skinova_tft_best.ckpt"


def load_tft_model():
    if not MODEL_PATH.exists():
        logger.warning(f"TFT model not found at {MODEL_PATH} — using mock")
        return None
    try:
        from pytorch_forecasting import TemporalFusionTransformer
        model = TemporalFusionTransformer.load_from_checkpoint(
            str(MODEL_PATH),
            map_location=torch.device("cpu")   # ← force CPU
        )
        model.eval()
        logger.info("TFT model loaded on CPU")
        return model
    except Exception as e:
        logger.error(f"TFT load failed: {e}")
        return None
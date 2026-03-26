# app/schemas/face.py
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime


class FaceAnalysisResponse(BaseModel):
    id:                  Optional[str]       = None
    user_id:             str
    image_url:           Optional[str]       = ""
    primary_condition:   str                          # e.g. "Acne", "Normal"
    skin_score:          float                        # 0-100
    severity:            str                          # "Mild" | "Moderate" | "Severe"
    lesion_count:        int
    lesion_breakdown:    Dict[str, int]      = {}     # e.g. {"acne": 3, "dark_spot": 1}
    confidence:          float               = 0.0
    models_used:         List[str]           = []
    mock:                bool                = False  # True = models not loaded yet
    timestamp:           Optional[str]       = None


class FaceLogItem(BaseModel):
    id:                  str
    primary_condition:   str
    skin_score:          float
    severity:            str
    lesion_count:        int
    timestamp:           str
    mock:                bool = False
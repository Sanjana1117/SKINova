from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FoodAnalyzeRequest(BaseModel):
    barcode: Optional[str] = None
    text: Optional[str] = None


class FoodLog(BaseModel):
    id: Optional[str] = None
    user_id: str
    image_url: Optional[str] = None
    ingredients: List[str]
    risk_score: float
    triggers: List[str]
    timestamp: datetime

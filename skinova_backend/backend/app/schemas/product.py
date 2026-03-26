from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProductAnalyzeRequest(BaseModel):
    barcode: Optional[str] = None
    text: Optional[str] = None


class ProductLog(BaseModel):
    id: Optional[str] = None
    user_id: str
    product_name: str
    ingredients: List[str]
    triggers: List[str]
    timestamp: datetime

from pydantic import BaseModel
from typing import Optional, List


class TFTReport(BaseModel):
    forecast: str
    trigger_timeline: List[dict]
    recommendations: str


class TriggerEntry(BaseModel):
    date: str
    triggers: List[str]
    source: str

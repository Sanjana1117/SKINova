from pydantic import BaseModel
from typing import Optional, List


class SkinScorePoint(BaseModel):
    date: str
    score: float


class DashboardResponse(BaseModel):
    skin_score_timeline: List[SkinScorePoint]
    forecast: Optional[dict]
    trigger_timeline: List[dict]
    hormonal_phase: Optional[str]

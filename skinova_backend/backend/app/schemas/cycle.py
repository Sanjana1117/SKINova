from pydantic import BaseModel
from typing import List, Optional

class CycleInput(BaseModel):
    user_id: str
    start_date: str
    end_date: str
    period_start_date: str
    period_end_date: str
    cycle_length: Optional[int] = 28


class Prediction(BaseModel):
    date: str
    phase: str
    day_of_cycle: int
    color: str
    hormone_info: str


class CycleResponse(BaseModel):
    predictions: List[Prediction]
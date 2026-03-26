from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    gender: Optional[str] = None
    last_period_end_date: Optional[str] = None
    skin_type: Optional[str] = None
    drugs: Optional[str] = None
    allergens: Optional[List[str]] = []


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── UserOut MUST be defined BEFORE TokenResponse ─────────────────
class UserOut(BaseModel):
    id: str
    name: str
    email: str
    gender: Optional[str] = None
    skin_type: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    drugs: Optional[str] = None
    allergens: Optional[List[str]] = []
    last_period_end_date: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut     # ← now UserOut is defined above, this works
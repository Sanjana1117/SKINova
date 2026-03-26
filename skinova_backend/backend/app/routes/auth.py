from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.auth import SignupRequest, LoginRequest   # ← auth not schema
from app.services.auth_service import signup_user, login_user, update_user_profile
from app.utils.security import decode_access_token
from app.db.mongodb import get_db                          # ← correct import
from bson import ObjectId

router   = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload["sub"]


@router.post("/signup", status_code=201)
async def signup(data: SignupRequest):
    return await signup_user(data)


@router.post("/login")
async def login(data: LoginRequest):
    return await login_user(data)


@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user_id)):
    from app.services.auth_service import _format_user
    col  = get_db()["users"]
    user = await col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _format_user(user)


@router.put("/profile")
async def update_profile(
    data: dict,
    user_id: str = Depends(get_current_user_id),
):
    return await update_user_profile(user_id, data)
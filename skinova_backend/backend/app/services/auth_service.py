# app/services/auth_service.py

from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from app.db.mongodb import get_db
from app.utils.security import hash_password, verify_password, create_access_token


def _get_users():
    return get_db()["users"]


def _format_user(user: dict) -> dict:
    return {
        "id":                   str(user["_id"]),
        "name":                 user.get("name", ""),
        "email":                user.get("email", ""),
        "gender":               user.get("gender"),
        "height":               user.get("height"),
        "weight":               user.get("weight"),
        "bmi":                  user.get("bmi"),
        "skin_type":            user.get("skin_type"),
        "drugs":                user.get("drugs", ""),
        "allergens":            user.get("allergens", []),
        "last_period_end_date": user.get("last_period_end_date"),
    }


async def signup_user(data):
    col = _get_users()
    existing = await col.find_one({"email": data.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name":                 data.name.strip(),
        "email":                data.email.lower().strip(),
        "password_hash":        hash_password(data.password),
        "height":               data.height,
        "weight":               data.weight,
        "bmi":                  data.bmi,
        "gender":               data.gender,
        "last_period_end_date": data.last_period_end_date if data.gender == "female" else None,
        "skin_type":            data.skin_type,
        "drugs":                data.drugs or "",
        "allergens":            data.allergens or [],
        "created_at":           datetime.utcnow().isoformat(),
        "updated_at":           datetime.utcnow().isoformat(),
    }

    result = await col.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    token = create_access_token({"sub": str(result.inserted_id)})

    return {
        "access_token": token,
        "token_type":   "bearer",
        "user":         _format_user(user_doc),
    }


async def login_user(data):
    col = _get_users()
    user = await col.find_one({"email": data.email.lower().strip()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["_id"])})

    return {
        "access_token": token,
        "token_type":   "bearer",
        "user":         _format_user(user),
    }


async def update_user_profile(user_id: str, data: dict):
    col = _get_users()
    data["updated_at"] = datetime.utcnow().isoformat()
    for field in ["password", "password_hash", "email", "id", "_id"]:
        data.pop(field, None)

    result = await col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    updated = await col.find_one({"_id": ObjectId(user_id)})
    return _format_user(updated)
from datetime import datetime, timedelta, timezone
import hashlib
import logging
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config.settings import settings

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _normalize_password(password: str) -> str:
    return str(password).strip()

def hash_password(password: str) -> str:
    return pwd_context.hash(_normalize_password(password))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_normalize_password(plain_password), hashed_password)

def verify_legacy_password(plain_password: str, hashed_password: str) -> bool:
    legacy_password = hashlib.sha256(_normalize_password(plain_password).encode()).hexdigest()
    return pwd_context.verify(legacy_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        # FIX: log the actual error so you can see WHY it fails
        logger.error(f"JWT decode failed: {e} | SECRET_KEY set: {bool(settings.SECRET_KEY)} | ALGORITHM: {settings.ALGORITHM}")
        return None

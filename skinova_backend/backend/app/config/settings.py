from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "skinova"

    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str = "skinova-images"

    FOOD_MODEL_URL: str = ""
    FACE_YOLO_MODEL_URL: str = ""
    FACE_CNN_MODEL_URL: str = ""
    TFT_MODEL_URL: str = ""
    LLAMA_MODEL_URL: str = ""
    BILSTM_MODEL_URL: str = ""
    VIT_MODEL_URL: str = ""

    OPENFOODFACTS_USER_AGENT: str = "Skinova/1.0"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

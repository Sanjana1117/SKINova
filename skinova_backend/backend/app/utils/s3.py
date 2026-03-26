import boto3
import uuid
from fastapi import UploadFile
from app.config import settings

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024


def validate_image(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Invalid file type: {file.content_type}. Allowed: {ALLOWED_CONTENT_TYPES}")


async def upload_image(file: UploadFile, folder: str = "uploads") -> str:
    validate_image(file)

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise ValueError("File size exceeds 10MB limit")

    await file.seek(0)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    key = f"{folder}/{uuid.uuid4()}.{ext}"

    s3_client.put_object(
        Bucket=settings.AWS_S3_BUCKET,
        Key=key,
        Body=contents,
        ContentType=file.content_type,
    )

    url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
    return url

import boto3
from dotenv import load_dotenv
import os

load_dotenv()

s3_client = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')

def upload_photo(file_bytes, filename):
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=filename,
        Body=file_bytes
    )
    return f"https://{BUCKET_NAME}.s3.amazonaws.com/{filename}"

def delete_photo(filename):
    s3_client.delete_object(
        Bucket=BUCKET_NAME,
        Key=filename
    )
    print(f"Deleted {filename} from S3")

def test_connection():
    try:
        s3_client.list_buckets()
        print("Connected to S3 successfully!")
    except Exception as e:
        print("S3 connection failed:", e)

test_connection()


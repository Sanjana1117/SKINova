from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGODB_URI)
db = client["skinova"]

# collections
users_collection = db["users"]
daily_logs_collection = db["daily_logs"]
skin_scores_collection = db["skin_scores"]
food_scores_collection = db["food_scores"]

def test_connection():
    try:
        client.admin.command('ping')
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print("Connection failed:", e)

test_connection()

def test_insert():
    try:
        result = users_collection.insert_one({"test": "hello"})
        print("Test insert successful:", result.inserted_id)
    except Exception as e:
        print("Insert failed:", e)

test_insert()
from fastapi import FastAPI
from pydantic import BaseModel
from backend.models.menstrual_pipeline.menstrual_module import get_phase
from backend.models.food_pipeline.scoring import calculate_score
from backend.database import users_collection, daily_logs_collection, food_scores_collection
from datetime import date
import requests

app = FastAPI()

# ─── MODELS ───────────────────────────────────────────
class BarcodeRequest(BaseModel):
    user_id: str
    barcode: str
    hormonal_phase: str = None

class CycleRequest(BaseModel):
    user_id: str
    last_period_start: str
    cycle_length: int = 28
    period_duration: int = 5
    has_history: bool = False
    symptoms: dict = {}

class UserProfile(BaseModel):
    user_id: str
    name: str
    age: int
    gender: str
    skin_type: str
    allergens: list = []
    food_sensitivities: list = []
    height: float
    weight: float
    cycle_length: int = 28
    period_duration: int = 5

class DailyLog(BaseModel):
    user_id: str
    date: str
    skin_score: float = None
    food_score: float = None
    hormonal_phase: str = None

# ─── ROUTES ───────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Skinova API is running"}

@app.post("/profile/create")
def create_profile(profile: UserProfile):
    existing = users_collection.find_one({"user_id": profile.user_id})
    if existing:
        return {"error": "User already exists"}
    users_collection.insert_one(profile.dict())
    return {"message": "Profile created successfully"}

@app.get("/profile/{user_id}")
def get_profile(user_id: str):
    user = users_collection.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return {"error": "User not found"}
    return user

@app.post("/analyze-barcode")
def analyze_barcode(request: BarcodeRequest):
    # fetch user profile for allergens
    user = users_collection.find_one({"user_id": request.user_id}, {"_id": 0})
    if not user:
        return {"error": "User not found"}

    allergens = user.get("allergens", [])

    url = f"https://world.openfoodfacts.org/api/v0/product/{request.barcode}.json"
    response = requests.get(url).json()

    if 'product' not in response:
        return {"error": "Product not found"}

    product = response['product']
    ingredients = product.get('ingredients_text', '')
    nutriments = product.get('nutriments', {})

    score = calculate_score(
        ingredients_text=ingredients,
        nutriments=nutriments,
        user_allergens=allergens,
        hormonal_phase=request.hormonal_phase
    )

    # save to food_scores collection
    food_scores_collection.insert_one({
        "user_id": request.user_id,
        "date": str(date.today()),
        "product_name": product.get('product_name'),
        "inflammatory_risk_score": score
    })

    return {
        "product_name": product.get('product_name'),
        "ingredients": ingredients,
        "inflammatory_risk_score": score
    }

@app.post("/cycle-phase")
def cycle_phase(request: CycleRequest):
    user = users_collection.find_one({"user_id": request.user_id}, {"_id": 0})
    if not user:
        return {"error": "User not found"}

    result = get_phase({
        "last_period_start": request.last_period_start,
        "cycle_length": user.get("cycle_length", request.cycle_length),
        "period_duration": user.get("period_duration", request.period_duration),
        "has_history": request.has_history,
        "symptoms": request.symptoms
    })
    return result

@app.post("/daily-log")
def save_daily_log(log: DailyLog):
    daily_logs_collection.insert_one(log.dict())
    return {"message": "Daily log saved successfully"}

@app.get("/daily-logs/{user_id}")
def get_daily_logs(user_id: str):
    logs = list(daily_logs_collection.find({"user_id": user_id}, {"_id": 0}))
    return logs

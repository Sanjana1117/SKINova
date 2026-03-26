from pipelines.forecast_pipeline.data_aggregrater import get_user_timeseries
from pipelines.forecast_pipeline.tft_pipeline import run_tft_pipeline
from pipelines.forecast_pipeline.post_process import map_risk_level
from app.db.mongodb import db

def generate_forecast(user_id, start_date, end_date):

    # 🔹 1. Get real data
    data = get_user_timeseries(user_id, start_date, end_date)

    # 🔹 2. Prepare timeline
    timeline = []

    for entry in data["skin"]:
        timeline.append({
            "date": entry["date"]
        })

    data["timeline"] = timeline

    # 🔹 3. Run TFT
    predictions = run_tft_pipeline(data)

    response = []

    for p in predictions:

        risk_score = p["risk_score"]

        # 🔹 STORE FULL SCORE
        db.forecast.insert_one({
            "user_id": user_id,
            "date": p["date"],
            "risk_score": risk_score
        })

        # 🔹 SEND ONLY LEVEL
        response.append({
            "date": p["date"],
            "trigger_level": map_risk_level(risk_score),
            "trigger_count": None
        })

    return response

def get_day_report(user_id, date):

    data = db.forecast.find_one({
        "user_id": user_id,
        "date": date
    })

    if not data:
        return None

    return {
        "condition": map_risk_level(data["risk_score"]),
        "triggers": [],
        "recommendations": "",
        "risk_score": data["risk_score"]
    }
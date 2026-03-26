from app.pipelines.menstrual_pipeline.bilstm_pipeline import run_bilstm_pipeline

data = {
    "last_period_start": "2026-02-20",
    "cycle_length": 28,
    "period_duration": 5,
    "has_history": False,
    "symptoms": {
        "pain": 0.1,
        "mood": 0.7,
        "flow": 0.0,
        "stress": 0.2
    }
}

result = run_bilstm_pipeline(data)

print(result)
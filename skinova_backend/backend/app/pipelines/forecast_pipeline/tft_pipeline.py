# app/pipelines/forecast_pipeline/tft_pipeline.py

import logging
from .model_loader import load_tft_model

logger = logging.getLogger(__name__)
model = None


def run_tft_pipeline(data):
    global model
    if model is None:
        model = load_tft_model()

    if model is None:
        return [{"date": d["date"], "risk_score": 0.0} for d in data["timeline"]]

    try:
        import torch, pandas as pd, numpy as np
        from pytorch_forecasting import TimeSeriesDataSet, GroupNormalizer

        dates    = [d["date"] for d in data["timeline"]]
        n        = len(dates)

        skin_scores  = [data["skin"][i]["score"]    if i < len(data["skin"])     else 0 for i in range(n)]
        food_scores  = [data["food"][i]["score"]    if i < len(data["food"])     else 0 for i in range(n)]
        cycle_phases = [data["cycle"][i]["phase"]   if i < len(data["cycle"])    else 1 for i in range(n)]
        prod_scores  = [data["products"][i]["score"] if i < len(data["products"]) else 0 for i in range(n)]

        # Build a minimal dataframe matching training schema
        df = pd.DataFrame({
            "time_idx":                range(n),
            "group_id":                [0] * n,
            "flare_target":            [0.0] * n,
            "acne_severity_score":     skin_scores,
            "inflammatory_food_score": food_scores,
            "lesion_count":            [s * 10 for s in skin_scores],
            "redness_score":           [0.3] * n,
            "dark_spot_score":         [0.2] * n,
            "skin_texture_score":      [0.5] * n,
            "sleep_hours":             [7.0] * n,
            "cumulative_product_exposure": [s * 5 for s in prod_scores],
            "cumulative_dairy_exposure":   [0.0] * n,
            "Dairy_content":           [0.0] * n,
            "poor_sleep_flag":         [0.0] * n,
            "phase_weight":            [1.0 + c * 0.1 for c in cycle_phases],
            "cycle_day":               list(range(1, n + 1)),
            "product_comedogenic_score": prod_scores,
            "new_product_flag":        [0.0] * n,
            "hormonal_state_enc":      [str(c % 3) for c in cycle_phases],
            "day_of_week":             ["Mon"] * n,
            "skin_type_enc":           ["normal"] * n,
            "allergy_enc":             ["none"] * n,
            "gender_enc":              ["F"] * n,
            "age":                     [25.0] * n,
            "bmi":                     [22.0] * n,
        })

        dataset = TimeSeriesDataSet(
            df, time_idx="time_idx", target="flare_target", group_ids=["group_id"],
            max_encoder_length=min(15, n), max_prediction_length=min(5, n),
            static_categoricals=["skin_type_enc", "allergy_enc", "gender_enc"],
            static_reals=["age", "bmi"],
            time_varying_known_categoricals=["hormonal_state_enc", "day_of_week"],
            time_varying_known_reals=["phase_weight", "cycle_day", "product_comedogenic_score", "new_product_flag"],
            time_varying_unknown_reals=[
                "lesion_count", "acne_severity_score", "redness_score", "dark_spot_score",
                "skin_texture_score", "inflammatory_food_score", "sleep_hours",
                "cumulative_product_exposure", "cumulative_dairy_exposure", "Dairy_content", "poor_sleep_flag"
            ],
            target_normalizer=GroupNormalizer(groups=["group_id"])
        )

        loader = dataset.to_dataloader(train=False, batch_size=1, num_workers=0)
        preds  = model.predict(loader)
        flat   = preds.flatten().tolist()

        results = []
        for i, date in enumerate(dates):
            score = float(flat[i]) if i < len(flat) else 0.0
            score = max(0.0, min(1.0, score))
            results.append({"date": date, "risk_score": round(score, 3)})
        return results

    except Exception as e:
        logger.error(f"TFT inference failed: {e}")
        return [{"date": d["date"], "risk_score": 0.0} for d in data["timeline"]]
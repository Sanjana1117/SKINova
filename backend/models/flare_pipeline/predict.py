# flare_pipeline/predict.py - Skinova TFT Production Predictor
import torch
import pandas as pd
import json
import numpy as np
from pytorch_forecasting import TemporalFusionTransformer, TimeSeriesDataSet, GroupNormalizer
from typing import Dict, Any

class FlarePredictor:
    def __init__(self, model_path: str = "./saved_models/skinova_tft_model.pt"):
        """Load TFT model + SHAP triggers"""
        self.model_path = model_path
        self.tft = None
        self.triggers = self._load_triggers()
        self._load_model()
    
    def _load_triggers(self) -> list:
        """Load hardcoded SHAP triggers"""
        return [
            {"name": "Dairy_content", "score": 0.284, "action": "Avoid 48h"},
            {"name": "Luteal phase", "score": 0.221, "action": "Anti-inflammatory"},
            {"name": "Sleep hours", "score": 0.187, "action": "8h minimum"},
            {"name": "Lesion count", "score": 0.156, "action": "Topical treatment"},
            {"name": "Food inflammation", "score": 0.132, "action": "Ice compress"}
        ]
    
    def _load_model(self):
        """Load TFT model with exact training config"""
        # Minimal dataset for architecture
        df_sample = pd.DataFrame({
            'group_id': ['user_1']*20, 'time_idx': list(range(20)),
            'age': [25]*20, 'bmi': [22.5]*20, 'skin_type_enc': [1]*20,
            'allergy_enc': [0]*20, 'gender_enc': [1]*20, 'flare_target': [0]*20,
            'lesion_count': np.random.uniform(0,5,20), 'Dairy_content': np.random.uniform(0,10,20),
            'sleep_hours': np.random.normal(7,1.5,20), 'hormonal_state_enc': np.random.choice([0,1,2],20),
            'phase_weight': [1.2]*20, 'cycle_day': list(range(1,21)), 
            'product_comedogenic_score': np.random.uniform(0,5,20),
            'new_product_flag': [0]*20, 'cumulative_product_exposure': list(range(20)),
            'cumulative_dairy_exposure': np.random.uniform(0,10,20), 'poor_sleep_flag': np.random.choice([0,1],20),
            'acne_severity_score': np.random.uniform(0,5,20),
            'redness_score': np.random.uniform(0,5,20), 'dark_spot_score': np.random.uniform(0,3,20),
            'skin_texture_score': np.random.uniform(0,5,20),
            'inflammatory_food_score': np.random.uniform(0,10,20), 'day_of_week': np.random.randint(0,7,20)
        })
        
        # String categories
        df_sample['skin_type_enc'] = df_sample['skin_type_enc'].map({0:'dry',1:'oily',2:'combo',3:'normal'})
        df_sample['allergy_enc'] = df_sample['allergy_enc'].map({0:'none',1:'dairy',2:'gluten',3:'nuts'})
        df_sample['gender_enc'] = df_sample['gender_enc'].map({0:'M',1:'F'})
        df_sample['hormonal_state_enc'] = df_sample['hormonal_state_enc'].map({0:'menstrual',1:'follicular',2:'luteal'})
        df_sample['day_of_week'] = df_sample['day_of_week'].map({0:'Mon',1:'Tue',2:'Wed',3:'Thu',4:'Fri',5:'Sat',6:'Sun'})
        
        # Create dataset
        dataset = TimeSeriesDataSet(
            df_sample, time_idx="time_idx", target="flare_target", group_ids=["group_id"],
            max_encoder_length=15, max_prediction_length=5,
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
        
        # Load TFT
        self.tft = TemporalFusionTransformer.from_dataset(
            dataset, hidden_size=32, learning_rate=0.001, 
            attention_head_size=2, dropout=0.1, hidden_continuous_size=16
        )
        self.tft.load_state_dict(torch.load(self.model_path))
        self.tft.eval()
        print("✅ FlarePredictor loaded!")
    
    def predict(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict flare risk from Flutter data"""
        # Convert to DataFrame (single prediction)
        df_input = pd.DataFrame([user_data])
        df_input['group_id'] = 'user_current'
        df_input['time_idx'] = 15
        df_input['flare_target'] = 0  # Dummy for dataset
        
        # String conversion
        df_input['skin_type_enc'] = df_input['skin_type_enc'].map({0:'dry',1:'oily',2:'combo',3:'normal'})
        df_input['allergy_enc'] = df_input['allergy_enc'].map({0:'none',1:'dairy',2:'gluten',3:'nuts'})
        df_input['gender_enc'] = df_input['gender_enc'].map({0:'M',1:'F'})
        df_input['hormonal_state_enc'] = df_input['hormonal_state_enc'].map({0:'menstrual',1:'follicular',2:'luteal'})
        df_input['day_of_week'] = df_input['day_of_week'].map({0:'Mon',1:'Tue',2:'Wed',3:'Thu',4:'Fri',5:'Sat',6:'Sun'})
        
        # Predict
        with torch.no_grad():
            prediction = self.tft.predict(df_input)
            flare_risk = float(prediction.mean().item())  # Fixed output access
        
        # Risk level
        risk_level = "HIGH" if flare_risk > 0.5 else "MEDIUM" if flare_risk > 0.2 else "LOW"
        
        return {
            "flare_risk": flare_risk,
            "risk_level": risk_level,
            "triggers": self.triggers,
            "recommendations": self._get_recommendations(flare_risk)
        }
    
    def _get_recommendations(self, risk: float) -> list:
        """Generate personalized recommendations"""
        if risk > 0.5:
            return ["🚨 Cut dairy immediately", "💤 Sleep 8+ hours", "🧊 Ice compress lesions"]
        elif risk > 0.2:
            return ["⚠️ Reduce dairy", "💤 Prioritize sleep", "🧴 Gentle skincare"]
        else:
            return ["✅ Continue routine", "📊 Monitor daily logs"]

# Test
if __name__ == "__main__":
    predictor = FlarePredictor()
    
    # Flutter-like test data
    test_data = {
        "age": 25.0, "bmi": 22.5, "skin_type_enc": 1, "allergy_enc": 1,
        "gender_enc": 1, "lesion_count": 3.2, "Dairy_content": 8.5,
        "sleep_hours": 5.2, "hormonal_state_enc": 2, "phase_weight": 1.5,
        "cycle_day": 21, "product_comedogenic_score": 2.1, "new_product_flag": 0,
        "cumulative_product_exposure": 12, "cumulative_dairy_exposure": 15.3,
        "poor_sleep_flag": 1, "acne_severity_score": 2.8, "redness_score": 1.9,
        "dark_spot_score": 1.2, "skin_texture_score": 2.4, "inflammatory_food_score": 6.1,
        "day_of_week": 2
    }
    
    result = predictor.predict(test_data)
    print("🩹 FLARE PREDICTION:", result)

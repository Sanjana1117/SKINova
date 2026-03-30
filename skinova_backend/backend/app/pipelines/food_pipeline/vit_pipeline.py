# app/pipelines/food_pipeline/vit_pipeline.py
import json, logging, io
from pathlib import Path

logger = logging.getLogger(__name__)

MODEL_PATH   = Path(__file__).parent / "vit_small_best.pt"
CLASSES_PATH = Path(__file__).parent / "class_names.json"

_model        = None
_idx_to_class = None  # {0: "achar", 1: "adhirasam", ...}

FOOD_PROFILES = {
    "dairy":   ["lassi","chaas","doodhpak","basundi","kheer","phirni","rabri","shrikhand","mishti_doi","misti_doi","kulfi","ice_cream"],
    "gluten":  ["chapati","naan","paratha","puri","bhatura","roti","misi_roti","missi_roti","makki_di_roti_sarson_da_saag"],
    "sugar":   ["jalebi","gulab_jamun","rasgulla","halwa","laddu","barfi","kheer","cham_cham","ghevar","imarti","kalakand"],
    "fiber":   ["apple","banana","kiwi","pear","mango","watermelon","spinach","lettuce","beetroot","carrots","peas","corn"],
    "omega3":  ["fish_curry","fried_fish","maach_jhol","pan_fried_prawns"],
}

SKIN_RISK_HIGH   = {"burger","pizza","doughnut","ice_cream","fried_chicken","fried_fish","fried_rice","brownie","cake","muffin","waffle","hot_dogs","taco","pepperoni_pizza","chicken_pizza","margherita_pizza","paneer_pizza"}
SKIN_RISK_MEDIUM = {"biryani","butter_chicken","dal_makhani","palak_paneer","paneer_butter_masala","chole_bhature","pav_bhaji","samosa","jalebi","gulab_jamun","rasgulla","chai","lassi","chow_mein","spring_rolls","momos"}


def _get_profile(food: str) -> dict:
    f = food.lower()
    return {
        "Dairy_content":           1.0 if f in FOOD_PROFILES["dairy"]  else 0.0,
        "Gluten_content":          1.0 if f in FOOD_PROFILES["gluten"] else 0.0,
        "Sugar_content":           1.0 if f in FOOD_PROFILES["sugar"]  else 0.0,
        "Omega_3_content":         1.0 if f in FOOD_PROFILES["omega3"] else 0.0,
        "Fiber_content":           1.0 if f in FOOD_PROFILES["fiber"]  else 0.0,
        "Zinc_content":            0.0,
        "Allergen_match":          0.0,
        "inflammatory_food_score": 0.8 if f in SKIN_RISK_HIGH else (0.5 if f in SKIN_RISK_MEDIUM else 0.1),
    }


def _get_risk(food: str):
    f = food.lower()
    if f in SKIN_RISK_HIGH:   return min(75 + abs(hash(f)) % 20, 95), "High sugar/fat — may trigger breakouts"
    if f in SKIN_RISK_MEDIUM: return 45 + abs(hash(f)) % 25,          "Moderate risk — monitor skin response"
    return 10 + abs(hash(f)) % 20, "Low risk — generally skin-friendly"


def _load():
    global _model, _idx_to_class
    if _idx_to_class is not None:
        return _model, _idx_to_class

    if not CLASSES_PATH.exists():
        logger.warning("class_names.json not found")
        return None, {}

    with open(CLASSES_PATH) as f:
        class_to_idx = json.load(f)  # {"achar": 0, "adhirasam": 1, ...}
    _idx_to_class = {v: k for k, v in class_to_idx.items()}

    if not MODEL_PATH.exists():
        logger.warning("ViT model not found — mock mode")
        return None, _idx_to_class

    try:
        import timm, torch
        ckpt        = torch.load(str(MODEL_PATH), map_location="cpu")
        num_classes = ckpt.get("num_classes", len(_idx_to_class))
        model       = timm.create_model("vit_small_patch16_224", pretrained=False, num_classes=num_classes)
        state       = ckpt.get("model_state_dict", ckpt)
        state       = {k.replace("module.", ""): v for k, v in state.items()}
        model.load_state_dict(state)
        model.eval()
        _model = model
        logger.info(f"ViT loaded — {num_classes} classes, val_acc={ckpt.get('val_top1','N/A')}")
    except Exception as e:
        logger.error(f"ViT load failed: {e}")
        _model = None

    return _model, _idx_to_class


def run_vit_pipeline(image_bytes: bytes) -> dict:
    model, idx_to_class = _load()

    if not idx_to_class:
        return {"food_name": "Unknown", "risk_score": 50, "trigger": "Model not ready",
                "confidence": 0.0, "nutritional_profile": {}, "mock": True}

    if model is None:
        import random
        food  = random.choice(list(idx_to_class.values()))
        risk, trigger = _get_risk(food)
        return {
            "food_name":           food.replace("_", " ").title(),
            "risk_score":          risk,
            "trigger":             trigger,
            "confidence":          0.82,
            "nutritional_profile": _get_profile(food),
            "ingredients":         [food.replace("_", " ").title()],
            "mock":                True,
        }

    try:
        import torch
        from torchvision import transforms
        from PIL import Image

        tf = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        img    = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = tf(img).unsqueeze(0)

        with torch.no_grad():
            probs = torch.softmax(model(tensor), dim=1)[0]
            idx   = int(probs.argmax())
            conf  = float(probs[idx])

        food          = idx_to_class.get(idx, "unknown")
        risk, trigger = _get_risk(food)

        return {
            "food_name":           food.replace("_", " ").title(),
            "risk_score":          risk,
            "trigger":             trigger,
            "confidence":          round(conf, 3),
            "nutritional_profile": _get_profile(food),
            "ingredients":         [food.replace("_", " ").title()],
            "mock":                False,
        }
    except Exception as e:
        logger.error(f"ViT inference: {e}")
        return {"food_name": "Unknown", "risk_score": 50, "trigger": "Analysis failed",
                "confidence": 0.0, "nutritional_profile": {}, "mock": True}
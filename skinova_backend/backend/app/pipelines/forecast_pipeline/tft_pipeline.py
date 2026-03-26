import torch
from .model_loader import load_tft_model

model = load_tft_model()

def run_tft_pipeline(data):

    # 🔹 1. PREPARE INPUT (VERY IMPORTANT)
    # Combine all sources into tensor

    sequence = []

    for i in range(len(data["timeline"])):
        day = data["timeline"][i]

        skin = data["skin"][i]["score"] if i < len(data["skin"]) else 0
        food = data["food"][i]["score"] if i < len(data["food"]) else 0
        cycle = data["cycle"][i]["phase"] if i < len(data["cycle"]) else 0
        product = data["products"][i]["score"] if i < len(data["products"]) else 0

        sequence.append([
            skin,
            food,
            cycle,
            product
        ])

    # 🔹 convert to tensor
    input_tensor = torch.tensor([sequence], dtype=torch.float32)

    # 🔹 2. MODEL PREDICTION
    with torch.no_grad():
        output = model(input_tensor)

    # 🔹 3. OUTPUT PROCESSING
    results = []

    for i, day in enumerate(data["timeline"]):
        score = float(output[0][i])

        results.append({
            "date": day["date"],
            "risk_score": score
        })

    return results
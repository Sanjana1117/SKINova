import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
import pickle
import os

# Phase labels
PHASES = ["Menstrual", "Follicular", "Ovulatory", "Luteal"]

def generate_training_data(cycle_length=28, period_duration=5, num_cycles=6):
    X, y = [], []
    for cycle in range(num_cycles):
        for day in range(1, cycle_length + 1):
            # determine phase label
            if day <= period_duration:
                phase = 0  # Menstrual
            elif day <= 13:
                phase = 1  # Follicular
            elif day <= 16:
                phase = 2  # Ovulatory
            else:
                phase = 3  # Luteal

            # simulate symptoms per phase
            pain = np.random.randint(3, 6) if phase == 0 else np.random.randint(1, 3)
            bloating = np.random.randint(3, 6) if phase in [0, 3] else np.random.randint(1, 3)
            mood = np.random.randint(1, 3) if phase == 3 else np.random.randint(3, 6)
            flow = np.random.randint(2, 4) if phase == 0 else 0
            stress = np.random.randint(3, 6) if phase == 3 else np.random.randint(1, 3)

            X.append([day, cycle_length, period_duration, pain, bloating, mood, flow, stress])
            y.append(phase)

    return np.array(X), np.array(y)

def train_model(cycle_length=28, period_duration=5):
    X, y = generate_training_data(cycle_length, period_duration, num_cycles=12)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = MLPClassifier(
        hidden_layer_sizes=(64, 32),
        activation='relu',
        max_iter=500,
        random_state=42
    )
    model.fit(X_scaled, y)
    
    # save model
    os.makedirs("saved_models", exist_ok=True)
    with open("saved_models/ann_cycle.pkl", "wb") as f:
        pickle.dump((model, scaler), f)
    
    print("Model trained and saved.")
    return model, scaler

def predict_phase(day_of_cycle, cycle_length, period_duration, pain, bloating, mood, flow, stress):
    model_path = "saved_models/ann_cycle.pkl"
    
    if not os.path.exists(model_path):
        print("No model found, training now...")
        model, scaler = train_model(cycle_length, period_duration)
    else:
        with open(model_path, "rb") as f:
            model, scaler = pickle.load(f)
    
    features = np.array([[day_of_cycle, cycle_length, period_duration, pain, bloating, mood, flow, stress]])
    features_scaled = scaler.transform(features)
    prediction = model.predict(features_scaled)[0]
    
    return PHASES[prediction]

# test it
print(predict_phase(
    day_of_cycle=15,
    cycle_length=28,
    period_duration=5,
    pain=1,
    bloating=2,
    mood=4,
    flow=0,
    stress=2
))

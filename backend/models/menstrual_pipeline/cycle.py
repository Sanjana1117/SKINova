import numpy as np
import torch
import torch.nn as nn
import os

# ── Phase labels ──────────────────────────────────────────────────────────────
PHASES    = ["Menstrual", "Follicular", "Ovulatory", "Luteal"]
PHASE_MAP = {0: "Menstrual", 1: "Follicular", 2: "Ovulatory", 3: "Luteal"}

# ── CONFIG — must match training exactly ─────────────────────────────────────
SEQUENCE_LENGTH = 5       # last 5 cycles
HIDDEN_SIZE     = 64
NUM_LAYERS      = 2
DROPOUT         = 0.3
CYCLE_FEATURES  = [
    'LengthofCycle',
    'LengthofMenses',
    'LengthofLutealPhase',
    'EstimatedDayofOvulation',
    'MeanCycleLength'
]

# ── BiLSTM Model — identical to training architecture ────────────────────────
class SkinovaCyclePredictor(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, dropout):
        super().__init__()
        self.bilstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0
        )
        self.attention = nn.Sequential(
            nn.Linear(hidden_size * 2, 32),
            nn.Tanh(),
            nn.Linear(32, 1)
        )
        self.regressor = nn.Sequential(
            nn.Linear(hidden_size * 2, 64), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(64, 32),              nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        lstm_out, _ = self.bilstm(x)
        attn        = torch.softmax(self.attention(lstm_out), dim=1)
        context     = torch.sum(attn * lstm_out, dim=1)
        pred        = self.regressor(context).squeeze(-1)
        return pred, attn


# ── Singleton loader ──────────────────────────────────────────────────────────
_model    = None
_scaler_X = None
_scaler_y = None
_device   = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def _load_model():
    global _model, _scaler_X, _scaler_y

    model_path = os.path.join(
        os.path.dirname(__file__), "saved_models", "skinova_bilstm_best.pt"
    )

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"BiLSTM model not found at {model_path}.\n"
            "Train on Colab and copy skinova_bilstm_best.pt to saved_models/."
        )

    checkpoint = torch.load(model_path, map_location=_device, weights_only=False)

    model = SkinovaCyclePredictor(
        input_size=len(CYCLE_FEATURES),
        hidden_size=HIDDEN_SIZE,
        num_layers=NUM_LAYERS,
        dropout=DROPOUT
    ).to(_device)

    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    _model    = model
    _scaler_X = checkpoint['scaler_X']
    _scaler_y = checkpoint['scaler_y']
    print("BiLSTM cycle predictor loaded.")


# ── Core inference ────────────────────────────────────────────────────────────
def predict_cycle(
    days_since_period: int,
    past_cycle_lengths: list,
    period_duration: int = 5
) -> dict:
    """
    Main inference function — called from cycle_tracker.py

    Args:
        days_since_period:  how many days since last period started (0-based)
        past_cycle_lengths: list of past cycle lengths e.g. [28, 30, 27, 31, 29]
                            at least 1 value required, ideally 5+
        period_duration:    how many days the period lasts (default 5)

    Returns:
        dict: {
            current_phase,
            current_day,
            predicted_cycle_length,
            predicted_ovulation_day,
            days_until_next_period,
            days_until_ovulation,
            fertile_window_start,
            fertile_window_end
        }
    """
    global _model, _scaler_X, _scaler_y
    if _model is None:
        _load_model()

    # Pad history if less than SEQUENCE_LENGTH cycles
    history = list(past_cycle_lengths)
    while len(history) < SEQUENCE_LENGTH:
        history.insert(0, np.mean(history) if history else 28)
    history = history[-SEQUENCE_LENGTH:]

    mean_cycle = np.mean(history)

    # Build feature matrix from past cycles
    features = []
    for cl in history:
        cl       = float(cl)
        ovul     = max(cl - 14, 10)
        luteal   = cl - ovul
        features.append([
            cl,          # LengthofCycle
            float(period_duration),  # LengthofMenses
            luteal,      # LengthofLutealPhase
            ovul,        # EstimatedDayofOvulation
            mean_cycle   # MeanCycleLength
        ])

    X = np.array(features, dtype=np.float32).reshape(1, SEQUENCE_LENGTH, len(CYCLE_FEATURES))
    X_scaled = _scaler_X.transform(
        X.reshape(-1, len(CYCLE_FEATURES))
    ).reshape(1, SEQUENCE_LENGTH, len(CYCLE_FEATURES))

    X_tensor = torch.tensor(X_scaled, dtype=torch.float32).to(_device)

    _model.eval()
    with torch.no_grad():
        pred_scaled, _ = _model(X_tensor)
        pred_days = _scaler_y.inverse_transform(
            pred_scaled.cpu().numpy().reshape(-1, 1)
        ).flatten()[0]

    predicted_cycle_length = max(21, min(45, round(float(pred_days))))
    predicted_ovulation    = max(10, predicted_cycle_length - 14)
    current_day            = days_since_period + 1
    days_until_next_period = max(0, predicted_cycle_length - days_since_period)
    days_until_ovulation   = max(0, predicted_ovulation - current_day)

    # Derive current phase from predicted boundaries
    phase = _derive_phase(current_day, period_duration, predicted_ovulation)

    return {
        "current_phase":           phase,
        "current_day":             current_day,
        "predicted_cycle_length":  predicted_cycle_length,
        "predicted_ovulation_day": predicted_ovulation,
        "days_until_next_period":  days_until_next_period,
        "days_until_ovulation":    days_until_ovulation,
        "fertile_window_start":    max(1, predicted_ovulation - 3),
        "fertile_window_end":      predicted_ovulation + 1,
    }


# Backward compatible wrapper — called from old code
def predict_phase(
    day_of_cycle: int,
    cycle_length: int,
    period_duration: int,
    pain: float       = 0.0,
    bloating: float   = 0.0,
    mood: float       = 0.5,
    flow: float       = 0.0,
    stress: float     = 0.0,
    cycle_history: list = None
) -> str:
    """
    Backward compatible wrapper.
    Returns phase name string — same as old ANN output.
    For full output use predict_cycle() directly.
    """
    past_cycles = []
    if cycle_history:
        past_cycles = [c.get('cycle_length', cycle_length) for c in cycle_history]
    if not past_cycles:
        past_cycles = [cycle_length]

    try:
        result = predict_cycle(
            days_since_period=day_of_cycle - 1,
            past_cycle_lengths=past_cycles,
            period_duration=period_duration
        )
        return result['current_phase']
    except FileNotFoundError:
        # Model not loaded yet — fall back to rule-based
        ovulation_day = max(cycle_length - 14, 10)
        return _derive_phase(day_of_cycle, period_duration, ovulation_day)


def predict_phase_detailed(
    day_of_cycle: int,
    cycle_length: int,
    period_duration: int,
    cramps: float       = 0.0,
    mood: float         = 0.5,
    energy: float       = 0.5,
    discharge: int      = 0,
    menses_score: float = 0.0,
    cycle_history: list = None
) -> dict:
    """
    Detailed prediction — called from cycle_tracker.py
    Returns full dict with phase, cycle length, ovulation, fertile window.
    """
    past_cycles = []
    if cycle_history:
        past_cycles = [c.get('cycle_length', cycle_length) for c in cycle_history]
    if not past_cycles:
        past_cycles = [cycle_length]

    try:
        result = predict_cycle(
            days_since_period=day_of_cycle - 1,
            past_cycle_lengths=past_cycles,
            period_duration=period_duration
        )
        return {
            'phase':                   ["Menstrual","Follicular","Ovulatory","Luteal"].index(result['current_phase']),
            'phase_name':              result['current_phase'],
            'confidence':              None,   # regression model — no class probabilities
            'probabilities':           None,
            'predicted_cycle_length':  result['predicted_cycle_length'],
            'predicted_ovulation_day': result['predicted_ovulation_day'],
            'days_until_next_period':  result['days_until_next_period'],
            'days_until_ovulation':    result['days_until_ovulation'],
            'fertile_window_start':    result['fertile_window_start'],
            'fertile_window_end':      result['fertile_window_end'],
        }
    except FileNotFoundError:
        # Fallback to rule-based
        ovulation_day = max(cycle_length - 14, 10)
        phase = _derive_phase(day_of_cycle, period_duration, ovulation_day)
        return {
            'phase':                   ["Menstrual","Follicular","Ovulatory","Luteal"].index(phase),
            'phase_name':              phase,
            'confidence':              None,
            'probabilities':           None,
            'predicted_cycle_length':  cycle_length,
            'predicted_ovulation_day': ovulation_day,
            'days_until_next_period':  max(0, cycle_length - day_of_cycle),
            'days_until_ovulation':    max(0, ovulation_day - day_of_cycle),
            'fertile_window_start':    max(1, ovulation_day - 3),
            'fertile_window_end':      ovulation_day + 1,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────
def _derive_phase(current_day: int, period_duration: int, ovulation_day: int) -> str:
    if current_day <= period_duration:
        return "Menstrual"
    elif current_day < ovulation_day - 1:
        return "Follicular"
    elif current_day <= ovulation_day + 1:
        return "Ovulatory"
    else:
        return "Luteal"


def train_model(*args, **kwargs):
    raise NotImplementedError(
        "Use skinova_bilstm_training_v2.py on Colab to train. "
        "Place skinova_bilstm_best.pt in saved_models/."
    )


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    try:
        result = predict_cycle(
            days_since_period=9,
            past_cycle_lengths=[28, 30, 27, 29, 31],
            period_duration=5
        )
        print(f"Phase:              {result['current_phase']}")
        print(f"Current day:        {result['current_day']}")
        print(f"Predicted length:   {result['predicted_cycle_length']} days")
        print(f"Ovulation day:      {result['predicted_ovulation_day']}")
        print(f"Next period in:     {result['days_until_next_period']} days")
        print(f"Fertile window:     day {result['fertile_window_start']} – {result['fertile_window_end']}")
    except FileNotFoundError as e:
        print(f"Model not loaded yet: {e}")
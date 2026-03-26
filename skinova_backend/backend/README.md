# Skinova FastAPI Backend

Production-ready FastAPI backend for the Skinova AI skin intelligence system.

## Tech Stack

- **FastAPI** (async)
- **MongoDB** (Motor async driver)
- **AWS S3** (boto3) — image storage
- **OpenFoodFacts API** — barcode food lookup
- **OCR** (easyocr / pytesseract) — product label reading
- **JWT Auth** (python-jose + passlib/bcrypt)
- **Pydantic v2** — validation and schemas

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, lifespan, routers
│   ├── config/
│   │   └── settings.py          # Pydantic settings (env vars)
│   ├── routes/
│   │   ├── auth.py              # POST /api/auth/signup, /login
│   │   ├── food.py              # POST /api/food/analyze, GET /logs
│   │   ├── product.py           # POST /api/product/analyze, GET /logs
│   │   ├── face.py              # POST /api/face/analyze, GET /logs
│   │   ├── tft.py               # POST /api/tft/update, GET /report
│   │   └── dashboard.py         # GET /api/dashboard
│   ├── schemas/                 # Pydantic request/response models
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── food_service.py
│   │   ├── product_service.py
│   │   ├── face_service.py
│   │   ├── tft_service.py
│   │   └── dashboard_service.py
│   ├── db/
│   │   └── mongodb.py           # Motor async MongoDB connection
│   ├── utils/
│   │   ├── s3.py                # AWS S3 image upload
│   │   ├── security.py          # JWT + bcrypt helpers
│   │   ├── ocr.py               # easyocr / pytesseract helper
│   │   └── openfood.py          # OpenFoodFacts API client
│   └── dependencies/
│       └── auth.py              # JWT get_current_user dependency
├── requirements.txt
├── .env.example
└── run.py
```

## Setup

1. Copy `.env.example` to `.env` and fill in all values:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:
   ```bash
   python run.py
   # or
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. Visit interactive docs: `http://localhost:8000/docs`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Register user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/dashboard` | Yes | Full dashboard data |
| POST | `/api/food/analyze` | Yes | Analyze food (barcode/image/text) |
| GET | `/api/food/logs` | Yes | Food log history |
| POST | `/api/product/analyze` | Yes | Analyze skincare product |
| GET | `/api/product/logs` | Yes | Product log history |
| POST | `/api/face/analyze` | Yes | Analyze face image |
| GET | `/api/face/logs` | Yes | Face scan history |
| POST | `/api/tft/update` | Yes | Run TFT + LLaMA pipeline |
| GET | `/api/tft/report` | Yes | Get latest TFT forecast |
| GET | `/api/healthz` | No | Health check |

## Model Integration

All outputs come from external ML models. Set the following in `.env`:

- `VIT_MODEL_URL` — food image classification (ViT)
- `FOOD_MODEL_URL` — food text/ingredient analysis
- `FACE_YOLO_MODEL_URL` — face lesion detection (YOLO)
- `FACE_CNN_MODEL_URL` — acne/redness/texture scoring (CNN)
- `TFT_MODEL_URL` — temporal fusion transformer forecasting
- `LLAMA_MODEL_URL` — LLaMA recommendation generation
- `BILSTM_MODEL_URL` — hormonal phase prediction (BiLSTM, females only)

## MongoDB Collections

- `users` — user profiles
- `food_logs` — food analysis results
- `product_logs` — product analysis results
- `face_logs` — face scan results
- `forecasts` — TFT + LLaMA forecasts
- `triggers` — extracted trigger timelines

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.db.mongodb import connect_db, close_db
from app.routes.auth import router as auth_router
from app.routes.food import router as food_router
from app.routes.product import router as product_router
from app.routes.face import router as face_router
from app.routes.tft import router as tft_router
from app.routes.dashboard import router as dashboard_router
from app.routes.cycle import router as cycle_router
from app.routes.forecast import router as forecast_router
from app.routes.routes_models import router as models_router
from app.routes.triggers import router as triggers_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Connecting to MongoDB...")
    await connect_db()
    logger.info("MongoDB connected")
    yield
    await close_db()
    logger.info("MongoDB disconnected")

app = FastAPI(title="Skinova AI Backend", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",   # Expo web dev server
        "http://localhost:19006",  # older Expo web port
        "http://192.168.0.105:8081",     #your actual IP
        "http://192.168.0.105:19006",    
        "http://192.168.0.105:8000", 
        "http://localhost:3000",
        "http://10.237.1.60:8081",
        "http://10.237.1.60:19006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FIX 2: Removed the manual @app.options("/{full_path:path}") handler.
#         It was overriding the CORS middleware's preflight handling and
#         returning a plain dict instead of the required CORS headers.

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


API_PREFIX = "/api"
app.include_router(auth_router,      prefix=API_PREFIX)
app.include_router(food_router,      prefix=API_PREFIX)
app.include_router(product_router,   prefix=API_PREFIX)
app.include_router(face_router,      prefix=API_PREFIX)
app.include_router(tft_router,       prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX)
app.include_router(cycle_router,     prefix=API_PREFIX)
app.include_router(forecast_router,  prefix=API_PREFIX)
app.include_router(models_router,    prefix=API_PREFIX)
app.include_router(triggers_router,  prefix=API_PREFIX)


@app.get("/api/healthz")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0",  
        port=8000, 
        reload=True
    )
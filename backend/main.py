"""
FastAPI Application Entry Point
AI Inventory Optimization Platform — Backend API
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.routers import dashboard, products, regional, sales, ai_predict, profit
from backend.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup & shutdown lifecycle."""
    logger.info("🚀 Starting AI Inventory Optimization Platform API...")
    # Pre-load ML models on startup
    try:
        from ai_engine.inference import engine
        engine.load_models()
        logger.info("✅ ML models loaded")
    except Exception as e:
        logger.warning(f"⚠️ Models not loaded: {e} — using heuristic fallback")
    yield
    logger.info("🛑 Shutting down...")


app = FastAPI(
    title="AI Inventory Optimization Platform",
    description=(
        "Enterprise-grade AI-powered inventory optimization system. "
        "Provides demand forecasting, reorder recommendations, and profit analysis "
        "derived from e-commerce data — modelled on Amazon-scale inventory intelligence."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(dashboard.router,   prefix="/dashboard",       tags=["Dashboard"])
app.include_router(products.router,    prefix="/products",        tags=["Products"])
app.include_router(regional.router,    prefix="/regional-demand", tags=["Regional Demand"])
app.include_router(sales.router,       prefix="/sales",           tags=["Sales"])
app.include_router(ai_predict.router,  prefix="",                 tags=["AI Predictions"])
app.include_router(profit.router,      prefix="/profit-analysis", tags=["Profit Analysis"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "AI Inventory Optimization Platform",
        "version": "1.0.0",
        "status":  "operational",
        "docs":    "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "timestamp": __import__("datetime").datetime.utcnow().isoformat()}

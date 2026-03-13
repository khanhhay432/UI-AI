"""AI prediction routers — POST /predict-demand, POST /recommend-reorder"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import math
import pandas as pd
from fastapi import APIRouter, HTTPException
from backend.schemas.schemas import (
    DemandPredictRequest, DemandPredictResponse,
    ReorderRequest, ReorderResponse,
)
from ai_engine.inference import engine

router = APIRouter()


@router.post("/predict-demand", response_model=DemandPredictResponse)
async def predict_demand(request: DemandPredictRequest):
    """
    Predict future demand quantity for a product.
    Uses XGBoost DemandForecaster with fallback heuristic.

    Input: product features including month, region, discount, rolling averages.
    Output: predicted quantity with confidence interval.
    """
    try:
        data = request.model_dump()
        # Add cyclical features
        import numpy as np
        data["month_sin"] = math.sin(2 * math.pi * request.order_month / 12)
        data["month_cos"] = math.cos(2 * math.pi * request.order_month / 12)
        data["discount_pressure"] = request.discount * 100  # approximate
        data["ship_lag_days"]  = 4
        data["is_weekend_order"] = 0

        # Encode categoricals simply
        region_map = {"East": 0, "West": 1, "Central": 2, "South": 3}
        cat_map    = {"Furniture": 0, "Office Supplies": 1, "Technology": 2}
        segment_map = {"Consumer": 0, "Corporate": 1, "Home Office": 2}
        data["region_enc"]   = region_map.get(request.region or "West", 1)
        data["category_enc"] = cat_map.get(request.category or "Technology", 2)
        data["segment_enc"]  = 0

        df = pd.DataFrame([data])
        results = engine.predict_demand(df)
        r = results[0]
        return DemandPredictResponse(**r)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend-reorder", response_model=ReorderResponse)
async def recommend_reorder(request: ReorderRequest):
    """
    Generate AI-driven reorder recommendation for a product.
    Returns: recommended quantity, urgency level (HIGH/MEDIUM/LOW), confidence score.
    """
    try:
        data = request.model_dump()
        df   = pd.DataFrame([data])
        results = engine.recommend_reorder(df)
        r = results[0]
        return ReorderResponse(
            product_id=request.product_id,
            recommended_qty=int(r.get("recommended_qty", 1)),
            urgency=r.get("urgency", "MEDIUM"),
            confidence=float(r.get("confidence", 0.75)),
            model=r.get("model", "XGBoost v1"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

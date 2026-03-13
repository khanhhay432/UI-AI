"""Profit analysis router — GET /profit-analysis"""

from fastapi import APIRouter, HTTPException
from backend.services.analytics_service import get_profit_analysis

router = APIRouter()


@router.get("")
async def profit_analysis():
    """
    Returns profit risk analysis:
    - Count of unprofitable, over-discounted, slow-moving products
    - Anomaly count (Isolation Forest)
    - Per-product risk scores and flags
    - Critical product list (risk score > 40)
    - Recommendations per product
    """
    try:
        return get_profit_analysis()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

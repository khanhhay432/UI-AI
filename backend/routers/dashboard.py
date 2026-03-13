"""Dashboard router — GET /dashboard/metrics"""

from fastapi import APIRouter, HTTPException
from backend.services.analytics_service import get_dashboard_metrics

router = APIRouter()


@router.get("/metrics")
async def dashboard_metrics():
    """
    Returns executive KPI metrics:
    - Total Revenue, Profit, Orders, Products
    - Avg profit margin % and discount %
    - High-risk product count
    - Monthly sales trend (time-series)
    - Top 10 products by revenue
    """
    try:
        return get_dashboard_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

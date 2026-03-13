"""Regional demand router — GET /regional-demand"""

from fastapi import APIRouter, HTTPException
from backend.services.analytics_service import get_regional_demand

router = APIRouter()


@router.get("")
async def regional_demand():
    """
    Returns demand breakdown by Region × State:
    - Total sales, qty, profit per state
    - Avg profit margin %
    - Order count
    Used to render the regional heatmap in the dashboard.
    """
    try:
        return {"regions": get_regional_demand()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

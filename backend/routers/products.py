"""Products router — GET /products"""

from fastapi import APIRouter, Query, HTTPException
from backend.services.analytics_service import get_products_list

router = APIRouter()


@router.get("")
async def list_products(
    category: str | None = Query(None, description="Filter by category"),
    limit:    int        = Query(50, ge=1, le=200),
    offset:   int        = Query(0, ge=0),
):
    """
    Returns product catalog with performance metrics:
    - Sales, Qty, Profit, Margin, Discount
    - Velocity score (demand rank)
    - Risk flags (UNPROFITABLE / OVER_DISCOUNTED / SLOW_MOVER)
    """
    try:
        return {
            "products": get_products_list(category=category, limit=limit, offset=offset),
            "limit": limit,
            "offset": offset,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

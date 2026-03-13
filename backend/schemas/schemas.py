"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class ShipMode(str, Enum):
    standard = "Standard Class"
    second   = "Second Class"
    first    = "First Class"
    same_day = "Same Day"


class Segment(str, Enum):
    consumer   = "Consumer"
    corporate  = "Corporate"
    home_office = "Home Office"


class Region(str, Enum):
    east    = "East"
    west    = "West"
    central = "Central"
    south   = "South"


class UrgencyLevel(str, Enum):
    high   = "HIGH"
    medium = "MEDIUM"
    low    = "LOW"


# ── Product ────────────────────────────────────────────────────────────────
class ProductBase(BaseModel):
    product_id:   str
    product_name: str
    category:     Optional[str] = None
    sub_category: Optional[str] = None


class ProductResponse(ProductBase):
    total_sales:    float
    total_qty:      int
    total_profit:   float
    avg_margin:     float
    avg_discount:   float
    order_count:    int
    velocity_score: float
    risk_flags:     str = "OK"
    risk_score:     float = 0.0

    class Config:
        from_attributes = True


# ── Order / Sales Import ────────────────────────────────────────────────────
class SalesRowImport(BaseModel):
    row_id:        int
    order_id:      str
    order_date:    str
    ship_date:     str
    ship_mode:     str
    customer_id:   str
    customer_name: str
    segment:       str
    country:       str = "United States"
    city:          str
    state:         str
    postal_code:   str
    region:        str
    product_id:    str
    category:      str
    sub_category:  str
    product_name:  str
    sales:         float = Field(ge=0)
    quantity:      int   = Field(ge=1)
    discount:      float = Field(ge=0, le=1)
    profit:        float


class SalesImportRequest(BaseModel):
    rows: List[SalesRowImport]


class SalesImportResponse(BaseModel):
    imported:  int
    skipped:   int
    errors:    List[str] = []
    message:   str


# ── AI Prediction ──────────────────────────────────────────────────────────
class DemandPredictRequest(BaseModel):
    product_id:        str
    order_month:       int = Field(ge=1, le=12)
    order_quarter:     int = Field(ge=1, le=4)
    order_week:        int = Field(ge=1, le=53)
    discount:          float = Field(ge=0, le=1, default=0.0)
    region:            Optional[str] = None
    category:          Optional[str] = None
    rolling_qty_3m:    float = 0.0
    demand_volatility: float = 0.0
    qty_lag1:          float = 0.0
    qty_lag2:          float = 0.0


class DemandPredictResponse(BaseModel):
    product_id:     str
    predicted_qty:  float
    lower_bound:    float
    upper_bound:    float
    model:          str
    timestamp:      str


class ReorderRequest(BaseModel):
    product_id:        str
    rolling_qty_3m:    float = 0.0
    rolling_sales_3m:  float = 0.0
    demand_volatility: float = 0.0
    qty_lag1:          float = 0.0
    qty_lag2:          float = 0.0
    avg_discount:      float = 0.0
    avg_profit_margin: float = 0.2
    order_count:       int   = 1
    velocity_score:    float = 0.5


class ReorderResponse(BaseModel):
    product_id:      str
    recommended_qty: int
    urgency:         str
    confidence:      float
    model:           str


# ── Dashboard ─────────────────────────────────────────────────────────────
class DashboardMetrics(BaseModel):
    total_revenue:        float
    total_profit:         float
    total_orders:         int
    total_products:       int
    avg_profit_margin_pct: float
    avg_discount_pct:     float
    high_risk_products:   int
    pending_reorders:     int
    sales_trend:          List[dict]
    top_products:         List[dict]


# ── Regional ──────────────────────────────────────────────────────────────
class RegionalDemandItem(BaseModel):
    region:      str
    state:       str
    category:    str
    total_qty:   int
    total_sales: float
    total_profit: float
    order_count: int
    avg_margin_pct: float


# ── Profit Analysis ────────────────────────────────────────────────────────
class ProfitAnalysisResponse(BaseModel):
    total_products:     int
    unprofitable:       int
    over_discounted:    int
    slow_movers:        int
    anomalies:          int
    avg_risk_score:     float
    critical_products:  List[dict]
    product_details:    List[dict]

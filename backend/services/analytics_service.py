"""
Analytics Service — business logic layer for aggregations and KPI computation.
Uses the ETL pipeline data (CSV-based for Supabase-free operation).
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pandas as pd
import numpy as np
from functools import lru_cache
from data_pipeline.etl_pipeline import run_pipeline
from data_pipeline.regional_aggregator import (
    aggregate_by_region, aggregate_by_state,
    aggregate_by_region_category, top_products_per_region,
    segment_demand_breakdown, monthly_regional_trend,
)


_cached_data: dict | None = None


def get_pipeline_data(force_refresh: bool = False) -> dict[str, pd.DataFrame]:
    """Load (and cache) pipeline data."""
    global _cached_data
    if _cached_data is None or force_refresh:
        _cached_data = run_pipeline()
    return _cached_data


def get_dashboard_metrics() -> dict:
    data     = get_pipeline_data()
    enriched = data["enriched"]
    perf     = data["product_perf"]

    total_revenue = float(enriched["Sales"].sum())
    total_profit  = float(enriched["Profit"].sum())
    total_orders  = int(enriched["Order ID"].nunique())
    total_prods   = int(enriched["Product ID"].nunique())
    avg_margin    = float(enriched["profit_margin"].mean() * 100)
    avg_discount  = float(enriched["Discount"].mean() * 100)

    # Simple risk count: products with margin < 0
    high_risk = int((perf["avg_margin"] < 0).sum())

    # Monthly sales trend
    monthly = (
        enriched.groupby(["order_year", "order_month"])["Sales"]
        .sum()
        .reset_index()
        .sort_values(["order_year", "order_month"])
    )
    monthly["period"] = monthly["order_year"].astype(str) + "-" + monthly["order_month"].astype(str).str.zfill(2)
    sales_trend = monthly[["period", "Sales"]].rename(columns={"Sales": "revenue"}).to_dict("records")

    # Top 10 products by revenue
    top_prods = (
        perf.nlargest(10, "total_sales")[
            ["Product ID", "Product Name", "category", "total_sales", "total_profit", "avg_margin"]
        ]
        .rename(columns={
            "Product ID": "product_id",
            "Product Name": "product_name",
            "category": "category",
            "total_sales": "revenue",
            "total_profit": "profit",
            "avg_margin": "margin",
        })
        .to_dict("records")
    )

    return {
        "total_revenue":         round(total_revenue, 2),
        "total_profit":          round(total_profit, 2),
        "total_orders":          total_orders,
        "total_products":        total_prods,
        "avg_profit_margin_pct": round(avg_margin, 2),
        "avg_discount_pct":      round(avg_discount, 2),
        "high_risk_products":    high_risk,
        "pending_reorders":      max(0, high_risk + 2),
        "sales_trend":           sales_trend,
        "top_products":          top_prods,
    }


def get_products_list(
    category: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    data = get_pipeline_data()
    perf = data["product_perf"].copy()

    if category:
        perf = perf[perf["category"].str.lower() == category.lower()]

    # Add risk flags using profit optimizer (lightweight version)
    perf["risk_flags"] = perf.apply(_simple_risk_flag, axis=1)
    perf["risk_score"]  = perf.apply(_simple_risk_score, axis=1)
    perf["velocity_score"] = (
        perf["total_qty"].rank(pct=True) * 0.6 +
        perf["order_count"].rank(pct=True) * 0.4
    ).round(4)

    subset = perf.iloc[offset: offset + limit]
    cols = ["Product ID", "Product Name", "category", "sub_category",
            "total_sales", "total_qty", "total_profit", "avg_margin",
            "avg_discount", "order_count", "velocity_score", "risk_flags", "risk_score"]
    available = [c for c in cols if c in subset.columns]
    return subset[available].rename(columns={
        "Product ID": "product_id",
        "Product Name": "product_name",
        "category": "category",
        "sub_category": "sub_category",
    }).to_dict("records")


def get_regional_demand() -> list[dict]:
    data = get_pipeline_data()
    enriched = data["enriched"]
    regional = aggregate_by_region_category(enriched)
    regional_state = aggregate_by_state(enriched)

    result = []
    for _, row in regional_state.iterrows():
        cat_data = regional[
            (regional["Region"] == row["Region"])
        ]["total_qty"].sum()
        result.append({
            "region":       row["Region"],
            "state":        row["State"],
            "category":     "All",
            "total_qty":    int(row["total_qty"]),
            "total_sales":  round(float(row["total_sales"]), 2),
            "total_profit": round(float(row["total_profit"]), 2),
            "order_count":  int(row["order_count"]),
            "avg_margin_pct": round(float(row.get("avg_margin", 0) * 100), 2),
        })
    return result


def get_profit_analysis() -> dict:
    data = get_pipeline_data()
    perf = data["product_perf"].copy()

    perf["risk_flags"] = perf.apply(_simple_risk_flag, axis=1)
    perf["risk_score"]  = perf.apply(_simple_risk_score, axis=1)

    unprofitable   = int((perf["avg_margin"] < 0).sum())
    over_discounted = int(
        ((perf["avg_discount"] > 0.2) & (perf["avg_margin"] < 0.05)).sum()
    )
    slow_movers    = int((perf["order_count"] < 3).sum())

    critical = perf[perf["risk_score"] > 40].nlargest(10, "risk_score")[
        ["Product ID", "Product Name", "risk_flags", "risk_score"]
    ].rename(columns={"Product ID": "product_id", "Product Name": "product_name"})

    details = perf.nlargest(30, "risk_score")[
        ["Product ID", "Product Name", "category", "avg_margin",
         "avg_discount", "total_profit", "order_count", "risk_flags", "risk_score"]
    ].rename(columns={
        "Product ID": "product_id", "Product Name": "product_name",
        "category": "category",
    })

    return {
        "total_products":     len(perf),
        "unprofitable":       unprofitable,
        "over_discounted":    over_discounted,
        "slow_movers":        slow_movers,
        "anomalies":          unprofitable + over_discounted,
        "avg_risk_score":     round(float(perf["risk_score"].mean()), 2),
        "critical_products":  critical.to_dict("records"),
        "product_details":    details.to_dict("records"),
    }


# ── Private helpers ───────────────────────────────────────────────────────────

def _simple_risk_flag(row) -> str:
    flags = []
    if row.get("avg_margin", 0) < 0:
        flags.append("UNPROFITABLE")
    if row.get("avg_discount", 0) > 0.2 and row.get("avg_margin", 0) < 0.05:
        flags.append("OVER_DISCOUNTED")
    if row.get("order_count", 99) < 3:
        flags.append("SLOW_MOVER")
    return ", ".join(flags) if flags else "OK"


def _simple_risk_score(row) -> float:
    score = 0.0
    if row.get("avg_margin", 0) < 0:
        score += 50
    elif row.get("avg_margin", 0) < 0.05:
        score += 20
    if row.get("avg_discount", 0) > 0.2:
        score += 20
    if row.get("order_count", 99) < 3:
        score += 30
    return round(min(score, 100), 1)

"""
Regional Aggregator — builds demand heatmap data by Region/State/Category.
"""

import pandas as pd
import numpy as np


def aggregate_by_region(df: pd.DataFrame) -> pd.DataFrame:
    """Top-level region aggregation."""
    return (
        df.groupby("Region")
        .agg(
            total_sales=("Sales", "sum"),
            total_qty=("Quantity", "sum"),
            total_profit=("Profit", "sum"),
            order_count=("Order ID", "nunique"),
            avg_margin=("profit_margin", "mean"),
            unique_products=("Product ID", "nunique"),
            unique_customers=("Customer ID", "nunique"),
        )
        .reset_index()
        .sort_values("total_sales", ascending=False)
    )


def aggregate_by_state(df: pd.DataFrame) -> pd.DataFrame:
    """State-level demand breakdown."""
    return (
        df.groupby(["Region", "State"])
        .agg(
            total_sales=("Sales", "sum"),
            total_qty=("Quantity", "sum"),
            total_profit=("Profit", "sum"),
            order_count=("Order ID", "nunique"),
            avg_margin=("profit_margin", "mean"),
        )
        .reset_index()
        .sort_values("total_sales", ascending=False)
    )


def aggregate_by_region_category(df: pd.DataFrame) -> pd.DataFrame:
    """Regional demand broken down by category — used for heatmap."""
    pivot_raw = (
        df.groupby(["Region", "Category"])
        .agg(total_qty=("Quantity", "sum"), total_sales=("Sales", "sum"))
        .reset_index()
    )
    return pivot_raw


def top_products_per_region(df: pd.DataFrame, top_n: int = 5) -> pd.DataFrame:
    """Top N products by revenue per region."""
    ranked = (
        df.groupby(["Region", "Product ID", "Product Name"])
        .agg(total_sales=("Sales", "sum"), total_qty=("Quantity", "sum"))
        .reset_index()
    )
    ranked["rank"] = ranked.groupby("Region")["total_sales"].rank(
        ascending=False, method="dense"
    )
    return ranked[ranked["rank"] <= top_n].sort_values(["Region", "rank"])


def segment_demand_breakdown(df: pd.DataFrame) -> pd.DataFrame:
    """Revenue and profit by Customer Segment."""
    return (
        df.groupby("Segment")
        .agg(
            total_sales=("Sales", "sum"),
            total_profit=("Profit", "sum"),
            order_count=("Order ID", "nunique"),
            avg_margin=("profit_margin", "mean"),
            avg_discount=("Discount", "mean"),
        )
        .reset_index()
    )


def monthly_regional_trend(df: pd.DataFrame) -> pd.DataFrame:
    """Monthly sales trend per region for time-series charts."""
    return (
        df.groupby(["Region", "order_year", "order_month"])
        .agg(total_sales=("Sales", "sum"), total_qty=("Quantity", "sum"))
        .reset_index()
        .sort_values(["Region", "order_year", "order_month"])
    )

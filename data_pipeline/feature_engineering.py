"""
Feature Engineering — advanced feature construction for ML models.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder


def extract_date_features(df: pd.DataFrame, date_col: str = "Order Date") -> pd.DataFrame:
    """Decompose date column into ML-friendly features."""
    df = df.copy()
    dt = df[date_col]
    df["year"]        = dt.dt.year
    df["month"]       = dt.dt.month
    df["week"]        = dt.dt.isocalendar().week.astype(int)
    df["quarter"]     = dt.dt.quarter
    df["dayofweek"]   = dt.dt.dayofweek
    df["is_weekend"]  = (dt.dt.dayofweek >= 5).astype(int)
    # Cyclical encoding for month (captures seasonality)
    df["month_sin"]   = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"]   = np.cos(2 * np.pi * df["month"] / 12)
    df["week_sin"]    = np.sin(2 * np.pi * df["week"] / 52)
    df["week_cos"]    = np.cos(2 * np.pi * df["week"] / 52)
    return df


def compute_rolling_features(
    df: pd.DataFrame,
    group_col: str = "Product ID",
    value_col: str = "Quantity",
    windows: list[int] = [3, 6],
) -> pd.DataFrame:
    """Add rolling mean/std features per group."""
    df = df.sort_values(["Product ID", "period"]).copy()
    for w in windows:
        df[f"rolling_mean_{w}"] = (
            df.groupby(group_col)[value_col]
            .transform(lambda x: x.rolling(w, min_periods=1).mean())
        )
        df[f"rolling_std_{w}"] = (
            df.groupby(group_col)[value_col]
            .transform(lambda x: x.rolling(w, min_periods=1).std().fillna(0))
        )
    return df


def compute_lag_features(
    df: pd.DataFrame,
    group_col: str = "Product ID",
    value_col: str = "total_qty",
    lags: list[int] = [1, 2, 3],
) -> pd.DataFrame:
    """Add lag features per group."""
    df = df.sort_values([group_col]).copy()
    for lag in lags:
        df[f"{value_col}_lag{lag}"] = (
            df.groupby(group_col)[value_col].shift(lag).fillna(0)
        )
    return df


def compute_velocity_score(df: pd.DataFrame) -> pd.DataFrame:
    """Composite velocity score: blend of qty rank and order_count rank."""
    df = df.copy()
    df["qty_rank"]   = df["total_qty"].rank(pct=True)
    df["order_rank"] = df["order_count"].rank(pct=True)
    df["velocity_score"] = (0.6 * df["qty_rank"] + 0.4 * df["order_rank"]).round(4)
    return df


def compute_discount_pressure(df: pd.DataFrame) -> pd.DataFrame:
    """Discount pressure = absolute discount impact on revenue."""
    df = df.copy()
    df["discount_pressure"] = df["Discount"] * df["Sales"]
    df["discount_category"] = pd.cut(
        df["Discount"],
        bins=[-0.01, 0.0, 0.1, 0.2, 0.4, 1.01],
        labels=["None", "Low", "Medium", "High", "Extreme"],
    )
    return df


def label_encode_columns(
    df: pd.DataFrame, columns: list[str], return_encoders: bool = False
) -> tuple[pd.DataFrame, dict] | pd.DataFrame:
    df = df.copy()
    encoders = {}
    for col in columns:
        le = LabelEncoder()
        df[f"{col}_enc"] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    if return_encoders:
        return df, encoders
    return df


def build_ml_feature_matrix(
    enriched_df: pd.DataFrame,
    product_ts: pd.DataFrame,
) -> pd.DataFrame:
    """
    Merge enriched order-level data with product time-series stats
    to build the full feature matrix for ML training.
    """
    # Merge product timeseries onto enriched by Product ID + month
    feature_df = enriched_df.merge(
        product_ts[[
            "Product ID", "period", "rolling_qty_3m", "rolling_sales_3m",
            "demand_volatility", "qty_lag1", "qty_lag2"
        ]],
        how="left",
        left_on=["Product ID", "period"] if "period" in enriched_df.columns else ["Product ID"],
        right_on=["Product ID", "period"] if "period" in enriched_df.columns else ["Product ID"],
    )
    feature_df = feature_df.fillna(0)
    return feature_df


def get_demand_features() -> list[str]:
    """Return canonical feature list for DeamandForecaster model."""
    return [
        "order_month", "order_quarter", "order_week",
        "month_sin", "month_cos",
        "ship_lag_days",
        "Discount", "discount_pressure",
        "rolling_qty_3m", "demand_volatility",
        "qty_lag1", "qty_lag2",
        "region_enc", "category_enc", "segment_enc",
        "is_weekend_order",
    ]


def get_reorder_features() -> list[str]:
    """Return canonical feature list for ReorderRecommender model."""
    return [
        "rolling_qty_3m", "rolling_sales_3m",
        "demand_volatility", "qty_lag1", "qty_lag2",
        "avg_discount", "avg_profit_margin",
        "order_count", "velocity_score",
        "ship_lag_days",
    ]

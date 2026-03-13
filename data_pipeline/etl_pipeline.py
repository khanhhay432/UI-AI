"""
ETL Pipeline — AI Inventory Optimization Platform
Reads CSV → Cleans → Engineers Features → Outputs DataFrames ready for ML.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / "data"
DEFAULT_CSV = DATA_DIR / "superstore_sample.csv"


# ─── 1. EXTRACT ───────────────────────────────────────────────────────────────

def extract(csv_path: str | Path = DEFAULT_CSV) -> pd.DataFrame:
    """Load raw CSV into DataFrame."""
    logger.info(f"Extracting data from {csv_path}")
    df = pd.read_csv(csv_path, encoding="utf-8", parse_dates=["Order Date", "Ship Date"])
    logger.info(f"Extracted {len(df)} rows × {len(df.columns)} columns")
    return df


# ─── 2. CLEAN ─────────────────────────────────────────────────────────────────

def clean(df: pd.DataFrame) -> pd.DataFrame:
    """Data cleaning: dedup, imputation, type coercion, outlier capping."""
    logger.info("Cleaning data...")

    # De-duplicate
    before = len(df)
    df = df.drop_duplicates(subset=["Order ID", "Product ID"])
    logger.info(f"Removed {before - len(df)} duplicate rows")

    # Strip whitespace from string columns
    str_cols = df.select_dtypes(include="object").columns
    df[str_cols] = df[str_cols].apply(lambda c: c.str.strip())

    # Ensure numeric types
    for col in ["Sales", "Quantity", "Discount", "Profit"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Fill numeric NAs with median
    for col in ["Sales", "Quantity", "Discount", "Profit"]:
        median_val = df[col].median()
        missing = df[col].isna().sum()
        if missing:
            df[col] = df[col].fillna(median_val)
            logger.info(f"Imputed {missing} nulls in '{col}' with median={median_val:.4f}")

    # Fill categorical NAs
    df["Ship Mode"] = df["Ship Mode"].fillna("Standard Class")
    df["Segment"] = df["Segment"].fillna("Consumer")
    df["Region"] = df["Region"].fillna("Unknown")

    # Outlier capping via IQR (Sales & Profit)
    for col in ["Sales", "Profit"]:
        Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        IQR = Q3 - Q1
        lo, hi = Q1 - 3 * IQR, Q3 + 3 * IQR
        before_clip = df[col].copy()
        df[col] = df[col].clip(lo, hi)
        clipped = ((before_clip < lo) | (before_clip > hi)).sum()
        if clipped:
            logger.info(f"Capped {clipped} outliers in '{col}'")

    # Validate date logic
    mask = df["Ship Date"] < df["Order Date"]
    if mask.any():
        logger.warning(f"Found {mask.sum()} rows where Ship Date < Order Date — fixing")
        df.loc[mask, "Ship Date"] = df.loc[mask, "Order Date"] + pd.Timedelta(days=2)

    logger.info(f"Clean complete: {len(df)} rows remaining")
    return df.reset_index(drop=True)


# ─── 3. TRANSFORM ─────────────────────────────────────────────────────────────

def transform(df: pd.DataFrame) -> pd.DataFrame:
    """Feature engineering transformation layer."""
    logger.info("Transforming data (feature engineering)...")

    # --- Date features ---
    df["order_year"]       = df["Order Date"].dt.year
    df["order_month"]      = df["Order Date"].dt.month
    df["order_week"]       = df["Order Date"].dt.isocalendar().week.astype(int)
    df["order_quarter"]    = df["Order Date"].dt.quarter
    df["order_dayofweek"]  = df["Order Date"].dt.dayofweek
    df["ship_lag_days"]    = (df["Ship Date"] - df["Order Date"]).dt.days

    # --- Profit metrics ---
    df["profit_margin"]    = np.where(df["Sales"] != 0, df["Profit"] / df["Sales"], 0.0)
    df["revenue_per_unit"] = np.where(df["Quantity"] != 0, df["Sales"] / df["Quantity"], 0.0)
    df["profit_per_unit"]  = np.where(df["Quantity"] != 0, df["Profit"] / df["Quantity"], 0.0)
    df["discount_pressure"] = df["Discount"] * df["Sales"]   # absolute discount hit

    # --- Flag columns ---
    df["is_profitable"]    = (df["Profit"] > 0).astype(int)
    df["is_discounted"]    = (df["Discount"] > 0).astype(int)
    df["is_weekend_order"] = (df["order_dayofweek"] >= 5).astype(int)

    # --- Categorical encoding (label) ---
    for col in ["Ship Mode", "Segment", "Region", "Category", "Sub-Category"]:
        df[f"{col.lower().replace(' ','_').replace('-','_')}_enc"] = (
            df[col].astype("category").cat.codes
        )

    logger.info("Transformation complete")
    return df


# ─── 4. AGGREGATE: Rolling & Trend Features ───────────────────────────────────

def build_product_timeseries(df: pd.DataFrame) -> pd.DataFrame:
    """Build monthly product-level time-series with rolling stats."""
    logger.info("Building product time-series aggregations...")

    ts = (
        df.groupby(["Product ID", "order_year", "order_month"])
        .agg(
            total_qty=("Quantity", "sum"),
            total_sales=("Sales", "sum"),
            total_profit=("Profit", "sum"),
            avg_discount=("Discount", "mean"),
            order_count=("Order ID", "nunique"),
            avg_profit_margin=("profit_margin", "mean"),
        )
        .reset_index()
        .sort_values(["Product ID", "order_year", "order_month"])
    )

    # Period key for sorting
    ts["period"] = ts["order_year"] * 100 + ts["order_month"]

    # Rolling 3-month moving average per product
    ts["rolling_qty_3m"]    = ts.groupby("Product ID")["total_qty"].transform(
        lambda x: x.rolling(3, min_periods=1).mean()
    )
    ts["rolling_sales_3m"]  = ts.groupby("Product ID")["total_sales"].transform(
        lambda x: x.rolling(3, min_periods=1).mean()
    )

    # Demand volatility (std)
    ts["demand_volatility"]  = ts.groupby("Product ID")["total_qty"].transform(
        lambda x: x.rolling(3, min_periods=1).std().fillna(0)
    )

    # Lag features (t-1, t-2)
    ts["qty_lag1"] = ts.groupby("Product ID")["total_qty"].shift(1).fillna(0)
    ts["qty_lag2"] = ts.groupby("Product ID")["total_qty"].shift(2).fillna(0)

    logger.info(f"Time-series table: {len(ts)} rows")
    return ts


def build_regional_aggregation(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate demand by Region, State, Category."""
    logger.info("Building regional aggregations...")
    regional = (
        df.groupby(["Region", "State", "Category"])
        .agg(
            total_sales=("Sales", "sum"),
            total_qty=("Quantity", "sum"),
            total_profit=("Profit", "sum"),
            avg_margin=("profit_margin", "mean"),
            order_count=("Order ID", "nunique"),
        )
        .reset_index()
    )
    regional["market_share_pct"] = (
        regional["total_sales"] / regional["total_sales"].sum() * 100
    ).round(2)
    return regional


def build_product_performance(df: pd.DataFrame) -> pd.DataFrame:
    """Per-product performance summary used by AI models."""
    logger.info("Building product performance metrics...")
    perf = (
        df.groupby(["Product ID", "Product Name", "Category", "Sub-Category"])
        .agg(
            total_sales=("Sales", "sum"),
            total_qty=("Quantity", "sum"),
            total_profit=("Profit", "sum"),
            avg_margin=("profit_margin", "mean"),
            avg_discount=("Discount", "mean"),
            order_count=("Order ID", "nunique"),
            unique_customers=("Customer ID", "nunique"),
            unique_regions=("Region", "nunique"),
        )
        .reset_index()
    )
    perf["sales_per_order"]  = perf["total_sales"] / perf["order_count"].clip(lower=1)
    perf["qty_per_order"]    = perf["total_qty"]   / perf["order_count"].clip(lower=1)
    perf["velocity_score"]   = (
        (perf["total_qty"] / perf["total_qty"].max()) * 0.5
        + (perf["order_count"] / perf["order_count"].max()) * 0.5
    ).round(4)
    return perf


# ─── 5. RUN FULL PIPELINE ─────────────────────────────────────────────────────

def run_pipeline(csv_path: str | Path = DEFAULT_CSV) -> dict[str, pd.DataFrame]:
    """Execute full ETL + feature engineering pipeline.

    Returns dict of DataFrames keyed by name.
    """
    start = datetime.now()
    logger.info("=== Starting ETL Pipeline ===")

    raw     = extract(csv_path)
    cleaned = clean(raw)
    enriched = transform(cleaned)

    outputs = {
        "enriched":          enriched,
        "product_timeseries": build_product_timeseries(enriched),
        "regional":          build_regional_aggregation(enriched),
        "product_perf":      build_product_performance(enriched),
    }

    elapsed = (datetime.now() - start).total_seconds()
    logger.info(f"=== Pipeline complete in {elapsed:.2f}s ===")
    for name, df in outputs.items():
        logger.info(f"  {name}: {df.shape}")

    return outputs


if __name__ == "__main__":
    results = run_pipeline()
    for name, df in results.items():
        print(f"\n{'='*60}")
        print(f"  {name.upper()} — {df.shape}")
        print(df.head(3).to_string())

"""
Data Cleaner Utilities — standalone helper functions.
"""

import pandas as pd
import numpy as np
from typing import Optional


def remove_duplicates(df: pd.DataFrame, subset: list[str]) -> pd.DataFrame:
    return df.drop_duplicates(subset=subset).reset_index(drop=True)


def cap_outliers_iqr(df: pd.DataFrame, columns: list[str], factor: float = 3.0) -> pd.DataFrame:
    df = df.copy()
    for col in columns:
        Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        IQR = Q3 - Q1
        df[col] = df[col].clip(Q1 - factor * IQR, Q3 + factor * IQR)
    return df


def impute_median(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    df = df.copy()
    for col in columns:
        df[col] = df[col].fillna(df[col].median())
    return df


def encode_categoricals(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    df = df.copy()
    for col in columns:
        df[f"{col}_enc"] = df[col].astype("category").cat.codes
    return df


def validate_date_logic(
    df: pd.DataFrame,
    start_col: str = "Order Date",
    end_col: str   = "Ship Date",
    fallback_days: int = 2,
) -> pd.DataFrame:
    df = df.copy()
    mask = df[end_col] < df[start_col]
    if mask.any():
        df.loc[mask, end_col] = df.loc[mask, start_col] + pd.Timedelta(days=fallback_days)
    return df


def compute_profit_metrics(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["profit_margin"]    = np.where(df["Sales"] != 0, df["Profit"] / df["Sales"], 0.0)
    df["revenue_per_unit"] = np.where(df["Quantity"] != 0, df["Sales"] / df["Quantity"], 0.0)
    df["profit_per_unit"]  = np.where(df["Quantity"] != 0, df["Profit"] / df["Quantity"], 0.0)
    return df

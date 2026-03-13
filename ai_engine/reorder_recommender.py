"""
Reorder Recommender — XGBoost model predicting optimal reorder quantity
with urgency classification overlay.
"""

import numpy as np
import pandas as pd
import pickle
from pathlib import Path
from typing import Optional
import xgboost as xgb
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import logging

logger = logging.getLogger(__name__)
MODEL_DIR = Path(__file__).parent.parent / "mlops" / "models" / "reorder_recommender"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS = [
    "rolling_qty_3m", "rolling_sales_3m",
    "demand_volatility", "qty_lag1", "qty_lag2",
    "avg_discount", "avg_profit_margin",
    "order_count", "velocity_score",
]

# Safety stock multiplier by segment
SAFETY_STOCK = {"HIGH": 2.0, "MEDIUM": 1.5, "LOW": 1.2}


class ReorderRecommender:
    """
    Predicts optimal reorder quantity.
    Combines XGBoost regression output with business rule overlay
    to produce urgency classification (HIGH / MEDIUM / LOW).
    """

    def __init__(self, model_params: Optional[dict] = None):
        self.params = model_params or {
            "n_estimators": 150,
            "max_depth": 5,
            "learning_rate": 0.08,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "reg_alpha": 0.05,
            "random_state": 42,
        }
        self.model: Optional[xgb.XGBRegressor] = None
        self.feature_cols = FEATURE_COLS
        self.metrics: dict = {}

    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        for col in self.feature_cols:
            if col not in df.columns:
                df[col] = 0.0
        return df[self.feature_cols]

    def train(self, df: pd.DataFrame, test_size: float = 0.2) -> dict:
        """Train on product performance metrics."""
        logger.info("Training ReorderRecommender...")

        # Target: rolling 3-month avg qty (what we'd want to reorder to cover)
        if "rolling_qty_3m" not in df.columns:
            raise ValueError("rolling_qty_3m column required for training.")

        X = self._prepare_features(df)
        y = df["rolling_qty_3m"].fillna(df.get("total_qty", 1))

        split_idx = int(len(df) * (1 - test_size))
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

        self.model = xgb.XGBRegressor(**self.params)
        self.model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

        preds = self.model.predict(X_test)
        self.metrics = {
            "rmse": float(np.sqrt(mean_squared_error(y_test, preds))),
            "mae":  float(mean_absolute_error(y_test, preds)),
            "r2":   float(r2_score(y_test, preds)),
        }
        logger.info(f"ReorderRecommender metrics: {self.metrics}")
        return self.metrics

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Predict reorder quantities and derive urgency classification.
        Returns DataFrame with: product_id, recommended_qty, urgency, confidence.
        """
        if self.model is None:
            self.load()

        X = self._prepare_features(df)
        raw_qty = self.model.predict(X)

        # Build result frame
        result = df[["Product ID", "Product Name"]].copy() if "Product Name" in df.columns \
            else df[["Product ID"]].copy()

        result["base_predicted_qty"] = np.maximum(raw_qty, 1).round(0).astype(int)

        # Urgency classification based on demand volatility & margin
        volatility = df.get("demand_volatility", pd.Series(np.zeros(len(df)))).fillna(0).values
        margin     = df.get("avg_profit_margin", pd.Series(np.ones(len(df)) * 0.2)).fillna(0.2).values

        urgency = []
        for v, m, qty in zip(volatility, margin, raw_qty):
            if v > 3 or qty > 15 or m < 0:
                urgency.append("HIGH")
            elif v > 1.5 or qty > 8:
                urgency.append("MEDIUM")
            else:
                urgency.append("LOW")

        result["urgency"] = urgency
        result["recommended_qty"] = [
            int(q * SAFETY_STOCK[u]) for q, u in zip(result["base_predicted_qty"], urgency)
        ]
        result["confidence"] = np.clip(
            1.0 - (volatility / (volatility.max() + 1e-9)), 0.5, 0.99
        ).round(3)

        return result.reset_index(drop=True)

    def save(self, version: str = "latest") -> Path:
        path = MODEL_DIR / f"model_{version}.pkl"
        with open(path, "wb") as f:
            pickle.dump({"model": self.model, "metrics": self.metrics}, f)
        logger.info(f"ReorderRecommender saved → {path}")
        return path

    def load(self, version: str = "latest") -> None:
        path = MODEL_DIR / f"model_{version}.pkl"
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.model   = data["model"]
        self.metrics = data["metrics"]
        logger.info(f"ReorderRecommender loaded from {path}")

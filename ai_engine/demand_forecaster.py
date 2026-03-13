"""
Demand Forecaster — XGBoost model predicting future product demand (Quantity).
"""

import numpy as np
import pandas as pd
import pickle
from pathlib import Path
from typing import Optional
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import logging

logger = logging.getLogger(__name__)
MODEL_DIR = Path(__file__).parent.parent / "mlops" / "models" / "demand_forecaster"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


FEATURE_COLS = [
    "order_month", "order_quarter", "order_week",
    "month_sin", "month_cos",
    "ship_lag_days",
    "Discount", "discount_pressure",
    "rolling_qty_3m", "demand_volatility",
    "qty_lag1", "qty_lag2",
    "region_enc", "category_enc", "is_weekend_order",
]

TARGET_COL = "Quantity"


class DemandForecaster:
    """XGBoost-based demand forecasting model."""

    def __init__(self, model_params: Optional[dict] = None):
        self.params = model_params or {
            "n_estimators": 200,
            "max_depth": 6,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "reg_alpha": 0.1,
            "reg_lambda": 1.0,
            "random_state": 42,
            "n_jobs": -1,
        }
        self.model: Optional[xgb.XGBRegressor] = None
        self.feature_cols = FEATURE_COLS
        self.metrics: dict = {}
        self._label_encoders: dict = {}

    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Ensure all feature columns exist; encode missing categoricals."""
        df = df.copy()

        # Cyclical month encoding
        if "order_month" in df.columns and "month_sin" not in df.columns:
            df["month_sin"] = np.sin(2 * np.pi * df["order_month"] / 12)
            df["month_cos"] = np.cos(2 * np.pi * df["order_month"] / 12)

        # Discount pressure
        if "discount_pressure" not in df.columns and "Discount" in df.columns:
            df["discount_pressure"] = df["Discount"] * df.get("Sales", 1)

        # Fill missing feature cols with 0
        for col in self.feature_cols:
            if col not in df.columns:
                df[col] = 0

        return df[self.feature_cols]

    def train(self, df: pd.DataFrame, test_size: float = 0.2) -> dict:
        """Train demand forecasting model. Returns evaluation metrics."""
        logger.info("Training DemandForecaster...")

        X = self._prepare_features(df)
        y = df[TARGET_COL]

        # Time-based split (important for time-series)
        split_idx = int(len(df) * (1 - test_size))
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

        self.model = xgb.XGBRegressor(**self.params)
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False,
        )

        preds = self.model.predict(X_test)
        self.metrics = {
            "rmse": float(np.sqrt(mean_squared_error(y_test, preds))),
            "mae":  float(mean_absolute_error(y_test, preds)),
            "r2":   float(r2_score(y_test, preds)),
            "n_train": int(len(X_train)),
            "n_test":  int(len(X_test)),
        }
        logger.info(f"DemandForecaster metrics: {self.metrics}")
        return self.metrics

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Predict demand quantity for new data."""
        if self.model is None:
            self.load()
        X = self._prepare_features(df)
        return self.model.predict(X)

    def feature_importance(self) -> pd.DataFrame:
        if self.model is None:
            raise RuntimeError("Model not trained yet.")
        scores = self.model.feature_importances_
        return (
            pd.DataFrame({"feature": self.feature_cols, "importance": scores})
            .sort_values("importance", ascending=False)
            .reset_index(drop=True)
        )

    def save(self, version: str = "latest") -> Path:
        path = MODEL_DIR / f"model_{version}.pkl"
        with open(path, "wb") as f:
            pickle.dump({"model": self.model, "metrics": self.metrics,
                         "features": self.feature_cols}, f)
        logger.info(f"DemandForecaster saved → {path}")
        return path

    def load(self, version: str = "latest") -> None:
        path = MODEL_DIR / f"model_{version}.pkl"
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.model    = data["model"]
        self.metrics  = data["metrics"]
        self.feature_cols = data["features"]
        logger.info(f"DemandForecaster loaded from {path}")

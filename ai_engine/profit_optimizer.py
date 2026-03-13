"""
Profit Optimizer — detects unprofitable, over-discounted, and slow-moving products.
Uses Isolation Forest + business rule thresholds.
"""

import numpy as np
import pandas as pd
import pickle
from pathlib import Path
from typing import Optional
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)
MODEL_DIR = Path(__file__).parent.parent / "mlops" / "models" / "profit_optimizer"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Business rule thresholds
UNPROFITABLE_MARGIN_THRESHOLD = 0.0     # avg margin < 0
OVER_DISCOUNT_THRESHOLD       = 0.20    # avg discount > 20%
LOW_MARGIN_WITH_DISCOUNT      = 0.05    # margin < 5% when discounted
SLOW_MOVER_ORDERS_THRESHOLD   = 3       # fewer than 3 orders = slow mover


class ProfitOptimizer:
    """
    Identifies three classes of inventory risk:
      1. UNPROFITABLE   — negative avg profit margin
      2. OVER_DISCOUNTED — high discount + low margin
      3. SLOW_MOVER     — very low order frequency
      + anomaly detection via Isolation Forest
    """

    FEATURE_COLS = [
        "avg_margin", "avg_discount", "total_profit",
        "order_count", "velocity_score", "total_qty",
    ]

    def __init__(self, contamination: float = 0.1):
        self.contamination = contamination
        self.scaler   = StandardScaler()
        self.iso_forest: Optional[IsolationForest] = None
        self.metrics: dict = {}

    def _safe_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # Map column names that may differ between pipelines
        rename_map = {
            "avg_profit_margin": "avg_margin",
            "avg_profit_margin": "avg_margin",
        }
        df = df.rename(columns=rename_map)
        for col in self.FEATURE_COLS:
            if col not in df.columns:
                df[col] = 0.0
        return df[self.FEATURE_COLS].fillna(0)

    def fit(self, df: pd.DataFrame) -> "ProfitOptimizer":
        """Fit Isolation Forest on product performance metrics."""
        logger.info("Fitting ProfitOptimizer (Isolation Forest)...")
        X_raw = self._safe_features(df)
        X_scaled = self.scaler.fit_transform(X_raw)
        self.iso_forest = IsolationForest(
            contamination=self.contamination,
            n_estimators=200,
            random_state=42,
        )
        self.iso_forest.fit(X_scaled)
        n_anomalies = (self.iso_forest.predict(X_scaled) == -1).sum()
        self.metrics["n_anomalies_train"] = int(n_anomalies)
        logger.info(f"Isolation Forest found {n_anomalies} anomalies in training set")
        return self

    def analyze(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Analyze products and return risk flags.
        Output columns: Product ID, Product Name, risk_flags, risk_score, recommendation.
        """
        if self.iso_forest is None:
            logger.warning("Isolation Forest not fitted — fitting now on provided data.")
            self.fit(df)

        result = df.copy()

        # Normalize column names
        col_map = {"avg_profit_margin": "avg_margin"}
        result = result.rename(columns=col_map)

        # Ensure columns exist
        if "avg_margin"   not in result.columns: result["avg_margin"]   = 0.0
        if "avg_discount" not in result.columns: result["avg_discount"] = 0.0
        if "order_count"  not in result.columns: result["order_count"]  = 0
        if "velocity_score" not in result.columns: result["velocity_score"] = 0.0

        flags = []

        for _, row in result.iterrows():
            product_flags = []

            # Rule 1: Unprofitable
            if row.get("avg_margin", 0) < UNPROFITABLE_MARGIN_THRESHOLD:
                product_flags.append("UNPROFITABLE")

            # Rule 2: Over-discounted
            if (row.get("avg_discount", 0) > OVER_DISCOUNT_THRESHOLD and
                    row.get("avg_margin", 1) < LOW_MARGIN_WITH_DISCOUNT):
                product_flags.append("OVER_DISCOUNTED")

            # Rule 3: Slow mover
            if row.get("order_count", 99) < SLOW_MOVER_ORDERS_THRESHOLD:
                product_flags.append("SLOW_MOVER")

            flags.append(product_flags)

        result["risk_flags"]  = [", ".join(f) if f else "OK" for f in flags]
        result["n_flags"]     = [len(f) for f in flags]

        # Isolation Forest anomaly score
        X_scaled = self.scaler.transform(self._safe_features(df))
        result["anomaly_score"]  = -self.iso_forest.score_samples(X_scaled)  # higher = more anomalous
        result["is_anomaly"]     = (self.iso_forest.predict(X_scaled) == -1)

        # Risk score: blend rule flags + anomaly score (0–100)
        max_anom = result["anomaly_score"].max() or 1.0
        result["risk_score"] = (
            (result["n_flags"] / 3 * 0.6 + result["anomaly_score"] / max_anom * 0.4) * 100
        ).round(1)

        # Recommendation text
        recs = []
        for _, row in result.iterrows():
            flags_list = row["risk_flags"].split(", ")
            if "UNPROFITABLE" in flags_list:
                recs.append("Review pricing strategy or discontinue product")
            elif "OVER_DISCOUNTED" in flags_list:
                recs.append("Reduce discount — product margin eroded")
            elif "SLOW_MOVER" in flags_list:
                recs.append("Promote via marketing or clearance discount")
            else:
                recs.append("Monitor — within acceptable range")
        result["recommendation"] = recs

        return result.sort_values("risk_score", ascending=False).reset_index(drop=True)

    def summary(self, df: pd.DataFrame) -> dict:
        """Return high-level risk summary for dashboard KPIs."""
        analyzed = self.analyze(df)
        return {
            "total_products":     len(analyzed),
            "unprofitable":       int((analyzed["risk_flags"].str.contains("UNPROFITABLE")).sum()),
            "over_discounted":    int((analyzed["risk_flags"].str.contains("OVER_DISCOUNTED")).sum()),
            "slow_movers":        int((analyzed["risk_flags"].str.contains("SLOW_MOVER")).sum()),
            "anomalies":          int(analyzed["is_anomaly"].sum()),
            "avg_risk_score":     float(analyzed["risk_score"].mean()),
            "critical_products":  analyzed[analyzed["risk_score"] > 60][["Product ID", "risk_flags", "risk_score"]].to_dict("records"),
        }

    def save(self, version: str = "latest") -> Path:
        path = MODEL_DIR / f"model_{version}.pkl"
        with open(path, "wb") as f:
            pickle.dump({"iso_forest": self.iso_forest, "scaler": self.scaler,
                         "metrics": self.metrics}, f)
        logger.info(f"ProfitOptimizer saved → {path}")
        return path

    def load(self, version: str = "latest") -> None:
        path = MODEL_DIR / f"model_{version}.pkl"
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.iso_forest = data["iso_forest"]
        self.scaler     = data["scaler"]
        self.metrics    = data["metrics"]
        logger.info(f"ProfitOptimizer loaded from {path}")

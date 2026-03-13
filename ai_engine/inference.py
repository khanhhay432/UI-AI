"""
Inference Engine — loads trained models and serves predictions.
Used by FastAPI endpoints as a singleton service.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import pandas as pd
from datetime import datetime
import logging

from ai_engine.demand_forecaster import DemandForecaster
from ai_engine.reorder_recommender import ReorderRecommender
from ai_engine.profit_optimizer import ProfitOptimizer

logger = logging.getLogger(__name__)


class InferenceEngine:
    """Singleton inference engine wrapping all 3 trained models."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.forecaster   = DemandForecaster()
        self.recommender  = ReorderRecommender()
        self.optimizer    = ProfitOptimizer()
        self._models_loaded = False
        self._initialized = True

    def load_models(self) -> None:
        """Load all trained model artifacts from disk."""
        try:
            self.forecaster.load("latest")
            self.recommender.load("latest")
            self.optimizer.load("latest")
            self._models_loaded = True
            logger.info("✅ All models loaded successfully")
        except FileNotFoundError:
            logger.warning("⚠️ Trained models not found — run model_trainer.py first")
            self._models_loaded = False

    def predict_demand(self, product_data: dict | pd.DataFrame) -> dict:
        """
        Predict demand for one or more products.
        Input: dict with feature values OR DataFrame.
        Returns: list of {product_id, predicted_qty, confidence_interval}.
        """
        if isinstance(product_data, dict):
            df = pd.DataFrame([product_data])
        else:
            df = product_data.copy()

        if not self._models_loaded:
            # Graceful fallback using statistical heuristic
            return self._heuristic_demand(df)

        preds = self.forecaster.predict(df)
        results = []
        for i, row in df.iterrows():
            qty = max(float(preds[i]), 0)
            results.append({
                "product_id":   row.get("Product ID", f"prod_{i}"),
                "predicted_qty": round(qty, 2),
                "lower_bound":  round(qty * 0.8, 2),
                "upper_bound":  round(qty * 1.2, 2),
                "period":       row.get("period", "N/A"),
                "model":        "XGBoost DemandForecaster v1",
                "timestamp":    datetime.now().isoformat(),
            })
        return results

    def recommend_reorder(self, product_data: dict | pd.DataFrame) -> list[dict]:
        """Generate reorder recommendations."""
        if isinstance(product_data, dict):
            df = pd.DataFrame([product_data])
        else:
            df = product_data.copy()

        if not self._models_loaded:
            return self._heuristic_reorder(df)

        recs = self.recommender.predict(df)
        return recs.to_dict("records")

    def analyze_profit(self, product_perf: pd.DataFrame) -> dict:
        """Run profit/risk analysis."""
        if not self._models_loaded:
            # Fit on-the-fly
            self.optimizer.fit(product_perf)

        return self.optimizer.summary(product_perf)

    # ── Heuristic fallbacks (no trained model needed) ─────────────────
    def _heuristic_demand(self, df: pd.DataFrame) -> list[dict]:
        results = []
        for i, row in df.iterrows():
            base = float(row.get("rolling_qty_3m", row.get("Quantity", 5)))
            results.append({
                "product_id":    row.get("Product ID", f"prod_{i}"),
                "predicted_qty": round(base * 1.05, 2),
                "lower_bound":   round(base * 0.85, 2),
                "upper_bound":   round(base * 1.25, 2),
                "model":         "Heuristic (rolling avg)",
                "timestamp":     datetime.now().isoformat(),
            })
        return results

    def _heuristic_reorder(self, df: pd.DataFrame) -> list[dict]:
        results = []
        for _, row in df.iterrows():
            qty = float(row.get("rolling_qty_3m", row.get("total_qty", 5))) * 1.5
            margin = float(row.get("avg_margin", row.get("avg_profit_margin", 0.2)))
            urgency = "HIGH" if margin < 0 else ("MEDIUM" if qty > 10 else "LOW")
            results.append({
                "product_id":       row.get("Product ID", "unknown"),
                "recommended_qty":  int(max(qty, 1)),
                "urgency":          urgency,
                "confidence":       0.75,
                "model":            "Heuristic fallback",
            })
        return results


# Module-level singleton
engine = InferenceEngine()

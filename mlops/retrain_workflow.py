"""
Retrain Workflow — loads new data, retrains all models, evaluates, promotes if improved.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import json
import logging
from datetime import datetime
from ai_engine.model_trainer import train_all
from mlops.model_registry import register_model, get_promoted_version, promote_version

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

IMPROVEMENT_THRESHOLD = 0.05   # RMSE must improve by 5% to auto-promote


def retrain_and_evaluate(csv_path: str | None = None) -> dict:
    """
    1. Train all models on latest data
    2. Compare metrics with currently promoted version
    3. Auto-promote if improved beyond threshold
    """
    logger.info("=== Retrain Workflow Started ===")
    report = train_all(csv_path)

    model_paths = {
        "demand_forecaster":  Path("mlops/models/demand_forecaster/model_latest.pkl"),
        "reorder_recommender": Path("mlops/models/reorder_recommender/model_latest.pkl"),
        "profit_optimizer":   Path("mlops/models/profit_optimizer/model_latest.pkl"),
    }

    results = {}
    for model_name, model_path in model_paths.items():
        if not model_path.exists():
            logger.warning(f"{model_name} model file not found at {model_path}")
            continue

        new_metrics = report.get(model_name, {})
        current     = get_promoted_version(model_name)

        should_promote = True
        if current and "rmse" in new_metrics and "rmse" in current.get("metrics", {}):
            old_rmse = current["metrics"]["rmse"]
            new_rmse = new_metrics.get("rmse", float("inf"))
            improvement = (old_rmse - new_rmse) / max(old_rmse, 1e-9)
            should_promote = improvement >= IMPROVEMENT_THRESHOLD
            logger.info(f"{model_name}: RMSE {old_rmse:.4f} → {new_rmse:.4f} (Δ{improvement*100:.1f}%) promote={should_promote}")

        version = register_model(
            model_name=model_name,
            model_path=model_path,
            metrics=new_metrics,
            promoted=should_promote,
        )
        results[model_name] = {"version": version, "promoted": should_promote, "metrics": new_metrics}

    logger.info("=== Retrain Workflow Complete ===")
    return results


if __name__ == "__main__":
    result = retrain_and_evaluate()
    print(json.dumps(result, indent=2))

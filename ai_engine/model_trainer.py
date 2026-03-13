"""
Model Trainer — unified harness to train all AI models and save artifacts.
"""

import sys
from pathlib import Path

# Allow running from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

import logging
import json
from datetime import datetime

import pandas as pd
import numpy as np

from data_pipeline.etl_pipeline import run_pipeline
from ai_engine.demand_forecaster import DemandForecaster
from ai_engine.reorder_recommender import ReorderRecommender
from ai_engine.profit_optimizer import ProfitOptimizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

RESULTS_DIR = Path(__file__).parent.parent / "mlops" / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def _add_missing_features(df: pd.DataFrame, ts: pd.DataFrame) -> pd.DataFrame:
    """Merge time-series features back onto enriched df."""
    # Create period key on enriched df if missing
    if "period" not in df.columns:
        df = df.copy()
        df["period"] = df["order_year"] * 100 + df["order_month"]

    ts_cols = ["Product ID", "period", "rolling_qty_3m", "rolling_sales_3m",
               "demand_volatility", "qty_lag1", "qty_lag2"]
    ts_sub = ts[[c for c in ts_cols if c in ts.columns]]

    merged = df.merge(ts_sub, on=["Product ID", "period"], how="left")
    for col in ["rolling_qty_3m", "rolling_sales_3m", "demand_volatility",
                "qty_lag1", "qty_lag2"]:
        if col in merged.columns:
            merged[col] = merged[col].fillna(0)
        else:
            merged[col] = 0
    return merged


def train_all(csv_path: str | None = None) -> dict:
    """
    End-to-end training pipeline.
    Returns dict of {model_name: metrics}.
    """
    start = datetime.now()
    logger.info("╔══════════════════════════════════╗")
    logger.info("║   AI Engine — Training All Models ║")
    logger.info("╚══════════════════════════════════╝")

    # ── 1. Run ETL pipeline ──────────────────────────────────────────
    pipeline_kwargs = {}
    if csv_path:
        pipeline_kwargs["csv_path"] = csv_path
    data = run_pipeline(**pipeline_kwargs)

    enriched = data["enriched"]
    ts       = data["product_timeseries"]
    perf     = data["product_perf"]

    logger.info(f"Enriched rows: {len(enriched)}  | Products: {perf['Product ID'].nunique()}")

    # ── 2. Demand Forecaster ─────────────────────────────────────────
    logger.info("\n[1/3] Training Demand Forecaster...")
    demand_df = _add_missing_features(enriched, ts)

    # Add velocity score if missing
    if "velocity_score" not in demand_df.columns:
        demand_df["velocity_score"] = (
            demand_df["Quantity"].rank(pct=True) * 0.6
            + demand_df["order_month"].rank(pct=True) * 0.4
        )

    forecaster = DemandForecaster()
    demand_metrics = forecaster.train(demand_df)
    forecaster.save("latest")

    # ── 3. Reorder Recommender ───────────────────────────────────────
    logger.info("\n[2/3] Training Reorder Recommender...")
    # Use product performance df which has the aggregate features
    perf_enriched = perf.copy()
    if "rolling_qty_3m" not in perf_enriched.columns:
        # Approximate: use total_qty / unique months
        perf_enriched["rolling_qty_3m"] = perf_enriched["total_qty"] / 3
    if "rolling_sales_3m" not in perf_enriched.columns:
        perf_enriched["rolling_sales_3m"] = perf_enriched["total_sales"] / 3
    if "demand_volatility" not in perf_enriched.columns:
        perf_enriched["demand_volatility"] = 0.0
    if "qty_lag1" not in perf_enriched.columns:
        perf_enriched["qty_lag1"] = perf_enriched["rolling_qty_3m"]
    if "qty_lag2" not in perf_enriched.columns:
        perf_enriched["qty_lag2"] = perf_enriched["rolling_qty_3m"] * 0.9
    if "avg_profit_margin" not in perf_enriched.columns:
        perf_enriched["avg_profit_margin"] = perf_enriched.get("avg_margin", 0.0)
    if "velocity_score" not in perf_enriched.columns:
        perf_enriched["velocity_score"] = (
            perf_enriched["total_qty"].rank(pct=True) * 0.6
            + perf_enriched["order_count"].rank(pct=True) * 0.4
        )

    recommender = ReorderRecommender()
    reorder_metrics = recommender.train(perf_enriched)
    recommender.save("latest")

    # ── 4. Profit Optimizer ──────────────────────────────────────────
    logger.info("\n[3/3] Fitting Profit Optimizer...")
    optimizer = ProfitOptimizer(contamination=0.1)
    optimizer.fit(perf_enriched)
    optimizer.save("latest")
    opt_metrics = optimizer.metrics

    # ── 5. Save training report ──────────────────────────────────────
    report = {
        "trained_at":       datetime.now().isoformat(),
        "elapsed_seconds":  (datetime.now() - start).total_seconds(),
        "data_rows":        len(enriched),
        "demand_forecaster": demand_metrics,
        "reorder_recommender": reorder_metrics,
        "profit_optimizer": opt_metrics,
    }

    report_path = RESULTS_DIR / f"training_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    logger.info(f"\n✅ Training complete! Report → {report_path}")
    logger.info(f"   Demand RMSE : {demand_metrics.get('rmse', 'N/A'):.4f}")
    logger.info(f"   Reorder RMSE: {reorder_metrics.get('rmse', 'N/A'):.4f}")
    logger.info(f"   Anomalies   : {opt_metrics.get('n_anomalies_train', 'N/A')}")

    return report


if __name__ == "__main__":
    import sys
    csv_arg = sys.argv[1] if len(sys.argv) > 1 else None
    result = train_all(csv_arg)
    print("\n=== TRAINING REPORT ===")
    print(json.dumps(result, indent=2))

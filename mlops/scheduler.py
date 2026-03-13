"""
Scheduler — APScheduler-based cron for demand prediction refresh and model retraining.
"""

import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def daily_demand_refresh():
    """Run every day at 02:00 — regenerate demand forecasts."""
    logger.info(f"[{datetime.now().isoformat()}] Daily demand refresh triggered")
    try:
        from ai_engine.inference import engine
        from data_pipeline.etl_pipeline import run_pipeline
        data = run_pipeline()
        perf = data["product_perf"]
        # In production: write forecast results to DB
        recs = engine.recommend_reorder(perf)
        logger.info(f"Generated {len(recs)} reorder recommendations")
    except Exception as e:
        logger.error(f"Daily refresh failed: {e}")


def weekly_retrain():
    """Run every Sunday at 03:00 — full model retrain."""
    logger.info(f"[{datetime.now().isoformat()}] Weekly retrain triggered")
    try:
        from mlops.retrain_workflow import retrain_and_evaluate
        result = retrain_and_evaluate()
        promoted = [m for m, r in result.items() if r.get("promoted")]
        logger.info(f"Retrain complete. Promoted models: {promoted}")
    except Exception as e:
        logger.error(f"Weekly retrain failed: {e}")


def start_scheduler():
    scheduler = BackgroundScheduler()

    # Daily at 02:00
    scheduler.add_job(
        daily_demand_refresh,
        trigger=CronTrigger(hour=2, minute=0),
        id="daily_demand_refresh",
        replace_existing=True,
    )

    # Weekly Sunday 03:00
    scheduler.add_job(
        weekly_retrain,
        trigger=CronTrigger(day_of_week="sun", hour=3, minute=0),
        id="weekly_retrain",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("✅ Scheduler started: daily refresh @ 02:00 | weekly retrain @ Sunday 03:00")
    return scheduler


if __name__ == "__main__":
    import time
    sched = start_scheduler()
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        sched.shutdown()

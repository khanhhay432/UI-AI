# Backend Dockerfile — multi-stage Python 3.11

FROM python:3.11-slim AS base

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY backend/    ./backend/
COPY ai_engine/  ./ai_engine/
COPY data_pipeline/ ./data_pipeline/
COPY mlops/      ./mlops/
COPY data/       ./data/

# Create model dirs
RUN mkdir -p mlops/models/demand_forecaster \
             mlops/models/reorder_recommender \
             mlops/models/profit_optimizer \
             mlops/results

ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

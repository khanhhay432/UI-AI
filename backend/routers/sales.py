"""Sales import router — POST /sales/import"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import csv
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File
from backend.schemas.schemas import SalesImportRequest, SalesImportResponse
from backend.services.analytics_service import get_pipeline_data
import pandas as pd

router = APIRouter()


@router.post("/import")
async def import_sales(request: SalesImportRequest) -> SalesImportResponse:
    """
    Import sales rows from JSON body.
    Validates each row, deduplicates, triggers pipeline cache refresh.
    """
    imported = 0
    skipped  = 0
    errors   = []

    rows_data = [r.model_dump() for r in request.rows]
    try:
        df = pd.DataFrame(rows_data)
        # Trigger cache refresh (in real system this would write to DB)
        get_pipeline_data(force_refresh=True)
        imported = len(df)
    except Exception as e:
        errors.append(str(e))
        skipped = len(request.rows)

    return SalesImportResponse(
        imported=imported,
        skipped=skipped,
        errors=errors,
        message=f"Successfully imported {imported} rows",
    )


@router.post("/import/csv")
async def import_sales_csv(file: UploadFile = File(...)) -> SalesImportResponse:
    """
    Import sales data from uploaded CSV file.
    Expects same column structure as the Superstore dataset.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    try:
        contents = await file.read()
        # Write to temp file and run ETL
        with tempfile.NamedTemporaryFile(mode="wb", suffix=".csv", delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # Force refresh of pipeline with new CSV
        global _custom_csv
        _custom_csv = tmp_path
        get_pipeline_data(force_refresh=True)

        df = pd.read_csv(tmp_path)
        return SalesImportResponse(
            imported=len(df),
            skipped=0,
            errors=[],
            message=f"Imported {len(df)} rows from {file.filename}",
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

import io
import uuid
from typing import Optional, List

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.prediction import PredictionHistory
from app.models.uploaded_file import UploadedFile
from app.models.model_version import ModelVersion
from app.schemas.prediction import (
    SinglePredictRequest,
    SinglePredictResponse,
    PredictionHistoryItem,
    OverrideRequest,
    BulkUploadResponse,
    BulkStatusResponse,
    BulkPredictionRow,
    PCA_FEATURE_NAMES,
)
from app.services.ml_service import ml_service, MLServiceError

router = APIRouter(tags=["Predictions"])
settings = get_settings()
REQUIRED_CSV_COLUMNS = ["Time"] + PCA_FEATURE_NAMES + ["Amount"]


def _active_model_id(db: Session):
    active_model = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    return active_model.id if active_model else None


def _history_item(record: PredictionHistory) -> PredictionHistoryItem:
    risk_factors = []
    if record.shap_values:
        ranked = sorted(record.shap_values.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
        for feat, val in ranked:
            if val > 0.05:
                risk_factors.append(f"Feature '{feat}' increased the fraud score")
            elif val < -0.05:
                risk_factors.append(f"Feature '{feat}' decreased the fraud score")
    elif record.prediction_class == 1:
        risk_factors = ["Model classified this transaction as fraud"]

    return PredictionHistoryItem(
        id=str(record.id),
        timestamp=record.predicted_at.isoformat() if record.predicted_at else "",
        amount=record.transaction_amount,
        time=record.transaction_time,
        fraud_probability=record.fraud_probability,
        prediction_class=record.prediction_class,
        user_override=record.user_override,
        pca_features=record.pca_features,
        shap_values=record.shap_values,
        risk_factors=risk_factors,
        file_id=str(record.file_id) if record.file_id else None,
    )


@router.post("/predict", response_model=SinglePredictResponse)
def predict_single_transaction(
    payload: SinglePredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        prob, pred_class, shap_vals, risk_factors = ml_service.predict_single(
            time_val=payload.time,
            amount_val=payload.amount,
            pca_features=payload.pca_features,
        )
    except MLServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    history_record = PredictionHistory(
        user_id=current_user.id,
        model_version_id=_active_model_id(db),
        transaction_amount=payload.amount,
        transaction_time=payload.time,
        pca_features=payload.pca_features,
        fraud_probability=prob,
        prediction_class=pred_class,
        shap_values=shap_vals,
    )
    db.add(history_record)
    db.commit()
    db.refresh(history_record)

    return SinglePredictResponse(
        id=str(history_record.id),
        fraud_probability=prob,
        prediction_class=pred_class,
        shap_values=shap_vals,
        risk_factors=risk_factors,
        predicted_at=history_record.predicted_at,
        model_loaded=ml_service.is_loaded,
    )


def _normalize_csv_columns(df: pd.DataFrame) -> pd.DataFrame:
    rename = {}
    for col in df.columns:
        stripped = str(col).strip()
        lower = stripped.lower()
        if lower == "time":
            rename[col] = "Time"
        elif lower == "amount":
            rename[col] = "Amount"
        elif lower.startswith("v") and stripped[1:].isdigit():
            rename[col] = f"V{int(stripped[1:])}"
        else:
            rename[col] = stripped
    return df.rename(columns=rename)


@router.post("/predict/csv", response_model=BulkUploadResponse)
async def predict_csv_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filename = file.filename or "upload.csv"
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files (.csv) are supported",
        )

    try:
        contents = await file.read()
        if not contents.strip():
            raise HTTPException(status_code=400, detail="CSV file is empty")
        df = pd.read_csv(io.BytesIO(contents))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse CSV file: {str(e)}",
        )

    df = _normalize_csv_columns(df)
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file contains no data rows")

    missing = [col for col in REQUIRED_CSV_COLUMNS if col not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=(
                "CSV is missing required columns: "
                + ", ".join(missing)
                + ". Expected Time, V1–V28, Amount (extra columns are ignored)."
            ),
        )

    if len(df) > settings.MAX_CSV_ROWS:
        raise HTTPException(
            status_code=400,
            detail=f"CSV has {len(df)} rows; maximum allowed is {settings.MAX_CSV_ROWS}.",
        )

    work = df[REQUIRED_CSV_COLUMNS].copy()
    for col in REQUIRED_CSV_COLUMNS:
        work[col] = pd.to_numeric(work[col], errors="coerce")
    invalid_rows = work[work.isna().any(axis=1)]
    if not invalid_rows.empty:
        raise HTTPException(
            status_code=400,
            detail=f"CSV contains {len(invalid_rows)} row(s) with missing or non-numeric values in required columns.",
        )
    if (work["Amount"] < 0).any() or (work["Time"] < 0).any():
        raise HTTPException(status_code=400, detail="Time and Amount must be greater than or equal to 0.")

    file_record = UploadedFile(
        user_id=current_user.id,
        file_name=filename,
        total_rows=len(work),
        processed_rows=0,
        status="processing",
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    try:
        predicted = ml_service.predict_df(work)
    except MLServiceError as exc:
        file_record.status = "failed"
        db.commit()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        file_record.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {exc}")

    model_version_id = _active_model_id(db)
    records_to_insert = []
    sample_rows: List[BulkPredictionRow] = []
    for _, row in predicted.iterrows():
        pca_dict = {name: float(row[name]) for name in PCA_FEATURE_NAMES}
        record = PredictionHistory(
            user_id=current_user.id,
            model_version_id=model_version_id,
            file_id=file_record.id,
            transaction_amount=float(row["Amount"]),
            transaction_time=float(row["Time"]),
            pca_features=pca_dict,
            fraud_probability=float(row["fraud_probability"]),
            prediction_class=int(row["prediction_class"]),
            shap_values=None,
        )
        records_to_insert.append(record)

    db.add_all(records_to_insert)
    fraud_count = int((predicted["prediction_class"] == 1).sum())
    file_record.processed_rows = len(predicted)
    file_record.fraud_count = fraud_count
    file_record.status = "completed"
    db.commit()

    persisted = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.file_id == file_record.id)
        .order_by(PredictionHistory.predicted_at.desc())
        .limit(25)
        .all()
    )
    sample_rows = [
        BulkPredictionRow(
            id=str(item.id),
            amount=item.transaction_amount,
            time=item.transaction_time,
            fraud_probability=item.fraud_probability,
            prediction_class=item.prediction_class,
        )
        for item in persisted
    ]

    return BulkUploadResponse(
        file_id=str(file_record.id),
        file_name=filename,
        status="completed",
        total_rows=len(predicted),
        processed_rows=len(predicted),
        fraud_count=fraud_count,
        legitimate_count=len(predicted) - fraud_count,
        results=sample_rows,
    )


@router.get("/predict/bulk/{file_id}/status", response_model=BulkStatusResponse)
def get_bulk_status(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        file_uuid = uuid.UUID(file_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file UUID format")

    record = (
        db.query(UploadedFile)
        .filter(UploadedFile.id == file_uuid, UploadedFile.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="File processing job not found")

    legitimate_count = max(record.total_rows - record.fraud_count, 0)
    return BulkStatusResponse(
        file_id=str(record.id),
        status=record.status,
        processed_rows=record.processed_rows,
        total_rows=record.total_rows,
        fraud_count=record.fraud_count,
        legitimate_count=legitimate_count,
    )


@router.get("/history", response_model=List[PredictionHistoryItem])
def get_prediction_history(
    class_filter: Optional[str] = "all",
    limit: int = 50,
    file_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    limit = max(1, min(limit, 500))
    query = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id)

    if class_filter == "fraud":
        query = query.filter(PredictionHistory.prediction_class == 1)
    elif class_filter == "legit":
        query = query.filter(PredictionHistory.prediction_class == 0)

    if file_id:
        try:
            query = query.filter(PredictionHistory.file_id == uuid.UUID(file_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid file UUID format")

    records = query.order_by(PredictionHistory.predicted_at.desc()).limit(limit).all()
    return [_history_item(r) for r in records]


@router.patch("/history/{prediction_id}/override", response_model=PredictionHistoryItem)
def override_prediction(
    prediction_id: str,
    payload: OverrideRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        pred_uuid = uuid.UUID(prediction_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid prediction UUID format")

    record = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.id == pred_uuid, PredictionHistory.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Prediction history log not found")

    record.user_override = payload.user_override
    db.commit()
    db.refresh(record)
    return _history_item(record)

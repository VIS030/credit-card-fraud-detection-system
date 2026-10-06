import io
import uuid
import pandas as pd
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.prediction import PredictionHistory
from app.models.uploaded_file import UploadedFile
from app.models.model_version import ModelVersion
from app.schemas.prediction import (
    SinglePredictRequest, SinglePredictResponse,
    PredictionHistoryItem, OverrideRequest,
    BulkUploadResponse, BulkStatusResponse
)
from app.core.security import get_current_user
from app.services.ml_service import ml_service

router = APIRouter(tags=["Predictions"])

@router.post("/predict", response_model=SinglePredictResponse)
def predict_single_transaction(
    payload: SinglePredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Run ML prediction via service
    prob, pred_class, shap_vals, risk_factors = ml_service.predict_single(
        time_val=payload.time,
        amount_val=payload.amount,
        pca_features=payload.pca_features
    )

    # Fetch active model version ID if registered
    active_model = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    model_version_id = active_model.id if active_model else None

    # Persist in PostgreSQL database
    history_record = PredictionHistory(
        user_id=current_user.id,
        model_version_id=model_version_id,
        transaction_amount=payload.amount,
        transaction_time=payload.time,
        pca_features=payload.pca_features,
        fraud_probability=prob,
        prediction_class=pred_class,
        shap_values=shap_vals
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
        predicted_at=history_record.predicted_at
    )

@router.post("/predict/csv", response_model=BulkUploadResponse)
async def predict_csv_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files (.csv) are supported"
        )

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse CSV file: {str(e)}"
        )

    total_rows = len(df)
    
    # Create UploadedFile record
    file_record = UploadedFile(
        user_id=current_user.id,
        file_name=file.filename,
        total_rows=total_rows,
        processed_rows=0,
        status="processing"
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    active_model = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    model_version_id = active_model.id if active_model else None

    fraud_count = 0
    # Process rows & insert prediction history
    records_to_insert = []
    for idx, row in df.iterrows():
        time_val = float(row.get("Time", 0.0))
        amount_val = float(row.get("Amount", 0.0))
        pca_dict = {f"V{i}": float(row.get(f"V{i}", 0.0)) for i in range(1, 29)}

        prob, pred_class, shap_vals, _ = ml_service.predict_single(time_val, amount_val, pca_dict)
        if pred_class == 1:
            fraud_count += 1

        records_to_insert.append(PredictionHistory(
            user_id=current_user.id,
            model_version_id=model_version_id,
            file_id=file_record.id,
            transaction_amount=amount_val,
            transaction_time=time_val,
            pca_features=pca_dict,
            fraud_probability=prob,
            prediction_class=pred_class,
            shap_values=shap_vals
        ))

    db.bulk_save_objects(records_to_insert)
    
    # Update file record status
    file_record.processed_rows = total_rows
    file_record.fraud_count = fraud_count
    file_record.status = "completed"
    db.commit()

    return BulkUploadResponse(
        file_id=str(file_record.id),
        file_name=file.filename,
        status="completed",
        total_rows=total_rows
    )

@router.get("/predict/bulk/{file_id}/status", response_model=BulkStatusResponse)
def get_bulk_status(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        file_uuid = uuid.UUID(file_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file UUID format")

    record = db.query(UploadedFile).filter(UploadedFile.id == file_uuid).first()
    if not record:
        raise HTTPException(status_code=404, detail="File processing job not found")

    return BulkStatusResponse(
        file_id=str(record.id),
        status=record.status,
        processed_rows=record.processed_rows,
        total_rows=record.total_rows,
        fraud_count=record.fraud_count
    )

@router.get("/history", response_model=List[PredictionHistoryItem])
def get_prediction_history(
    class_filter: Optional[str] = "all",
    search: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id)

    if class_filter == "fraud":
        query = query.filter(PredictionHistory.prediction_class == 1)
    elif class_filter == "legit":
        query = query.filter(PredictionHistory.prediction_class == 0)

    records = query.order_by(PredictionHistory.predicted_at.desc()).limit(limit).all()

    items = []
    for r in records:
        # Determine merchant/location details dynamically or mock display for presentation
        merchant = "Electronics Store" if r.prediction_class == 1 else "Retail Merchant"
        location = "Miami, FL" if r.prediction_class == 1 else "Austin, TX"
        brand = "visa" if r.transaction_amount < 500 else "mastercard"
        
        risk_factors = []
        if r.prediction_class == 1:
            risk_factors = ["Elevated fraud score attribution", "Vector signature anomaly"]

        items.append(PredictionHistoryItem(
            id=str(r.id),
            timestamp=r.predicted_at.isoformat(),
            amount=r.transaction_amount,
            time=r.transaction_time,
            fraud_probability=r.fraud_probability,
            prediction_class=r.prediction_class,
            user_override=r.user_override,
            merchant=merchant,
            card_brand=brand,
            card_last4="4321" if r.prediction_class == 1 else "8821",
            location=location,
            shap_values=r.shap_values,
            risk_factors=risk_factors
        ))

    return items

@router.patch("/history/{prediction_id}/override", response_model=PredictionHistoryItem)
def override_prediction(
    prediction_id: str,
    payload: OverrideRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        pred_uuid = uuid.UUID(prediction_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid prediction UUID format")

    record = db.query(PredictionHistory).filter(PredictionHistory.id == pred_uuid).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction history log not found")

    record.user_override = payload.user_override
    db.commit()
    db.refresh(record)

    return PredictionHistoryItem(
        id=str(record.id),
        timestamp=record.predicted_at.isoformat(),
        amount=record.transaction_amount,
        time=record.transaction_time,
        fraud_probability=record.fraud_probability,
        prediction_class=record.prediction_class,
        user_override=record.user_override,
        merchant="Merchant Store",
        card_brand="visa",
        card_last4="4321",
        location="Digital",
        shap_values=record.shap_values,
        risk_factors=["Overridden by analyst"] if record.user_override is not None else []
    )

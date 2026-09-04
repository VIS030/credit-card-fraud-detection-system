from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime


class SinglePredictRequest(BaseModel):
    time: float
    amount: float
    pca_features: Dict[str, float]  # {"V1": -1.35, ..., "V28": 0.05}


class SinglePredictResponse(BaseModel):
    id: str
    fraud_probability: float
    prediction_class: int
    shap_values: Dict[str, float]
    risk_factors: list[str]
    predicted_at: datetime


class PredictionHistoryItem(BaseModel):
    id: str
    timestamp: str
    amount: float
    time: float
    fraud_probability: float
    prediction_class: int
    user_override: Optional[int] = None
    merchant: Optional[str] = None
    card_brand: Optional[str] = None
    card_last4: Optional[str] = None
    location: Optional[str] = None
    shap_values: Optional[Dict[str, float]] = None
    risk_factors: Optional[list[str]] = None

    class Config:
        from_attributes = True


class OverrideRequest(BaseModel):
    user_override: int  # 0 or 1


class BulkUploadResponse(BaseModel):
    file_id: str
    file_name: str
    status: str
    total_rows: int


class BulkStatusResponse(BaseModel):
    file_id: str
    status: str
    processed_rows: int
    total_rows: int
    fraud_count: int


class AnalyticsSummary(BaseModel):
    total_processed: int
    processed_volume: float
    fraud_alerts: int
    false_positives: int
    avg_risk_score: float
    accuracy_rate: float
    latency_ms: int


class ModelVersionResponse(BaseModel):
    id: str
    version: str
    algorithm: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    auc_roc: Optional[float] = None
    is_active: bool
    deployed_at: str

    class Config:
        from_attributes = True

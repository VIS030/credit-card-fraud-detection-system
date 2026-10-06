from datetime import datetime
from typing import Optional, Dict, List

from pydantic import BaseModel, Field, field_validator, model_validator

PCA_FEATURE_NAMES = [f"V{i}" for i in range(1, 29)]


class SinglePredictRequest(BaseModel):
    time: float = Field(ge=0, le=10_000_000, description="Seconds elapsed in the source dataset")
    amount: float = Field(ge=0, le=10_000_000)
    pca_features: Dict[str, float] = Field(description="PCA components V1–V28 from the trained dataset")

    @model_validator(mode="after")
    def validate_pca_features(self):
        missing = [name for name in PCA_FEATURE_NAMES if name not in self.pca_features]
        if missing:
            raise ValueError(
                f"Missing required PCA features: {', '.join(missing)}. "
                "The trained model requires V1–V28 from the original PCA-transformed dataset."
            )
        values = []
        for name in PCA_FEATURE_NAMES:
            try:
                values.append(float(self.pca_features[name]))
            except (TypeError, ValueError):
                raise ValueError(f"PCA feature {name} must be a number")
        if all(abs(v) < 1e-12 for v in values):
            raise ValueError(
                "V1–V28 cannot all be zero. Those fields are PCA-transformed components from the "
                "training dataset, not optional padding. Load a demo profile or provide real V features."
            )
        return self


class SinglePredictResponse(BaseModel):
    id: str
    fraud_probability: float
    prediction_class: int
    shap_values: Dict[str, float]
    risk_factors: list[str]
    predicted_at: datetime
    model_loaded: bool = True


class PredictionHistoryItem(BaseModel):
    id: str
    timestamp: str
    amount: float
    time: float
    fraud_probability: float
    prediction_class: int
    user_override: Optional[int] = None
    pca_features: Optional[Dict[str, float]] = None
    shap_values: Optional[Dict[str, float]] = None
    risk_factors: Optional[list[str]] = None
    file_id: Optional[str] = None

    model_config = {"from_attributes": True}


class OverrideRequest(BaseModel):
    user_override: int

    @field_validator("user_override")
    @classmethod
    def validate_override(cls, v: int) -> int:
        if v not in (0, 1):
            raise ValueError("user_override must be 0 (legitimate) or 1 (fraud)")
        return v


class BulkPredictionRow(BaseModel):
    id: str
    amount: float
    time: float
    fraud_probability: float
    prediction_class: int


class BulkUploadResponse(BaseModel):
    file_id: str
    file_name: str
    status: str
    total_rows: int
    processed_rows: int
    fraud_count: int
    legitimate_count: int
    results: List[BulkPredictionRow] = []


class BulkStatusResponse(BaseModel):
    file_id: str
    status: str
    processed_rows: int
    total_rows: int
    fraud_count: int
    legitimate_count: int = 0


class AnalyticsSummary(BaseModel):
    total_processed: int
    processed_volume: float
    fraud_alerts: int
    legitimate_count: int
    false_positives: int
    avg_risk_score: float
    override_count: int
    latency_ms: Optional[int] = None


class DailyPerformancePoint(BaseModel):
    date: str
    transactions: int
    fraudAlerts: int
    rate: float


class AmountBucket(BaseModel):
    range: str
    legitimate: int
    fraud: int


class FeatureCorrelation(BaseModel):
    feature: str
    impact: float
    description: str


class AnalyticsTrends(BaseModel):
    dailyPerformance: List[DailyPerformancePoint]
    amountDistribution: List[AmountBucket]
    topCorrelations: List[FeatureCorrelation]


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

    model_config = {"from_attributes": True}


class ServiceStatus(BaseModel):
    name: str
    status: str
    detail: str


class SystemDiagnostics(BaseModel):
    overall: str
    api: ServiceStatus
    database: ServiceStatus
    model: ServiceStatus
    authentication: ServiceStatus
    environment: ServiceStatus

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.guid import GUID
from app.database.session import Base


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    model_version_id = Column(GUID(), ForeignKey("model_versions.id"), nullable=True)
    file_id = Column(GUID(), ForeignKey("uploaded_files.id"), nullable=True)

    transaction_amount = Column(Float, nullable=False)
    transaction_time = Column(Float, nullable=False)
    pca_features = Column(JSON, nullable=True)  # {"V1": -1.35, "V2": 1.2, ...}
    fraud_probability = Column(Float, nullable=False)
    prediction_class = Column(Integer, nullable=False)  # 0 or 1
    user_override = Column(Integer, nullable=True)  # Analyst manual override: 0 or 1
    shap_values = Column(JSON, nullable=True)  # Feature attributions
    predicted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="predictions")
    model_version = relationship("ModelVersion", back_populates="predictions")
    uploaded_file = relationship("UploadedFile", back_populates="predictions")

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.session import Base


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_string = Column(String, unique=True, nullable=False)
    model_path = Column(String, nullable=False)
    algorithm = Column(String, nullable=True, default="XGBoost Classifier")
    performance_metrics = Column(JSON, nullable=True)  # {"accuracy": 0.99, "f1": 0.89, ...}
    is_active = Column(Boolean, default=False)
    deployed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    predictions = relationship("PredictionHistory", back_populates="model_version")

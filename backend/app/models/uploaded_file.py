import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.session import Base


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=True)
    total_rows = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    fraud_count = Column(Integer, default=0)
    status = Column(String, default="queued")  # queued, processing, completed, failed
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="uploaded_files")
    predictions = relationship("PredictionHistory", back_populates="uploaded_file")

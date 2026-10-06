import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_current_admin, get_current_user
from app.database.session import get_db, engine
from app.models.user import User
from app.models.model_version import ModelVersion
from app.schemas.auth import UserResponse
from app.schemas.prediction import ModelVersionResponse, SystemDiagnostics, ServiceStatus
from app.services.ml_service import ml_service

router = APIRouter(prefix="/admin", tags=["Admin & Diagnostics"])
settings = get_settings()


def _serialize_model(model: ModelVersion) -> ModelVersionResponse:
    metrics = model.performance_metrics or {}
    return ModelVersionResponse(
        id=str(model.id),
        version=model.version_string,
        algorithm=model.algorithm or "XGBoost Classifier",
        accuracy=metrics.get("accuracy"),
        precision=metrics.get("precision"),
        recall=metrics.get("recall"),
        f1_score=metrics.get("f1_score"),
        auc_roc=metrics.get("auc_roc"),
        is_active=model.is_active,
        deployed_at=model.deployed_at.isoformat() if model.deployed_at else "",
    )


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    users = db.query(User).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/models", response_model=List[ModelVersionResponse])
def list_models(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    models = db.query(ModelVersion).order_by(ModelVersion.deployed_at.desc()).all()
    return [_serialize_model(m) for m in models]


@router.post("/models/{model_id}/activate")
def activate_model_version(
    model_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    try:
        m_uuid = uuid.UUID(model_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid model UUID format")

    target = db.query(ModelVersion).filter(ModelVersion.id == m_uuid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Model version not found")

    db.query(ModelVersion).update({ModelVersion.is_active: False})
    target.is_active = True
    db.commit()

    if target.model_path and os.path.exists(target.model_path):
        ml_service.load_model(target.model_path)

    return {
        "message": f"Activated model version {target.version_string}",
        "model_loaded": ml_service.is_loaded,
    }


@router.post("/models/retrain")
def retrain_model_pipeline(admin_user: User = Depends(get_current_admin)):
    raise HTTPException(
        status_code=501,
        detail=(
            "Live retraining is not enabled in the API. Train the champion model with "
            "`python ml/train_model.py` and restart the backend so it reloads fraud_model.pkl."
        ),
    )


def build_diagnostics(db: Session) -> SystemDiagnostics:
    db_status = ServiceStatus(name="database", status="unhealthy", detail="Unable to query database")
    try:
        db.execute(text("SELECT 1"))
        dialect = engine.dialect.name
        db_status = ServiceStatus(
            name="database",
            status="healthy",
            detail=f"Connected via {dialect}",
        )
    except Exception as exc:
        db_status = ServiceStatus(name="database", status="unhealthy", detail=str(exc))

    if ml_service.is_loaded:
        model_status = ServiceStatus(
            name="model",
            status="healthy",
            detail=f"Loaded {os.path.basename(ml_service.model_path)} with {len(ml_service.feature_columns)} features",
        )
    else:
        model_status = ServiceStatus(
            name="model",
            status="unhealthy",
            detail=ml_service.load_error or "Model is not loaded",
        )

    secret_is_default = settings.SECRET_KEY in {
        "dev-only-change-in-production",
        "super-secret-key-change-in-production-f8a3b2c1d4e5",
    }
    auth_detail = "JWT authentication enabled"
    if secret_is_default:
        auth_detail += " (default SECRET_KEY; set a unique value in production)"

    auth_status = ServiceStatus(name="authentication", status="healthy", detail=auth_detail)
    api_status = ServiceStatus(name="api", status="healthy", detail=f"{settings.APP_NAME} {settings.APP_VERSION}")
    env_status = ServiceStatus(
        name="environment",
        status="healthy",
        detail=f"APP_ENV={settings.APP_ENV}",
    )

    statuses = [api_status.status, db_status.status, model_status.status, auth_status.status]
    overall = "healthy" if all(item == "healthy" for item in statuses) else "degraded"

    return SystemDiagnostics(
        overall=overall,
        api=api_status,
        database=db_status,
        model=model_status,
        authentication=auth_status,
        environment=env_status,
    )


@router.get("/diagnostics", response_model=SystemDiagnostics)
def get_diagnostics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return build_diagnostics(db)

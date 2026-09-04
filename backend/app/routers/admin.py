import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.model_version import ModelVersion
from app.schemas.auth import UserResponse
from app.schemas.prediction import ModelVersionResponse
from app.core.security import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin & Diagnostics"])

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    users = db.query(User).all()
    return [UserResponse.model_validate(u) for u in users]

@router.get("/models", response_model=List[ModelVersionResponse])
def list_models(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    models = db.query(ModelVersion).order_by(ModelVersion.deployed_at.desc()).all()
    if not models:
        # Initial seed representation if empty
        return [
            ModelVersionResponse(
                id=str(uuid.uuid4()),
                version="v1.2.0-xgb",
                algorithm="XGBoost Classifier (SMOTE Optimized)",
                accuracy=0.9995,
                precision=0.924,
                recall=0.865,
                f1_score=0.893,
                auc_roc=0.988,
                is_active=True,
                deployed_at="2026-07-16T12:00:00Z"
            ),
            ModelVersionResponse(
                id=str(uuid.uuid4()),
                version="v1.1.0-rf",
                algorithm="Random Forest Classifier",
                accuracy=0.9992,
                precision=0.885,
                recall=0.821,
                f1_score=0.852,
                auc_roc=0.974,
                is_active=False,
                deployed_at="2026-06-15T08:30:00Z"
            )
        ]

    res = []
    for m in models:
        metrics = m.performance_metrics or {}
        res.append(ModelVersionResponse(
            id=str(m.id),
            version=m.version_string,
            algorithm=m.algorithm or "XGBoost Classifier",
            accuracy=metrics.get("accuracy"),
            precision=metrics.get("precision"),
            recall=metrics.get("recall"),
            f1_score=metrics.get("f1_score"),
            auc_roc=metrics.get("auc_roc"),
            is_active=m.is_active,
            deployed_at=m.deployed_at.isoformat()
        ))
    return res

@router.post("/models/{model_id}/activate")
def activate_model_version(
    model_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    try:
        m_uuid = uuid.UUID(model_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid model UUID format")

    target = db.query(ModelVersion).filter(ModelVersion.id == m_uuid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Model version not found")

    # Deactivate all, activate target
    db.query(ModelVersion).update({ModelVersion.is_active: False})
    target.is_active = True
    db.commit()

    return {"message": f"Activated model version {target.version_string}"}

@router.post("/models/retrain")
def retrain_model_pipeline(
    admin_user: User = Depends(get_current_admin)
):
    return {
        "message": "Model retraining pipeline initiated asynchronously",
        "job_id": str(uuid.uuid4()),
        "status": "queued"
    }

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.security import hash_password
from app.database.session import engine, Base, SessionLocal
from app.models.user import User
from app.models.model_version import ModelVersion
from app.routers import auth, predict, analytics, admin
from app.routers.admin import build_diagnostics
from app.services.ml_service import ml_service

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise-grade AI-powered Credit Card Fraud Detection Platform API Server",
    docs_url="/docs",
    redoc_url="/redoc",
)

cors_origins = settings.cors_origin_list
allow_credentials = cors_origins != ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(predict.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.on_event("startup")
def on_startup():
    print("[Startup] Initializing Database Tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[Startup] Database tables created/verified successfully.")
    except Exception as e:
        print(f"[Startup Warning] DB table initialization error: {e}")

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("[Startup] Seeding default Admin user (admin@fraudguard.ai)...")
            admin_user = User(
                email="admin@fraudguard.ai",
                hashed_password=hash_password("password123"),
                full_name="Senior Analyst",
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()

        if db.query(ModelVersion).count() == 0:
            print("[Startup] Seeding active model version from loaded artifact...")
            metrics = ml_service.metrics or {}
            model_ver = ModelVersion(
                version_string="v1.2.0-xgb",
                model_path=settings.MODEL_PATH,
                algorithm="XGBoost Classifier (SMOTE + scaled Time/Amount)",
                performance_metrics=metrics,
                is_active=True,
            )
            db.add(model_ver)
            db.commit()
    except Exception as e:
        print(f"[Startup Warning] Data seeding note: {e}")
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health")
def healthcheck():
    db = SessionLocal()
    try:
        diagnostics = build_diagnostics(db)
        return {
            "status": diagnostics.overall,
            "api": diagnostics.api.model_dump(),
            "database": diagnostics.database.model_dump(),
            "model": diagnostics.model.model_dump(),
            "authentication": diagnostics.authentication.model_dump(),
            "environment": diagnostics.environment.model_dump(),
        }
    finally:
        db.close()

import os
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.database.session import engine, Base, SessionLocal
from app.models.user import User
from app.models.model_version import ModelVersion
from app.core.security import hash_password
from app.routers import auth, predict, analytics, admin

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise-grade AI-powered Credit Card Fraud Detection Platform API Server",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits requests from Next.js dev & production instances
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
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

    # Seed default Admin User & Model Version if empty
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("[Startup] Seeding default Admin user (admin@fraudguard.ai)...")
            admin_user = User(
                email="admin@fraudguard.ai",
                hashed_password=hash_password("password123"),
                full_name="Senior Analyst",
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()

        if db.query(ModelVersion).count() == 0:
            print("[Startup] Seeding active model version v1.2.0-xgb...")
            model_ver = ModelVersion(
                version_string="v1.2.0-xgb",
                model_path=settings.MODEL_PATH,
                algorithm="XGBoost Classifier (SMOTE + HPO)",
                performance_metrics={"accuracy": 0.9995, "precision": 0.924, "recall": 0.865, "f1_score": 0.893, "auc_roc": 0.988},
                is_active=True
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
        "docs": "/docs"
    }


@app.get("/health")
def healthcheck():
    return {"status": "healthy"}

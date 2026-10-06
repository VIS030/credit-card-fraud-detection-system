import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "FraudGuard AI Platform"
    APP_VERSION: str = "1.2.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fraudguard.db")

    # JWT
    SECRET_KEY: str = "super-secret-key-change-in-production-f8a3b2c1d4e5"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # ML Model
    MODEL_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "fraud_model.pkl")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

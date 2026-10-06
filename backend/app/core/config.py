import json
import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_model_path() -> str:
    app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(app_dir, "models", "fraud_model.pkl")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "FraudGuard AI Platform"
    APP_VERSION: str = "1.2.0"
    APP_ENV: str = "development"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./fraudguard.db"

    SECRET_KEY: str = "dev-only-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    MODEL_PATH: str = _default_model_path()
    MAX_CSV_ROWS: int = 5000
    FRAUD_THRESHOLD: float = 0.5

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() in {"production", "prod"}

    @property
    def cors_origin_list(self) -> list[str]:
        raw = (self.CORS_ORIGINS or "").strip()
        if not raw:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        if raw == "*":
            if self.is_production:
                return ["http://localhost:3000"]
            return ["*"]
        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                return [str(item).strip() for item in parsed if str(item).strip()]
            except json.JSONDecodeError:
                return [raw]
        return [item.strip() for item in raw.split(",") if item.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        url = (self.DATABASE_URL or "").strip()
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        return url


@lru_cache()
def get_settings() -> Settings:
    return Settings()

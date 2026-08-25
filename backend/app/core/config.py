"""
config.py — NER-SHIELD Application Settings
============================================
All configuration is read from environment variables (or a .env file).
Secrets are never printed to logs.

DEMO_MODE=true  → in-memory synthetic data, no external credentials required.
DEMO_MODE=false → requires DATABASE_URL (PostgreSQL/PostGIS) to be set.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import List, Optional, Union

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

# Resolve repository root so relative MODEL_PATH values work from any CWD.
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent  # d:\E\ner-shield


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ------------------------------------------------------------------ #
    # Application
    # ------------------------------------------------------------------ #
    PROJECT_NAME: str = "NER-SHIELD Backend API"
    PROJECT_DESCRIPTION: str = (
        "AI-Based Smart Logistics & Accessibility Intelligence Platform "
        "for the North Eastern Region (NER) of India."
    )
    APP_NAME: str = "NER-SHIELD"
    APP_ENV: str = "development"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # ------------------------------------------------------------------ #
    # Server
    # ------------------------------------------------------------------ #
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # ------------------------------------------------------------------ #
    # Demo / Feature flags
    # ------------------------------------------------------------------ #
    DEMO_MODE: bool = True
    USE_IN_MEMORY_DB: bool = True  # kept for backward compat; mirrors DEMO_MODE

    # ------------------------------------------------------------------ #
    # Database
    # ------------------------------------------------------------------ #
    DATABASE_URL: Optional[str] = None
    POSTGRES_DB: str = "nershield"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # ------------------------------------------------------------------ #
    # Weather provider
    # ------------------------------------------------------------------ #
    WEATHER_API_KEY: Optional[str] = None
    WEATHER_API_URL: Optional[str] = None

    # ------------------------------------------------------------------ #
    # External routing provider
    # ------------------------------------------------------------------ #
    ROUTING_API_URL: Optional[str] = None
    ROUTING_API_KEY: Optional[str] = None

    # ------------------------------------------------------------------ #
    # AI / ML models
    # ------------------------------------------------------------------ #
    MODEL_PATH: Optional[str] = None
    MODEL_VERSION: str = "prototype-v1"

    # ------------------------------------------------------------------ #
    # CORS — accepts a comma-separated string or a JSON list
    # ------------------------------------------------------------------ #
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # ------------------------------------------------------------------ #
    # Deployment / monitoring
    # ------------------------------------------------------------------ #
    DEPLOYMENT_ENV: str = "local"
    SENTRY_DSN: Optional[str] = None

    # ------------------------------------------------------------------ #
    # Validators
    # ------------------------------------------------------------------ #

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors(cls, v: Union[str, List[str]]) -> List[str]:
        """Accept comma-separated string OR JSON list OR plain list."""
        if isinstance(v, str):
            # Strip surrounding brackets if someone passes JSON-ish string
            stripped = v.strip()
            if stripped.startswith("["):
                import json
                return json.loads(stripped)
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return v

    @field_validator("MODEL_PATH", mode="before")
    @classmethod
    def _resolve_model_path(cls, v: Optional[str]) -> Optional[str]:
        """Convert relative model paths to absolute using repository root."""
        if not v:
            return None
        p = Path(v)
        if not p.is_absolute():
            p = _REPO_ROOT / p
        return str(p)

    @model_validator(mode="after")
    def _production_secrets_check(self) -> "Settings":
        """In production mode (DEMO_MODE=false), critical settings must be present."""
        if not self.DEMO_MODE:
            if not self.DATABASE_URL:
                # Attempt to construct from parts
                constructed = (
                    f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                    f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
                )
                object.__setattr__(self, "DATABASE_URL", constructed)
            logger.info(
                "[NER-SHIELD] Production mode: database=%s:%s/%s",
                self.POSTGRES_HOST,
                self.POSTGRES_PORT,
                self.POSTGRES_DB,
            )
        return self

    def effective_database_url(self) -> Optional[str]:
        """Return the DATABASE_URL to use, constructed from parts if not explicitly set."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if not self.DEMO_MODE:
            return (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        return None

    def log_summary(self) -> None:
        """Log a safe configuration summary (no secrets)."""
        logger.info(
            "[NER-SHIELD Config] app=%s env=%s version=%s demo_mode=%s "
            "api=%s:%s deployment=%s",
            self.APP_NAME,
            self.APP_ENV,
            self.VERSION,
            self.DEMO_MODE,
            self.API_HOST,
            self.API_PORT,
            self.DEPLOYMENT_ENV,
        )


settings = Settings()

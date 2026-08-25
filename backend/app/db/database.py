"""
database.py — SQLAlchemy engine, session factory, and initialization.

Behaviour:
  DEMO_MODE=true  → engine is None; application uses in-memory DataStore.
  DEMO_MODE=false → engine connects to PostgreSQL/PostGIS via DATABASE_URL.

Never hide connection errors in production mode.
"""

from __future__ import annotations

import logging
from typing import Generator, Optional

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from backend.app.core.config import settings
from backend.app.models.base import Base

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Engine creation
# ---------------------------------------------------------------------------

_engine = None
_SessionLocal: Optional[sessionmaker] = None


def _build_engine():
    """Build SQLAlchemy engine from settings. Only called when DEMO_MODE=false."""
    db_url = settings.effective_database_url()
    if not db_url:
        raise RuntimeError(
            "DATABASE_URL is not configured. Set DEMO_MODE=true for in-memory mode "
            "or configure DATABASE_URL / POSTGRES_* environment variables."
        )

    connect_args = {}
    # psycopg2 requires no special connect args; add if using asyncpg
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        echo=settings.APP_ENV == "development",
        connect_args=connect_args,
    )
    logger.info(
        "[NER-SHIELD DB] Engine created: host=%s port=%s db=%s",
        settings.POSTGRES_HOST,
        settings.POSTGRES_PORT,
        settings.POSTGRES_DB,
    )
    return engine


def get_engine():
    """Return the cached engine, creating it if not yet initialised."""
    global _engine
    if _engine is None and not settings.DEMO_MODE:
        _engine = _build_engine()
    return _engine


def get_session_factory() -> Optional[sessionmaker]:
    """Return the session factory, or None in demo mode."""
    global _SessionLocal
    engine = get_engine()
    if engine is None:
        return None
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------


def get_db() -> Generator[Optional[Session], None, None]:
    """
    FastAPI dependency that yields a database session.

    In DEMO_MODE=true, yields None — endpoints must use the in-memory store.
    In DEMO_MODE=false, yields a real SQLAlchemy session and closes it after.
    """
    factory = get_session_factory()
    if factory is None:
        yield None
        return

    db = factory()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------


def init_db() -> None:
    """
    Create all tables (DDL) in the configured database.

    Safe to call multiple times — SQLAlchemy uses CREATE TABLE IF NOT EXISTS semantics.
    In DEMO_MODE=true this is a no-op.
    """
    if settings.DEMO_MODE:
        logger.info("[NER-SHIELD DB] DEMO_MODE=true — skipping table creation.")
        return

    engine = get_engine()
    if engine is None:
        logger.warning("[NER-SHIELD DB] Engine not available; skipping init_db.")
        return

    logger.info("[NER-SHIELD DB] Running init_db (CREATE TABLE IF NOT EXISTS) ...")
    try:
        # Ensure PostGIS extension exists
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            conn.commit()
    except Exception as exc:
        logger.warning("[NER-SHIELD DB] Could not create PostGIS extension: %s", exc)

    Base.metadata.create_all(bind=engine)
    logger.info("[NER-SHIELD DB] Table creation complete.")

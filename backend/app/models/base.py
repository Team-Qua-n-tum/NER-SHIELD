from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import TypeDecorator

try:
    from geoalchemy2 import Geometry
    _HAS_GEOALCHEMY = True
except ImportError:
    _HAS_GEOALCHEMY = False


def new_uuid() -> str:
    return str(uuid.uuid4())


class GeometryOrText(TypeDecorator):
    """
    Geometry column type that maps to PostGIS Geometry when using PostgreSQL,
    and cleanly falls back to Text on SQLite (e.g. for unit tests).
    """

    impl = Text
    cache_ok = True

    def __init__(self, geo_type: str = "GEOMETRY", srid: int = 4326, **kwargs):
        super().__init__()
        self.geo_type = geo_type
        self.srid = srid

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and _HAS_GEOALCHEMY:
            return dialect.type_descriptor(Geometry(self.geo_type, srid=self.srid))
        return dialect.type_descriptor(Text())


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

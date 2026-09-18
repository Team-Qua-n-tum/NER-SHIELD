"""
road.py — Road segment ORM model.

Uses GeoAlchemy2 for geometry when PostGIS is available.
Falls back to storing geometry as JSON text in SQLite (for tests).
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, new_uuid

try:
    from geoalchemy2 import Geometry
    _GEO_TYPE = Geometry("LINESTRING", srid=4326)
except ImportError:
    _GEO_TYPE = Text()  # type: ignore[assignment]


class Road(Base, TimestampMixin):
    """
    Represents a road segment in the NER transport network.

    geometry stores a WGS-84 (SRID 4326) LINESTRING in PostGIS,
    or a GeoJSON text string when using SQLite for tests.
    """

    __tablename__ = "roads"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_uuid)
    external_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    road_class: Mapped[str] = mapped_column(String(32), default="NATIONAL_HIGHWAY", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="OPEN", nullable=False)
    disruption_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), default="LOW", nullable=False)
    speed_limit_kmh: Mapped[float] = mapped_column(Float, default=40.0, nullable=False)
    length_km: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Start / end district references (FK omitted for demo compatibility)
    start_district_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    end_district_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # PostGIS geometry (LINESTRING). Stored as Text in SQLite.
    geometry: Mapped[Optional[str]] = mapped_column(_GEO_TYPE, nullable=True)

    def __repr__(self) -> str:
        return f"<Road id={self.id!r} name={self.name!r} status={self.status!r}>"

"""
incident.py — Field incident ORM model.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, new_uuid

try:
    from geoalchemy2 import Geometry
    _POINT_TYPE = Geometry("POINT", srid=4326)
except ImportError:
    _POINT_TYPE = Text()  # type: ignore[assignment]


class Incident(Base, TimestampMixin):
    """
    A geo-tagged field incident report (landslide, flood, road block, etc.).
    """

    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_uuid)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    incident_type: Mapped[str] = mapped_column(String(32), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="ACTIVE", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Location fields
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(_POINT_TYPE, nullable=True)

    # Foreign keys (stored as strings for demo compatibility)
    district_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    road_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    # Reporter metadata
    reported_by: Mapped[str] = mapped_column(String(255), default="Field Inspector", nullable=False)
    photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(64), default="FIELD_REPORT", nullable=False)

    # Timestamps for incident lifecycle
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<Incident id={self.id!r} type={self.incident_type!r} severity={self.severity!r}>"

"""
route.py — Planned route record ORM model.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, GeometryOrText, TimestampMixin, new_uuid

_LINE_TYPE = GeometryOrText("LINESTRING", srid=4326)


class RouteRecord(Base, TimestampMixin):
    """
    A computed logistics route stored for audit and replay.
    """

    __tablename__ = "route_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_uuid)
    origin_district_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    destination_district_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    commodity: Mapped[str] = mapped_column(String(64), default="GENERAL", nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(32), default="TRUCK", nullable=False)

    # Route metrics
    total_distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    eta_hours: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), default="LOW", nullable=False)

    # Optional geometry (LineString of the route path)
    geometry: Mapped[Optional[str]] = mapped_column(_LINE_TYPE, nullable=True)

    # JSON-serialised road_ids list
    road_ids: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    is_direct_blocked: Mapped[bool] = mapped_column(default=False, nullable=False)
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<RouteRecord {self.origin_district_id!r}→{self.destination_district_id!r} {self.eta_hours}h>"

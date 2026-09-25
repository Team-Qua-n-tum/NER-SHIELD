"""
vehicle.py — Vehicle tracking ORM model.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, GeometryOrText, TimestampMixin, new_uuid

_POINT_TYPE = GeometryOrText("POINT", srid=4326)


class Vehicle(Base, TimestampMixin):
    """
    Tracks a logistics vehicle in the NER network.
    Stores the latest GPS position and delivery status.
    """

    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_uuid)
    registration_number: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    vehicle_type: Mapped[str] = mapped_column(String(32), nullable=False)
    commodity: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    driver_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    driver_phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    # Route references
    origin_district: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    destination_district: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    assigned_route_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Current position
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    latest_position: Mapped[Optional[str]] = mapped_column(_POINT_TYPE, nullable=True)
    latest_position_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Status
    delivery_status: Mapped[str] = mapped_column(String(32), default="IN_TRANSIT", nullable=False)
    speed_kmh: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    eta_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    def __repr__(self) -> str:
        return f"<Vehicle reg={self.registration_number!r} status={self.delivery_status!r}>"

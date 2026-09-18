"""
weather.py — Weather observation ORM model.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, new_uuid

try:
    from geoalchemy2 import Geometry
    _POINT_TYPE = Geometry("POINT", srid=4326)
except ImportError:
    _POINT_TYPE = Text()  # type: ignore[assignment]


class WeatherObservation(Base, TimestampMixin):
    """
    A weather reading from a station or API provider at a specific NER location.
    """

    __tablename__ = "weather_observations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_uuid)

    # Station / source metadata
    station_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    source: Mapped[str] = mapped_column(String(64), default="IMD", nullable=False)
    district_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    # Geographic point
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(_POINT_TYPE, nullable=True)

    # Observation values
    rainfall_mm: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    temperature_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    humidity_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    visibility_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wind_speed_kmh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wind_direction: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)
    warning_level: Mapped[str] = mapped_column(String(16), default="NONE", nullable=False)

    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True
    )

    def __repr__(self) -> str:
        return f"<WeatherObservation id={self.id!r} warning={self.warning_level!r}>"

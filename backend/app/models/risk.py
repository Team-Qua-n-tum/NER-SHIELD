"""
risk.py — Route / segment risk record ORM model.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, new_uuid


class RiskRecord(Base, TimestampMixin):
    """
    Stores the output of a risk-model prediction for a specific road segment.
    Each prediction run creates a new record (append-only audit trail).
    """

    __tablename__ = "risk_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_uuid)
    road_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    district_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    # Prediction output
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # JSON-serialised list of risk factor strings
    reasons: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    model_version: Mapped[str] = mapped_column(String(64), default="prototype-v1", nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True
    )

    # Input snapshot (for reproducibility)
    rainfall_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    slope_degree: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weather_condition: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    def __repr__(self) -> str:
        return f"<RiskRecord id={self.id!r} level={self.risk_level!r} score={self.risk_score}>"

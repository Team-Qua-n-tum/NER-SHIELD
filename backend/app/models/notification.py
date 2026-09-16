from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.models.base import Base, TimestampMixin, new_uuid


class NotificationDevice(TimestampMixin, Base):
    __tablename__ = "notification_devices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    token: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    token_fingerprint: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    platform: Mapped[str] = mapped_column(String(32), nullable=False)
    device_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notification_types: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    district_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    active: Mapped[bool] = mapped_column(default=True, nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
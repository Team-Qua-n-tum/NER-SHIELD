from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.notification import NotificationDevice


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def upsert(self, values: dict[str, Any]) -> NotificationDevice:
        device = self.db.scalar(
            select(NotificationDevice).where(
                NotificationDevice.token_fingerprint == values["token_fingerprint"]
            )
        )
        if device is None:
            device = NotificationDevice(**values)
            self.db.add(device)
        else:
            for key, value in values.items():
                setattr(device, key, value)
        self.db.commit()
        self.db.refresh(device)
        return device

    def list_active(self) -> list[NotificationDevice]:
        return list(
            self.db.scalars(
                select(NotificationDevice).where(NotificationDevice.active.is_(True))
            )
        )

    def deactivate(self, device_id: str) -> bool:
        device = self.db.get(NotificationDevice, device_id)
        if device is None:
            return False
        device.active = False
        self.db.commit()
        return True

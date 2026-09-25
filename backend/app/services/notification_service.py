from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.db.store import db_store
from backend.app.providers.fcm import FCMProvider
from backend.app.schemas.notifications import (
    DeviceListResponse,
    DeviceRegistrationRequest,
    DeviceRegistrationResponse,
    NotificationDeliveryResult,
    NotificationSendRequest,
    NotificationSendResponse,
    utc_now,
)


def _fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()[:16]


def _device_response(device: Any, data_mode: str) -> DeviceRegistrationResponse:
    if isinstance(device, dict):
        values = device
    else:
        values = {
            "id": device.id,
            "token_fingerprint": device.token_fingerprint,
            "platform": device.platform,
            "device_name": device.device_name,
            "notification_types": device.notification_types,
            "district_ids": device.district_ids,
            "active": device.active,
            "registered_at": device.created_at,
        }
    return DeviceRegistrationResponse(
        device_id=values["id"],
        token_fingerprint=values["token_fingerprint"],
        platform=values["platform"],
        device_name=values.get("device_name"),
        notification_types=values["notification_types"],
        district_ids=values["district_ids"],
        active=values["active"],
        registered_at=values["registered_at"],
        data_mode=data_mode,
    )


class NotificationService:
    def __init__(self) -> None:
        self.fcm = FCMProvider()

    @property
    def data_mode(self) -> str:
        return "demo" if settings.DEMO_MODE else "live"

    def _require_live_db(self, db: Optional[Session]) -> Session:
        if db is None:
            raise HTTPException(status_code=503, detail="Live notification database is unavailable")
        return db

    @staticmethod
    def _repository(db: Session):
        try:
            from backend.app.repositories.notification_repository import NotificationRepository
        except ModuleNotFoundError as exc:
            raise HTTPException(
                status_code=503,
                detail="Live notification persistence is unavailable; ORM models are not installed",
            ) from exc
        return NotificationRepository(db)

    def register(self, request: DeviceRegistrationRequest, db: Optional[Session]) -> DeviceRegistrationResponse:
        now = utc_now()
        token_fingerprint = _fingerprint(request.token)
        if settings.DEMO_MODE:
            with db_store._lock:
                existing = next(
                    (item for item in db_store.notification_devices.values()
                     if item["token_fingerprint"] == token_fingerprint),
                    None,
                )
                device = existing or {
                    "id": f"device-{uuid.uuid4().hex[:12]}",
                    "registered_at": now,
                }
                device.update({
                    "token": request.token,
                    "token_fingerprint": token_fingerprint,
                    "platform": request.platform,
                    "device_name": request.device_name,
                    "notification_types": request.notification_types,
                    "district_ids": request.district_ids,
                    "active": True,
                })
                db_store.notification_devices[device["id"]] = device
            return _device_response(device, "demo")

        repository = self._repository(self._require_live_db(db))
        device = repository.upsert({
            "token": request.token,
            "token_fingerprint": token_fingerprint,
            "platform": request.platform,
            "device_name": request.device_name,
            "notification_types": request.notification_types,
            "district_ids": request.district_ids,
            "active": True,
            "last_seen_at": now,
        })
        return _device_response(device, "live")

    def list_devices(self, db: Optional[Session]) -> DeviceListResponse:
        if settings.DEMO_MODE:
            devices = list(db_store.notification_devices.values())
            return DeviceListResponse(
                total=len(devices),
                devices=[_device_response(device, "demo") for device in devices],
            )
        repository = self._repository(self._require_live_db(db))
        devices = repository.list_active()
        return DeviceListResponse(
            total=len(devices),
            devices=[_device_response(device, "live") for device in devices],
        )

    def unregister(self, device_id: str, db: Optional[Session]) -> None:
        if settings.DEMO_MODE:
            with db_store._lock:
                device = db_store.notification_devices.get(device_id)
                if device is None:
                    raise HTTPException(status_code=404, detail="Notification device not found")
                device["active"] = False
            return
        if not self._repository(self._require_live_db(db)).deactivate(device_id):
            raise HTTPException(status_code=404, detail="Notification device not found")

    def send(self, request: NotificationSendRequest, db: Optional[Session]) -> NotificationSendResponse:
        if settings.DEMO_MODE:
            devices = [
                device for device in db_store.notification_devices.values()
                if device["active"]
                and request.notification_type in device["notification_types"]
                and (not request.district_ids or not device["district_ids"]
                     or set(request.district_ids) & set(device["district_ids"]))
            ]
        else:
            devices = [
                device for device in self._repository(self._require_live_db(db)).list_active()
                if request.notification_type in device.notification_types
                and (not request.district_ids or not device.district_ids
                     or set(request.district_ids) & set(device.district_ids))
            ]

        results: list[NotificationDeliveryResult] = []
        for device in devices:
            device_id = device["id"] if isinstance(device, dict) else device.id
            fingerprint = device["token_fingerprint"] if isinstance(device, dict) else device.token_fingerprint
            if settings.DEMO_MODE:
                results.append(NotificationDeliveryResult(
                    device_id=device_id, token_fingerprint=fingerprint, status="simulated",
                ))
                continue
            try:
                self.fcm.send(device.token, request.title, request.body, request.data)
                results.append(NotificationDeliveryResult(
                    device_id=device_id, token_fingerprint=fingerprint, status="sent",
                ))
            except Exception as exc:
                results.append(NotificationDeliveryResult(
                    device_id=device_id, token_fingerprint=fingerprint, status="failed",
                    error=f"{type(exc).__name__}: notification provider unavailable",
                ))

        delivered = sum(result.status in {"sent", "simulated"} for result in results)
        if not devices:
            status = "simulated" if settings.DEMO_MODE else "degraded"
        elif delivered == len(results):
            status = "simulated" if settings.DEMO_MODE else "sent"
        elif delivered:
            status = "degraded"
        else:
            status = "failed"
        return NotificationSendResponse(
            notification_id=f"notification-{uuid.uuid4().hex[:12]}",
            status=status, data_mode=self.data_mode, sent_at=utc_now(),
            attempted=len(results), delivered=delivered, results=results,
        )


notification_service = NotificationService()
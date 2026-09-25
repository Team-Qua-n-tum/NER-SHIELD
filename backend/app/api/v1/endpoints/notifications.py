from typing import Optional

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.schemas.notifications import (
    DeviceListResponse,
    DeviceRegistrationRequest,
    DeviceRegistrationResponse,
    NotificationSendRequest,
    NotificationSendResponse,
)
from backend.app.services.notification_service import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/devices", response_model=DeviceRegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_device(
    request: DeviceRegistrationRequest,
    db: Optional[Session] = Depends(get_db),
):
    return notification_service.register(request, db)


@router.get("/devices", response_model=DeviceListResponse)
def list_devices(db: Optional[Session] = Depends(get_db)):
    return notification_service.list_devices(db)


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def unregister_device(device_id: str, db: Optional[Session] = Depends(get_db)):
    notification_service.unregister(device_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/send", response_model=NotificationSendResponse)
def send_notification(
    request: NotificationSendRequest,
    db: Optional[Session] = Depends(get_db),
):
    return notification_service.send(request, db)
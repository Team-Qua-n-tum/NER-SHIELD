from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


NOTIFICATION_TYPES = {
    "ROAD_BLOCKED",
    "LANDSLIDE_WARNING",
    "FLOOD_ALERT",
    "ROUTE_CHANGED",
    "DELIVERY_DELAYED",
}


class DeviceRegistrationRequest(BaseModel):
    token: str = Field(..., min_length=20, max_length=4096)
    platform: Literal["web"]
    device_name: Optional[str] = Field(None, max_length=120)
    notification_types: List[str] = Field(default_factory=list, max_length=20)
    district_ids: List[str] = Field(default_factory=list, max_length=100)

    @field_validator("token", "device_name")
    @classmethod
    def strip_text(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value is not None else value

    @field_validator("notification_types")
    @classmethod
    def validate_notification_types(cls, values: List[str]) -> List[str]:
        invalid = set(values) - NOTIFICATION_TYPES
        if invalid:
            raise ValueError(f"Unsupported notification types: {sorted(invalid)}")
        return sorted(set(values))


class DeviceRegistrationResponse(BaseModel):
    device_id: str
    token_fingerprint: str
    platform: str
    device_name: Optional[str] = None
    notification_types: List[str]
    district_ids: List[str]
    active: bool
    registered_at: datetime
    data_mode: str


class NotificationSendRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=160)
    body: str = Field(..., min_length=1, max_length=1000)
    notification_type: str
    district_ids: List[str] = Field(default_factory=list, max_length=100)
    data: Dict[str, str] = Field(default_factory=dict, max_length=30)

    @field_validator("notification_type")
    @classmethod
    def validate_notification_type(cls, value: str) -> str:
        if value not in NOTIFICATION_TYPES:
            raise ValueError(f"Unsupported notification type: {value}")
        return value


class NotificationDeliveryResult(BaseModel):
    device_id: str
    token_fingerprint: str
    status: Literal["sent", "simulated", "failed", "skipped"]
    error: Optional[str] = None


class NotificationSendResponse(BaseModel):
    notification_id: str
    status: Literal["sent", "simulated", "degraded", "failed"]
    data_mode: str
    sent_at: datetime
    attempted: int
    delivered: int
    results: List[NotificationDeliveryResult]


class DeviceListResponse(BaseModel):
    total: int
    devices: List[DeviceRegistrationResponse]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
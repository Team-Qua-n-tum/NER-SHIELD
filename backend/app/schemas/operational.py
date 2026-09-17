from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class OperationalItem(BaseModel):
    id: str
    source: str
    source_updated_at: Optional[datetime] = None
    fetched_at: datetime = Field(default_factory=utc_now)
    data_mode: str
    freshness_seconds: Optional[float] = None
    stale: bool = False
    geometry: Optional[Dict[str, Any]] = None


class OperationalListResponse(BaseModel):
    total: int
    items: List[Dict[str, Any]]
    roads: Optional[List[Dict[str, Any]]] = None
    incidents: Optional[List[Dict[str, Any]]] = None
    vehicles: Optional[List[Dict[str, Any]]] = None
    alerts: Optional[List[Dict[str, Any]]] = None
    source: str
    source_updated_at: Optional[datetime] = None
    fetched_at: datetime = Field(default_factory=utc_now)
    data_mode: str
    freshness_seconds: Optional[float] = None
    stale: bool = False


class WeatherForecastResponse(BaseModel):
    id: str
    latitude: float
    longitude: float
    rainfall_mm: float
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    condition: str
    warning_level: str
    source: str
    source_updated_at: datetime
    fetched_at: datetime
    data_mode: str
    freshness_seconds: float
    stale: bool


class SourceRefreshResult(BaseModel):
    source: str
    status: str
    source_type: str
    fetched_at: datetime
    freshness_seconds: Optional[float] = None
    stale: bool = False
    error: Optional[str] = None


class RefreshResponse(BaseModel):
    status: str
    data_mode: str
    refreshed_at: datetime
    sources: List[SourceRefreshResult]


class SystemStatusResponse(BaseModel):
    status: str
    app_version: str
    environment: str
    data_mode: str
    database_status: str
    weather_provider_status: str
    routing_provider_status: str
    last_refresh_at: Optional[datetime] = None

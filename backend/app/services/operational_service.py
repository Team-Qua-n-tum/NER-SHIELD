from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.db.database import get_engine
from backend.app.db.store import db_store
from backend.app.providers.mock_weather import MockWeatherProvider
from backend.app.providers.open_meteo import OpenMeteoProvider
from backend.app.schemas.operational import (
    OperationalListResponse,
    RefreshResponse,
    SourceRefreshResult,
    SystemStatusResponse,
    WeatherForecastResponse,
    utc_now,
)


def _age(timestamp: Optional[datetime]) -> Optional[float]:
    if timestamp is None:
        return None
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    return max(0.0, (utc_now() - timestamp).total_seconds())


def parse_bbox(value: Optional[str]) -> Optional[Tuple[float, float, float, float]]:
    if value is None:
        return None
    try:
        parts = [float(part.strip()) for part in value.split(",")]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="bbox must be minLon,minLat,maxLon,maxLat") from exc
    if len(parts) != 4:
        raise HTTPException(status_code=422, detail="bbox must be minLon,minLat,maxLon,maxLat")
    min_lon, min_lat, max_lon, max_lat = parts
    if not (-180 <= min_lon < max_lon <= 180 and -90 <= min_lat < max_lat <= 90):
        raise HTTPException(status_code=422, detail="bbox coordinates are invalid or out of order")
    return min_lon, min_lat, max_lon, max_lat


def _point_in_bbox(lat: float, lon: float, bbox: Optional[Tuple[float, float, float, float]]) -> bool:
    if bbox is None:
        return True
    min_lon, min_lat, max_lon, max_lat = bbox
    return min_lon <= lon <= max_lon and min_lat <= lat <= max_lat


class OperationalService:
    def __init__(self) -> None:
        self.last_refresh_at: Optional[datetime] = None
        self.weather_provider = MockWeatherProvider() if settings.DEMO_MODE else OpenMeteoProvider()

    @property
    def data_mode(self) -> str:
        return "demo" if settings.DEMO_MODE else "live"

    def _database_status(self) -> str:
        if settings.DEMO_MODE:
            return "not_required"
        try:
            engine = get_engine()
            if engine is None:
                return "unavailable"
            with engine.connect():
                return "connected"
        except Exception:
            return "unavailable"

    def system_status(self) -> SystemStatusResponse:
        database_status = self._database_status()
        weather_status = "available" if self.weather_provider.is_available() else "unavailable"
        routing_status = "configured" if settings.DEMO_MODE or settings.ROUTING_API_URL else "unconfigured"
        status = "ok" if settings.DEMO_MODE else (
            "ok" if database_status == "connected" and weather_status == "available" else "degraded"
        )
        return SystemStatusResponse(
            status=status,
            app_version=settings.VERSION,
            environment=settings.APP_ENV,
            data_mode=self.data_mode,
            database_status=database_status,
            weather_provider_status=weather_status,
            routing_provider_status=routing_status,
            last_refresh_at=self.last_refresh_at,
        )

    def _live_db_or_error(self) -> None:
        if settings.DEMO_MODE:
            return
        if self._database_status() != "connected":
            raise HTTPException(status_code=503, detail="Live database is unavailable")

    def _list(self, name: str, bbox: Optional[Tuple[float, float, float, float]], since: Optional[datetime]) -> OperationalListResponse:
        self._live_db_or_error()
        values = list(getattr(db_store, name).values()) if settings.DEMO_MODE else []
        filtered = []
        for item in values:
            lat = getattr(item, "lat", None)
            lon = getattr(item, "lng", None)
            if name == "roads":
                points = getattr(item, "path_coordinates", [])
                in_bounds = bbox is None or any(_point_in_bbox(p.lat, p.lng, bbox) for p in points)
            else:
                in_bounds = _point_in_bbox(lat, lon, bbox) if lat is not None and lon is not None else bbox is None
            updated = getattr(item, "reported_at", None) or getattr(item, "created_at", None)
            if since and updated:
                if updated.tzinfo is None:
                    updated = updated.replace(tzinfo=timezone.utc)
                if since.tzinfo is None:
                    since = since.replace(tzinfo=timezone.utc)
            if since and updated and updated < since:
                continue
            if in_bounds:
                data = item.model_dump() if hasattr(item, "model_dump") else item.dict()
                filtered.append(data)
        now = utc_now()
        legacy_key = name
        return OperationalListResponse(
            total=len(filtered), items=filtered, **{legacy_key: filtered},
            source="mock" if settings.DEMO_MODE else "database",
            fetched_at=now, data_mode=self.data_mode, freshness_seconds=0.0, stale=False,
        )

    def roads(self, bbox: Optional[str]) -> OperationalListResponse:
        return self._list("roads", parse_bbox(bbox), None)

    def incidents(self, bbox: Optional[str], since: Optional[datetime]) -> OperationalListResponse:
        return self._list("incidents", parse_bbox(bbox), since)

    def vehicles(self, bbox: Optional[str], since: Optional[datetime]) -> OperationalListResponse:
        return self._list("vehicles", parse_bbox(bbox), since)

    def alerts(self, active: bool) -> OperationalListResponse:
        response = self._list("alerts", None, None)
        if active and settings.DEMO_MODE:
            response.items = [item for item in response.items if item.get("active") is True]
            response.total = len(response.items)
            response.alerts = response.items
        return response

    def weather_forecast(self) -> WeatherForecastResponse:
        fetched_at = utc_now()
        try:
            reading = self.weather_provider.fetch(26.1445, 91.7362)
            source_updated_at = reading.observed_at.replace(tzinfo=timezone.utc)
            return WeatherForecastResponse(
                id="weather-guwahati", latitude=reading.lat, longitude=reading.lon,
                rainfall_mm=reading.rainfall_mm, temperature_c=reading.temperature_c,
                humidity_pct=reading.humidity_pct, condition=reading.condition,
                warning_level=reading.warning_level, source=reading.source,
                source_updated_at=source_updated_at, fetched_at=fetched_at,
                data_mode=self.data_mode, freshness_seconds=_age(source_updated_at) or 0.0, stale=False,
            )
        except Exception:
            return WeatherForecastResponse(
                id="weather-unavailable", latitude=26.1445, longitude=91.7362,
                rainfall_mm=0.0, condition="UNKNOWN", warning_level="UNKNOWN",
                source="unavailable", source_updated_at=fetched_at, fetched_at=fetched_at,
                data_mode="degraded", freshness_seconds=0.0, stale=True,
            )

    def refresh(self) -> RefreshResponse:
        refreshed_at = utc_now()
        results = []
        weather = self.weather_forecast()
        results.append(SourceRefreshResult(
            source="weather", status="success" if not weather.stale else "failure",
            source_type=weather.source, fetched_at=weather.fetched_at,
            freshness_seconds=weather.freshness_seconds, stale=weather.stale,
            error=None if not weather.stale else "Weather provider unavailable",
        ))
        database_status = self._database_status()
        results.append(SourceRefreshResult(
            source="operations", status="success" if settings.DEMO_MODE or database_status == "connected" else "failure",
            source_type="mock" if settings.DEMO_MODE else "database", fetched_at=refreshed_at,
            freshness_seconds=0.0, stale=not settings.DEMO_MODE and database_status != "connected",
            error=None if settings.DEMO_MODE or database_status == "connected" else "Live database unavailable",
        ))
        self.last_refresh_at = refreshed_at
        return RefreshResponse(
            status="ok" if all(result.status == "success" for result in results) else "degraded",
            data_mode=self.data_mode, refreshed_at=refreshed_at, sources=results,
        )


operational_service = OperationalService()
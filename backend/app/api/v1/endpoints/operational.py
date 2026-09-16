from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query

from backend.app.schemas.operational import (
    OperationalListResponse,
    RefreshResponse,
    SystemStatusResponse,
    WeatherForecastResponse,
)
from backend.app.services.operational_service import operational_service

router = APIRouter()


@router.get("/system/status", response_model=SystemStatusResponse, tags=["Health"])
def system_status():
    return operational_service.system_status()


@router.get("/dashboard/live", response_model=dict, tags=["Dashboard"])
def live_dashboard():
    status = operational_service.system_status()
    return {
        "status": status.status,
        "data_mode": status.data_mode,
        "system": status.model_dump(),
        "roads": operational_service.roads(None).model_dump(),
        "incidents": operational_service.incidents(None, None).model_dump(),
        "vehicles": operational_service.vehicles(None, None).model_dump(),
        "alerts": operational_service.alerts(True).model_dump(),
        "weather": operational_service.weather_forecast().model_dump(),
    }


@router.get("/weather/forecast", response_model=WeatherForecastResponse, tags=["Weather"])
def weather_forecast():
    return operational_service.weather_forecast()


@router.get("/roads", response_model=OperationalListResponse, tags=["Roads"])
def operational_roads(bbox: Optional[str] = Query(None)):
    return operational_service.roads(bbox)


@router.get("/incidents", response_model=OperationalListResponse, tags=["Incidents"])
def operational_incidents(bbox: Optional[str] = Query(None), since: Optional[datetime] = Query(None)):
    return operational_service.incidents(bbox, since)


@router.get("/vehicles", response_model=OperationalListResponse, tags=["Vehicles"])
def operational_vehicles(bbox: Optional[str] = Query(None), since: Optional[datetime] = Query(None)):
    return operational_service.vehicles(bbox, since)


@router.get("/alerts", response_model=OperationalListResponse, tags=["Alerts"])
def operational_alerts(active: bool = Query(True)):
    return operational_service.alerts(active)


@router.post("/refresh", response_model=RefreshResponse, tags=["Operations"])
def refresh():
    return operational_service.refresh()
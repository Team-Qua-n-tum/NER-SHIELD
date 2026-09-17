"""
risk.py — Risk prediction API endpoints.

Existing endpoint preserved exactly for backward compatibility.
New endpoints added as separate routes.
"""

from typing import Optional

from fastapi import APIRouter, Query

from backend.app.schemas.risk import (
    ETAResponse,
    RiskPredictionRequest,
    RiskPredictionResponse,
    RiskRoadResponse,
)
from backend.app.schemas.segment_prediction import (
    RoadSegmentPredictionRequest,
    RoadSegmentPredictionResponse,
)
from backend.app.services.ai_service import ai_service

router = APIRouter()


@router.post(
    "/risk/predict",
    response_model=RiskPredictionResponse,
    summary="Predict disruption risk probability via AI model",
    tags=["AI Risk Engine"],
)
def predict_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
    """
    Calculate route/segment disruption risk.

    Uses GIS-aware inference when road_id is provided; falls back to
    heuristic with supplied request fields otherwise.

    Response includes backward-compatible fields plus enriched metadata:
    method, source_status, stale, route-ready routing_recommendation, route_eligible.
    """
    return ai_service.predict_risk(request)


@router.get(
    "/risk/road/{road_id}",
    response_model=RiskRoadResponse,
    summary="Get full GIS-aware risk assessment for a specific road segment",
    tags=["AI Risk Engine"],
)
def get_road_risk(
    road_id: str,
    district_id: Optional[str] = Query(None, description="Optional district context"),
    lat: float = Query(26.1445, description="Latitude for weather lookup"),
    lon: float = Query(91.7362, description="Longitude for weather lookup"),
) -> RiskRoadResponse:
    """
    Retrieve a comprehensive GIS-aware risk assessment for a road segment.

    Assembles weather, road state, and GIS incident impact data, then
    runs risk inference. Returns route-ready fields the routing branch
    can consume directly (routing_recommendation, route_eligible, risk_penalty).
    """
    return ai_service.predict_risk_for_road(
        road_id=road_id,
        district_id=district_id,
        lat=lat,
        lon=lon,
    )


@router.get(
    "/risk/road/{road_id}/eta",
    response_model=ETAResponse,
    summary="Get ETA adjustment with delay breakdown for a road segment",
    tags=["AI Risk Engine"],
)
def get_road_eta(
    road_id: str,
    distance_km: float = Query(..., gt=0.0, description="Route or segment distance in km"),
    district_id: Optional[str] = Query(None, description="Optional district context"),
    lat: float = Query(26.1445, description="Latitude for weather lookup"),
    lon: float = Query(91.7362, description="Longitude for weather lookup"),
) -> ETAResponse:
    """
    Calculate ETA with operationally-understandable delay breakdown.

    Returns breakdown of delay by component:
    weather, incident, road condition, and risk buffer.

    For blocked roads, returns route_eligible=False with no ETA.
    """
    return ai_service.predict_eta(
        road_id=road_id,
        distance_km=distance_km,
        district_id=district_id,
        lat=lat,
        lon=lon,
    )


@router.post(
    "/risk/road/{road_id}/predict-future",
    response_model=RoadSegmentPredictionResponse,
    summary="Predict future disruption, closure probability, and delay over horizon",
    tags=["AI Risk Engine"],
)
def predict_road_future(
    road_id: str,
    request: RoadSegmentPredictionRequest,
) -> RoadSegmentPredictionResponse:
    """
    Predict road-segment disruption probability, closure probability, speed,
    and delay over a specified time horizon using deep learning with heuristic fallback.

    Outputs are route-ready for routing engine edge cost updates.
    """
    return ai_service.predict_segment_future(
        road_id=road_id,
        horizon_minutes=request.prediction_horizon_minutes,
        district_id=request.district_id,
        lat=request.lat,
        lon=request.lon,
        historical_points=request.historical_points,
        distance_km=request.distance_km,
    )


@router.get(
    "/risk/road/{road_id}/forecast",
    response_model=RoadSegmentPredictionResponse,
    summary="Forecast road segment disruption and delay for a future horizon",
    tags=["AI Risk Engine"],
)
def forecast_road_segment(
    road_id: str,
    horizon_minutes: int = Query(60, ge=5, le=1440, description="Future prediction horizon in minutes"),
    district_id: Optional[str] = Query(None, description="Optional district context"),
    distance_km: Optional[float] = Query(None, gt=0.0, description="Optional segment distance in km"),
    lat: float = Query(26.1445, description="Latitude for weather lookup"),
    lon: float = Query(91.7362, description="Longitude for weather lookup"),
) -> RoadSegmentPredictionResponse:
    """
    Convenience GET endpoint to forecast future disruption, closure probability, and speed.
    """
    return ai_service.predict_segment_future(
        road_id=road_id,
        horizon_minutes=horizon_minutes,
        district_id=district_id,
        lat=lat,
        lon=lon,
        distance_km=distance_km,
    )


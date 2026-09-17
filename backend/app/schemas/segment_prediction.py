"""
segment_prediction.py — Pydantic schemas for road-segment future prediction API.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class SegmentTimePointSchema(BaseModel):
    timestamp: Optional[datetime] = Field(None, description="Observation timestamp")
    rainfall_mm_1h: Optional[float] = Field(None, ge=0.0, le=500.0, description="1h rainfall in mm")
    rainfall_mm_24h: Optional[float] = Field(None, ge=0.0, le=2000.0, description="24h rainfall in mm")
    speed_kmh: Optional[float] = Field(None, ge=0.0, le=200.0, description="Observed traffic speed")
    road_status: Optional[str] = Field(None, description="OPEN|DISRUPTED|BLOCKED|CLOSED")
    active_incident_count: int = Field(0, ge=0, description="Active incidents count")
    suggested_risk_penalty: Optional[float] = Field(None, ge=0.0, le=1.0)
    traffic_congestion_proxy: Optional[float] = Field(None, ge=0.0, le=1.0)


class RoadSegmentPredictionRequest(BaseModel):
    road_id: str = Field(..., description="Target road segment ID")
    district_id: Optional[str] = Field(None, description="Optional district context")
    prediction_horizon_minutes: int = Field(60, ge=5, le=1440, description="Future prediction horizon in minutes")
    historical_points: Optional[List[SegmentTimePointSchema]] = Field(
        None, description="Optional historical time-series observation snapshots"
    )
    distance_km: Optional[float] = Field(None, gt=0.0, description="Optional segment length to compute routing edge impact")
    lat: float = Field(26.1445, description="Latitude for weather lookup")
    lon: float = Field(91.7362, description="Longitude for weather lookup")


class RoutingEdgeImpact(BaseModel):
    disruption_risk: float = Field(..., ge=0.0, le=1.0, description="Normalized edge disruption probability")
    effective_speed_kmh: float = Field(..., ge=0.0, description="Expected operational transit speed")
    traversable: bool = Field(..., description="False if road is blocked or closure probability >= 0.85")
    suggested_status: str = Field(..., description="OPEN | RESTRICTED | BLOCKED")
    adjusted_travel_time_hrs: Optional[float] = Field(None, ge=0.0, description="Calculated segment travel time in hours")
    edge_cost_multiplier: float = Field(..., ge=1.0, description="Edge cost penalty multiplier for routing engine")


class RoadSegmentPredictionResponse(BaseModel):
    road_id: str = Field(..., description="Road segment identifier")
    predicted_disruption_probability: float = Field(..., ge=0.0, le=1.0, description="Disruption risk probability over horizon")
    closure_probability: float = Field(..., ge=0.0, le=1.0, description="Road closure probability over horizon")
    predicted_delay_minutes: float = Field(..., ge=0.0, description="Expected transit delay in minutes")
    predicted_speed_kmh: float = Field(..., ge=0.0, description="Expected future speed in km/h")
    eta_multiplier: float = Field(..., ge=1.0, description="ETA multiplier relative to free-flow")
    prediction_confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence score")
    prediction_horizon_minutes: int = Field(..., description="Forecast horizon evaluated")
    method: str = Field(..., description="prototype/synthetic-trained | deep_learning_temporal | deterministic_heuristic")
    model_version: str = Field(..., description="Version of model or heuristic used")
    calculated_at: str = Field(..., description="ISO 8601 UTC calculation timestamp")
    stale: bool = Field(False, description="True if any input data exceeded freshness threshold")
    data_mode: str = Field("demo", description="demo | live | degraded")
    routing_edge_impact: Optional[RoutingEdgeImpact] = Field(
        None, description="Edge cost and traversability updates ready for routing engine consumption"
    )

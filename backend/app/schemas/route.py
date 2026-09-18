from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class RouteConstraints(BaseModel):
    avoid_high_risk: bool = Field(True, description="Avoid high or critical risk corridors")
    max_delay_hours: Optional[float] = Field(None, description="Maximum acceptable delay threshold")
    vehicle_type: Optional[str] = Field("TRUCK", description="TRUCK, TANKER, MINI_TRUCK")


class RouteRequest(BaseModel):
    source_district: str = Field(..., description="Origin district ID e.g. dist-guwahati")
    destination_district: str = Field(..., description="Destination district ID e.g. dist-tawang")
    commodity: str = Field("MEDICINES", description="Commodity category being transported")
    constraints: RouteConstraints = Field(default_factory=RouteConstraints)


class RoutePoint(BaseModel):
    district_id: str
    district_name: str
    lat: float
    lng: float


class DelayBreakdown(BaseModel):
    base_eta_minutes: Optional[float] = None
    surface_delay_minutes: Optional[float] = None
    traffic_delay_minutes: Optional[float] = None
    disruption_risk_buffer_minutes: Optional[float] = None
    predicted_delay_minutes: Optional[float] = None
    total_delay_minutes: Optional[float] = None


class RouteOption(BaseModel):
    route_name: str = Field(..., description="Name of route option e.g. Primary Corridor via NH-27")
    waypoints: List[RoutePoint] = Field(default_factory=list, description="Ordered route waypoints")
    total_distance_km: float = Field(..., description="Total route length in km")
    eta_hours: float = Field(..., description="Estimated travel time in hours")
    risk_score: float = Field(..., description="Overall route risk probability score 0.0-1.0")
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    reason: str = Field(..., description="Justification for route selection or recommendation")
    road_ids: List[str] = Field(default_factory=list, description="Included road segment IDs")

    # Enriched fields (optional for backward compatibility)
    route_id: Optional[str] = None
    geometry: Optional[Dict[str, Any]] = Field(
        None, description="GeoJSON LineString with [longitude, latitude] coordinates"
    )
    edge_ids: Optional[List[str]] = None
    distance_km: Optional[float] = None
    base_eta_minutes: Optional[float] = None
    eta_minutes: Optional[float] = None
    delay_minutes: Optional[float] = None
    delay_breakdown: Optional[Dict[str, Any]] = None
    risk_penalty: Optional[float] = None
    route_eligible: Optional[bool] = None
    route_rank: Optional[int] = None
    selected_route: Optional[bool] = None
    summary: Optional[str] = None
    reasoning: Optional[str] = None
    active_alerts: Optional[List[Dict[str, Any]]] = None
    data_mode: Optional[str] = None
    source_status: Optional[str] = None
    stale: Optional[bool] = None


class RouteResponse(BaseModel):
    # Legacy fields
    source: Optional[str] = None
    destination: Optional[str] = None
    commodity: Optional[str] = None
    recommended_route: Optional[RouteOption] = None
    alternate_route: Optional[RouteOption] = None
    is_direct_route_blocked: bool = Field(False, description="Flag indicating primary route blockage")

    # Enriched contract
    request_id: Optional[str] = None
    status: str = Field("success", description="success|no_route|invalid_origin|invalid_destination|graph_unavailable|degraded")
    message: Optional[str] = None
    reason_code: Optional[str] = None
    selected_route: Optional[RouteOption] = None
    routes: Optional[List[RouteOption]] = None
    alternatives: Optional[List[RouteOption]] = None
    alternative_status: Optional[str] = None
    routing_engine: Optional[str] = None
    routing_engine_version: Optional[str] = None
    fallback_used: Optional[bool] = None
    fallback_reason: Optional[str] = None
    graph_status: Optional[str] = None
    origin_snap: Optional[Dict[str, Any]] = None
    destination_snap: Optional[Dict[str, Any]] = None
    road_state_updated_at: Optional[str] = None
    risk_calculated_at: Optional[str] = None
    data_mode: Optional[str] = None
    source_status: Optional[str] = None
    stale: Optional[bool] = None
    active_alerts: Optional[List[Dict[str, Any]]] = None
    generated_at: Optional[str] = None
    persistence_status: Optional[str] = None
    reasoning: Optional[str] = None

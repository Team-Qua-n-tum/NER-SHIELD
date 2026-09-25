from pydantic import BaseModel, Field
from typing import List, Optional

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

class RouteOption(BaseModel):
    route_name: str = Field(..., description="Name of route option e.g. Primary Corridor via NH-27")
    waypoints: List[RoutePoint] = Field(..., description="Ordered route waypoints")
    total_distance_km: float = Field(..., description="Total route length in km")
    eta_hours: float = Field(..., description="Estimated travel time in hours")
    risk_score: float = Field(..., description="Overall route risk probability score 0.0-1.0")
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    reason: str = Field(..., description="Justification for route selection or recommendation")
    road_ids: List[str] = Field(..., description="Included road segment IDs")

class RouteResponse(BaseModel):
    source: str
    destination: str
    commodity: str
    recommended_route: RouteOption
    alternate_route: Optional[RouteOption] = None
    is_direct_route_blocked: bool = Field(False, description="Flag indicating primary route blockage")

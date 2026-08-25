from pydantic import BaseModel, Field
from typing import List, Optional

class CorridorSummary(BaseModel):
    id: str
    code: str
    name: str
    risk_level: str
    status: str

class DashboardSummaryResponse(BaseModel):
    districts_monitored: int = Field(..., description="Total monitored districts")
    total_roads: int = Field(..., description="Total monitored road corridors")
    open_roads: int = Field(..., description="Roads open for traffic")
    disrupted_roads: int = Field(..., description="Roads with partial disruptions")
    blocked_roads: int = Field(..., description="Completely blocked roads")
    active_incidents: int = Field(..., description="Total open active incidents")
    vehicles_in_transit: int = Field(..., description="Active supply vehicles currently in transit")
    delayed_deliveries: int = Field(..., description="Vehicles experiencing delays due to disruptions")
    high_risk_corridors_count: int = Field(..., description="Count of corridors with HIGH or CRITICAL risk")
    high_risk_corridors: List[CorridorSummary] = Field(..., description="List of high risk corridors")
    last_updated: str = Field(..., description="ISO timestamp")

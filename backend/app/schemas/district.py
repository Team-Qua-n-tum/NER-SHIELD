from pydantic import BaseModel, Field
from typing import List, Optional

class Coordinates(BaseModel):
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")

class DistrictBase(BaseModel):
    id: str = Field(..., description="Unique district identifier")
    name: str = Field(..., description="District name")
    state: str = Field(..., description="State name in North Eastern Region")
    coordinates: Coordinates = Field(..., description="Center coordinates")
    connectivity_status: str = Field(..., description="Status: NORMAL, PARTIAL_DISRUPTED, CUT_OFF")
    accessibility_score: float = Field(..., ge=0.0, le=100.0, description="Accessibility score 0-100")
    active_incidents_count: int = Field(0, ge=0, description="Count of open incidents")
    risk_level: str = Field("LOW", description="District overall risk level: LOW, MEDIUM, HIGH, CRITICAL")
    isolation_vulnerability: str = Field("LOW", description="Vulnerability to supply isolation")

class DistrictResponse(DistrictBase):
    last_updated: str = Field(..., description="ISO formatted timestamp")

class DistrictListResponse(BaseModel):
    total: int
    districts: List[DistrictResponse]

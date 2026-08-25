from pydantic import BaseModel, Field
from typing import List, Optional

class GeoPoint(BaseModel):
    lat: float
    lng: float

class RoadBase(BaseModel):
    id: str = Field(..., description="Unique road segment identifier")
    code: str = Field(..., description="Road code e.g. NH-27, NH-6")
    name: str = Field(..., description="Corridor name e.g. Guwahati - Shillong Highway")
    start_district: str = Field(..., description="Origin district ID")
    end_district: str = Field(..., description="Destination district ID")
    length_km: float = Field(..., description="Length of road segment in km")
    status: str = Field(..., description="Status: OPEN, DISRUPTED, BLOCKED")
    disruption_cause: Optional[str] = Field(None, description="Landslide, Flood, Heavy Rain, Infrastructure Gap")
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Risk probability score 0.0 to 1.0")
    risk_level: str = Field(..., description="Risk classification: LOW, MEDIUM, HIGH, CRITICAL")
    path_coordinates: List[GeoPoint] = Field([], description="Polyline path coordinates for GIS map visualization")

class RoadResponse(RoadBase):
    last_checked: str

class RoadStatusUpdate(BaseModel):
    status: str = Field(..., description="OPEN, DISRUPTED, BLOCKED")
    disruption_cause: Optional[str] = Field(None, description="Cause of status change")
    notes: Optional[str] = Field(None, description="Field inspector comments")

class RoadListResponse(BaseModel):
    total: int
    roads: List[RoadResponse]

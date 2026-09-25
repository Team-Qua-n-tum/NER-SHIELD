from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class IncidentCreate(BaseModel):
    title: str = Field(..., description="Short incident summary e.g. Major Landslide near Sonapur")
    incident_type: str = Field(..., description="LANDSLIDE, FLOOD, ROAD_BLOCK, BRIDGE_DAMAGE, HEAVY_RAINFALL, ACCIDENT")
    severity: str = Field(..., description="MINOR, MODERATE, SEVERE, CRITICAL")
    district_id: str = Field(..., description="District ID where incident occurred")
    road_id: Optional[str] = Field(None, description="Affected road ID if applicable")
    lat: float = Field(..., description="Geo-tagged latitude")
    lng: float = Field(..., description="Geo-tagged longitude")
    description: str = Field(..., description="Detailed field observations")
    reported_by: str = Field("Field Inspector", description="Reporter identity/role")
    photo_url: Optional[str] = Field(None, description="URL or base64 image reference")

class IncidentResponse(IncidentCreate):
    id: str = Field(..., description="Unique incident ID")
    status: str = Field("ACTIVE", description="ACTIVE, IN_PROGRESS, RESOLVED")
    reported_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

class IncidentStatusUpdate(BaseModel):
    status: str = Field(..., description="ACTIVE, IN_PROGRESS, RESOLVED")
    notes: Optional[str] = Field(None, description="Update notes")

class IncidentListResponse(BaseModel):
    total: int
    incidents: List[IncidentResponse]

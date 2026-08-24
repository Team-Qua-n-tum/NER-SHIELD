from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AlertCreate(BaseModel):
    title: str = Field(..., description="Alert headline e.g. Flash Flood Warning in East Khasi Hills")
    category: str = Field(..., description="ROAD_BLOCK, WEATHER_WARNING, DELAY_WARNING, DISASTER_ALERT")
    severity: str = Field(..., description="INFO, WARNING, HIGH, CRITICAL")
    district_id: Optional[str] = Field(None, description="Affected district ID")
    road_id: Optional[str] = Field(None, description="Affected road ID")
    message: str = Field(..., description="Detailed alert message body")

class AlertResponse(AlertCreate):
    id: str = Field(..., description="Alert unique identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    active: bool = Field(True, description="Whether alert is currently active")

class AlertListResponse(BaseModel):
    total: int
    alerts: List[AlertResponse]

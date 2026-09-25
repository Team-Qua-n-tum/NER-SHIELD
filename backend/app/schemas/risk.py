from pydantic import BaseModel, Field
from typing import List, Optional

class RiskPredictionRequest(BaseModel):
    district_id: Optional[str] = Field(None, description="District ID for localized assessment")
    road_id: Optional[str] = Field(None, description="Road ID for segment assessment")
    rainfall_mm: float = Field(0.0, ge=0.0, description="24-hour accumulated rainfall in mm")
    slope_degree: float = Field(15.0, ge=0.0, le=90.0, description="Terrain slope steepness in degrees")
    weather_condition: str = Field("CLEAR", description="CLEAR, RAIN, HEAVY_RAIN, FOG, THUNDERSTORM")
    soil_type: str = Field("LOAM", description="LOAM, CLAY, GRAVEL, ROCKY")
    historical_landslides_count: int = Field(0, ge=0, description="Historical incident count in area")
    active_incidents_count: int = Field(0, ge=0, description="Currently open incidents in vicinity")

class RiskPredictionResponse(BaseModel):
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="AI calculated risk probability 0.0-1.0")
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    risk_factors: List[str] = Field(..., description="Identified risk driver factors")
    confidence_score: float = Field(0.92, description="Model prediction confidence score 0.0-1.0")
    recommendation: str = Field(..., description="Actionable advisory recommendation")

"""
risk.py — Risk prediction request/response schemas for NER-SHIELD API.

Backward-compatible extension of the original schema.
All new fields are Optional with defaults so existing clients continue to work.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Legacy request — preserved exactly for backward compatibility
# ---------------------------------------------------------------------------

class RiskPredictionRequest(BaseModel):
    district_id: Optional[str] = Field(None, description="District ID for localized assessment")
    road_id: Optional[str] = Field(None, description="Road ID for segment assessment")
    rainfall_mm: float = Field(0.0, ge=0.0, description="24-hour accumulated rainfall in mm")
    slope_degree: float = Field(15.0, ge=0.0, le=90.0, description="Terrain slope steepness in degrees")
    weather_condition: str = Field("CLEAR", description="CLEAR, RAIN, HEAVY_RAIN, FOG, THUNDERSTORM")
    soil_type: str = Field("LOAM", description="LOAM, CLAY, GRAVEL, ROCKY")
    historical_landslides_count: int = Field(0, ge=0, description="Historical incident count in area")
    active_incidents_count: int = Field(0, ge=0, description="Currently open incidents in vicinity")


# ---------------------------------------------------------------------------
# Enriched response — backward-compatible (all new fields optional or defaulted)
# ---------------------------------------------------------------------------

class RiskPredictionResponse(BaseModel):
    # ---- Original fields (preserved) ----
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="AI calculated risk probability 0.0-1.0")
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    risk_factors: List[str] = Field(..., description="Identified risk driver factors")
    confidence_score: float = Field(0.72, description="Prediction confidence score 0.0-1.0")
    recommendation: str = Field(..., description="Actionable advisory recommendation")
    model_version: str = Field("heuristic-v2", description="Version of the AI model/method used")
    calculated_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of prediction")

    # ---- New enriched fields ----
    method: Optional[str] = Field(None, description="trained_model | deterministic_heuristic | unavailable")
    data_mode: Optional[str] = Field(None, description="demo | live | degraded")
    source_status: Optional[str] = Field(None, description="live_provider_data | mixed_live_and_fallback | stale_live_data | heuristic_fallback | demo_synthetic_data | data_unavailable")
    stale: Optional[bool] = Field(None, description="True if any input exceeded freshness threshold")
    input_freshness_seconds: Optional[float] = Field(None, description="Age of oldest input in seconds")
    data_sources: Optional[List[str]] = Field(None, description="Active data source identifiers")
    road_id: Optional[str] = Field(None, description="Road ID this assessment covers")

    # ---- Route-ready fields (for routing branch) ----
    routing_recommendation: Optional[str] = Field(None, description="normal | caution | avoid_if_alternative | exclude_from_routing")
    suggested_status: Optional[str] = Field(None, description="GIS/AI suggested road status")
    route_eligible: Optional[bool] = Field(None, description="False if road should be excluded from routing")
    risk_penalty: Optional[float] = Field(None, ge=0.0, le=1.0, description="Routing cost penalty 0-1")
    affected_by_incident_ids: Optional[List[str]] = Field(None, description="Incident IDs affecting this road")
    incident_count: Optional[int] = Field(None, description="Number of active incidents in zone")
    highest_incident_severity: Optional[str] = Field(None, description="Highest severity incident")


# ---------------------------------------------------------------------------
# Road-level risk response (for GET /risk/road/{road_id})
# ---------------------------------------------------------------------------

class RiskRoadResponse(BaseModel):
    """Complete GIS-aware risk assessment for a specific road segment."""
    road_id: str = Field(..., description="Road segment ID")
    district_id: Optional[str] = Field(None, description="District context")

    # Risk core
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Risk score 0.0-1.0")
    risk_level: str = Field(..., description="LOW | MEDIUM | HIGH | CRITICAL")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in the assessment")
    reasons: List[str] = Field(..., description="Operational explanation of risk factors")
    recommendation: str = Field(..., description="Recommended action")

    # Method / provenance
    method: str = Field(..., description="trained_model | deterministic_heuristic | unavailable")
    model_version: str = Field(..., description="AI model/heuristic version used")
    calculated_at: str = Field(..., description="ISO timestamp of calculation")

    # Freshness / source
    input_freshness_seconds: Optional[float] = Field(None, description="Age of oldest input")
    data_sources: List[str] = Field(default_factory=list, description="Source identifiers")
    stale: bool = Field(False, description="Any input is stale")
    data_mode: str = Field("demo", description="demo | live | degraded")
    source_status: str = Field("demo_synthetic_data", description="Source status classification")

    # Route-ready fields (routing branch consumes these directly)
    routing_recommendation: str = Field(..., description="normal | caution | avoid_if_alternative | exclude_from_routing")
    suggested_status: Optional[str] = Field(None, description="warning | restricted | blocked")
    route_eligible: bool = Field(True, description="False if road should be excluded from routing")
    risk_penalty: float = Field(0.0, ge=0.0, le=1.0, description="Routing cost penalty 0-1")
    affected_by_incident_ids: List[str] = Field(default_factory=list)
    incident_count: int = Field(0, ge=0)
    highest_incident_severity: Optional[str] = Field(None)

    # ETA adjustment (optional, populated when distance_km is known)
    eta: Optional[Dict[str, Any]] = Field(None, description="ETA adjustment output if distance is provided")


# ---------------------------------------------------------------------------
# ETA-specific response schema
# ---------------------------------------------------------------------------

class ETADelayBreakdown(BaseModel):
    weather_delay_minutes: float = Field(0.0, ge=0.0)
    incident_delay_minutes: float = Field(0.0, ge=0.0)
    road_condition_delay_minutes: float = Field(0.0, ge=0.0)
    risk_buffer_minutes: float = Field(0.0, ge=0.0)


class ETAResponse(BaseModel):
    road_id: Optional[str] = None
    eta_minutes: Optional[float] = Field(None, ge=0.0)
    base_eta_minutes: Optional[float] = Field(None, ge=0.0)
    delay_minutes: Optional[float] = Field(None, ge=0.0)
    delay_breakdown: Optional[ETADelayBreakdown] = None
    method: str = "deterministic_heuristic"
    model_version: str = "eta-heuristic-v2"
    calculated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    input_freshness_seconds: Optional[float] = None
    stale: bool = False
    data_mode: str = "demo"
    source_status: str = "demo_synthetic_data"
    route_eligible: bool = True
    reason: Optional[str] = None

"""
risk_context.py — Canonical risk feature contract for NER-SHIELD AI inference.

This module defines the single validated feature container (RiskFeatureContext)
that all inference paths consume. It is assembled by risk_context_service.py
from provider/GIS/operational data, never constructed directly from raw HTTP inputs.

Design principles
-----------------
- All fields optional except road_id and data_mode.
- Validated ranges prevent silent bad values.
- Visible fallback defaults — no hidden synthetic substitution.
- Freshness/provenance fields preserved from upstream sources.
- No coordinate processing or GIS geometry work done here.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Source status classification
# ---------------------------------------------------------------------------

SOURCE_STATUS_VALUES = {
    "live_provider_data",       # all inputs from live verified providers
    "mixed_live_and_fallback",  # some live, some fallback/cached
    "stale_live_data",          # live but beyond freshness threshold
    "heuristic_fallback",       # provider unreachable, using last-known heuristic
    "demo_synthetic_data",      # DEMO_MODE=true deterministic seed data
    "data_unavailable",         # critical inputs missing, cannot calculate
}


# ---------------------------------------------------------------------------
# GIS Affected Road entry (reusing fields from hazard_buffer.identify_affected_roads)
# ---------------------------------------------------------------------------

class AffectedRoadContext(BaseModel):
    """
    One road affected by a nearby incident, as returned by GIS layer.
    Mirrors identify_affected_roads() output exactly — no re-computation here.
    """
    road_id: str
    distance_meters: float = Field(0.0, ge=0.0)
    impact_level: str = "medium"          # low | medium | high | critical
    suggested_status: str = "warning"     # warning | restricted | blocked
    suggested_risk_penalty: float = Field(0.0, ge=0.0, le=1.0)
    reason: str = ""

    model_config = {"extra": "ignore"}


# ---------------------------------------------------------------------------
# Canonical risk feature context
# ---------------------------------------------------------------------------

class RiskFeatureContext(BaseModel):
    """
    Canonical feature contract for disruption-risk inference.

    Assembled by risk_context_service.py from weather provider + GIS layer +
    operational store. Never constructed directly from raw API request bodies.

    All numeric fields are validated for legal ranges. Missing optional fields
    are None (not silently set to synthetic defaults).
    """

    # ---- Identification ----
    road_id: Optional[str] = Field(None, description="Road segment being assessed")
    district_id: Optional[str] = Field(None, description="District context for this assessment")
    data_mode: str = Field("demo", description="demo | live | degraded")

    # ---- Weather ----
    rainfall_mm_1h: Optional[float] = Field(None, ge=0.0, le=500.0, description="1-hour rainfall in mm")
    rainfall_mm_24h: Optional[float] = Field(None, ge=0.0, le=2000.0, description="24-hour accumulated rainfall in mm")
    precipitation_probability: Optional[float] = Field(None, ge=0.0, le=1.0, description="Precipitation probability 0-1")
    weather_code: Optional[str] = Field(None, description="Normalized weather condition code")
    weather_condition: Optional[str] = Field(None, description="CLEAR|RAIN|HEAVY_RAIN|FOG|THUNDERSTORM")
    wind_speed_kmh: Optional[float] = Field(None, ge=0.0, le=300.0, description="Wind speed in km/h")
    visibility_m: Optional[float] = Field(None, ge=0.0, le=100000.0, description="Visibility in meters")
    temperature_c: Optional[float] = Field(None, ge=-50.0, le=60.0, description="Temperature in Celsius")
    weather_warning_level: Optional[str] = Field(None, description="NONE|WATCH|WARNING|EXTREME")

    # ---- Road state ----
    road_status: Optional[str] = Field(None, description="OPEN|DISRUPTED|BLOCKED|CLOSED")
    road_condition: Optional[str] = Field(None, description="EXCELLENT|GOOD|FAIR|POOR|SEVERE_DAMAGE")
    road_class: Optional[str] = Field(None, description="NH|SH|MDR|ODR")
    current_risk_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Existing road risk score")
    road_length_km: Optional[float] = Field(None, ge=0.0, description="Road length in km")
    traffic_congestion_proxy: Optional[float] = Field(None, ge=0.0, le=1.0, description="Traffic proxy 0=clear, 1=gridlock")

    # ---- Incident / GIS ----
    active_incident_count: int = Field(0, ge=0, description="Number of active incidents in zone")
    incident_type: Optional[str] = Field(None, description="landslide|flood|road_block|bridge_damage|accident")
    incident_severity: Optional[str] = Field(None, description="minor|low|medium|moderate|high|severe|critical")
    incident_proximity_meters: Optional[float] = Field(None, ge=0.0, description="Distance to nearest incident in meters")
    road_match_distance_meters: Optional[float] = Field(None, ge=0.0, description="Distance from incident to road (GIS)")
    match_method: Optional[str] = Field(None, description="GIS road matching method used")
    affected_road_ids: List[str] = Field(default_factory=list, description="Road IDs in hazard impact zone")
    affected_road_count: int = Field(0, ge=0, description="Count of affected roads")
    affected_roads: List[AffectedRoadContext] = Field(default_factory=list, description="GIS affected road details")
    impact_level: Optional[str] = Field(None, description="GIS hazard impact level: low|medium|high|critical")
    suggested_status: Optional[str] = Field(None, description="GIS suggested road status: warning|restricted|blocked")
    suggested_risk_penalty: Optional[float] = Field(None, ge=0.0, le=1.0, description="GIS suggested risk penalty 0-1")
    hazard_radius_km: Optional[float] = Field(None, ge=0.0, description="GIS hazard influence radius in km")
    impact_method: Optional[str] = Field(None, description="GIS impact calculation method")
    affected_by_incident_ids: List[str] = Field(default_factory=list, description="Incident IDs affecting this road")
    highest_incident_severity: Optional[str] = Field(None, description="Highest severity among nearby incidents")

    # ---- Terrain / district ----
    slope_degree: Optional[float] = Field(None, ge=0.0, le=90.0, description="Terrain slope in degrees (from GIS if available)")
    soil_type: Optional[str] = Field(None, description="GRAVEL|LOAM|CLAY|ROCKY — from GIS terrain data only")

    # ---- Freshness / provenance ----
    weather_freshness_seconds: Optional[float] = Field(None, ge=0.0, description="Age of weather observation in seconds")
    road_state_freshness_seconds: Optional[float] = Field(None, ge=0.0, description="Age of road state data in seconds")
    incident_freshness_seconds: Optional[float] = Field(None, ge=0.0, description="Age of incident data in seconds")
    observation_age_minutes: Optional[float] = Field(None, ge=0.0, description="Age of primary observation in minutes")
    source_reliability: Optional[float] = Field(None, ge=0.0, le=1.0, description="Composite source reliability 0-1")
    weather_stale: bool = Field(False, description="Weather data beyond freshness threshold")
    road_state_stale: bool = Field(False, description="Road state data beyond freshness threshold")
    incident_stale: bool = Field(False, description="Incident data beyond freshness threshold")
    source_status: str = Field("demo_synthetic_data", description="live_provider_data|mixed_live_and_fallback|stale_live_data|heuristic_fallback|demo_synthetic_data|data_unavailable")
    weather_source: Optional[str] = Field(None, description="Weather provider name")
    observed_at: Optional[datetime] = Field(None, description="Primary observation timestamp")
    assembled_at: Optional[datetime] = Field(None, description="When this feature context was assembled")

    # ---- Extra passthrough for caller metadata ----
    raw_metadata: Optional[Dict[str, Any]] = Field(None, description="Non-inference metadata passthrough (not used in scoring)")

    model_config = {"extra": "ignore"}

    @field_validator("source_status")
    @classmethod
    def _validate_source_status(cls, v: str) -> str:
        if v not in SOURCE_STATUS_VALUES:
            # Don't crash — just normalize to a safe fallback
            return "data_unavailable"
        return v

    @field_validator("rainfall_mm_24h", "rainfall_mm_1h", mode="before")
    @classmethod
    def _coerce_rainfall(cls, v):
        if v is None:
            return None
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    def is_stale(self) -> bool:
        """True if any primary input is stale."""
        return self.weather_stale or self.road_state_stale or self.incident_stale

    def effective_rainfall_mm(self) -> float:
        """Return best available rainfall figure (24h preferred)."""
        if self.rainfall_mm_24h is not None:
            return self.rainfall_mm_24h
        if self.rainfall_mm_1h is not None:
            return self.rainfall_mm_1h * 4.0  # rough 24h extrapolation
        return 0.0

    def effective_weather_condition(self) -> str:
        """Return normalized weather condition string."""
        cond = self.weather_condition or self.weather_code or "CLEAR"
        return cond.upper()

    def has_critical_incident(self) -> bool:
        """True if a critical or high-severity GIS incident directly affects this road."""
        sev = (self.incident_severity or "").lower()
        return sev in ("critical", "high", "severe")

    def is_road_blocked(self) -> bool:
        """True if road status or GIS suggested status indicates blockage."""
        road_blocked = (self.road_status or "").upper() in ("BLOCKED", "CLOSED")
        gis_blocked = (self.suggested_status or "").lower() == "blocked"
        return road_blocked or gis_blocked

    def summary(self) -> Dict[str, Any]:
        """Human-readable summary for logs (no secrets)."""
        return {
            "road_id": self.road_id,
            "data_mode": self.data_mode,
            "source_status": self.source_status,
            "weather_condition": self.effective_weather_condition(),
            "rainfall_mm_24h": self.rainfall_mm_24h,
            "road_status": self.road_status,
            "active_incident_count": self.active_incident_count,
            "impact_level": self.impact_level,
            "suggested_status": self.suggested_status,
            "stale": self.is_stale(),
        }

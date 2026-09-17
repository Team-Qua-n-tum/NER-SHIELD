"""
temporal_context.py — Time-window feature container for road-segment prediction.

Defines:
- SegmentTimePoint: historical observation snapshot for a road segment.
- RoadSegmentTemporalContext: wraps current RiskFeatureContext, historical window
  observations, and prediction horizon.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from backend.ai.risk.risk_context import RiskFeatureContext


class SegmentTimePoint(BaseModel):
    """
    Historical observation snapshot for a road segment at step t-k.
    """
    timestamp: Optional[datetime] = Field(None, description="Observation timestamp")
    rainfall_mm_1h: Optional[float] = Field(None, ge=0.0, le=500.0, description="1h rainfall in mm")
    rainfall_mm_24h: Optional[float] = Field(None, ge=0.0, le=2000.0, description="24h accumulated rainfall in mm")
    speed_kmh: Optional[float] = Field(None, ge=0.0, le=200.0, description="Observed traffic speed")
    road_status: Optional[str] = Field(None, description="OPEN|DISRUPTED|BLOCKED|CLOSED")
    active_incident_count: int = Field(0, ge=0, description="Active incidents count in area")
    suggested_risk_penalty: Optional[float] = Field(None, ge=0.0, le=1.0, description="GIS risk penalty at time")
    traffic_congestion_proxy: Optional[float] = Field(None, ge=0.0, le=1.0, description="0=free, 1=gridlock")

    model_config = {"extra": "ignore"}


class RoadSegmentTemporalContext(BaseModel):
    """
    Input contract for temporal road-segment future prediction.
    Combines the canonical RiskFeatureContext with a sequence of historical
    time-window observations and the requested future prediction horizon.
    """
    road_id: str = Field(..., description="Road segment identifier")
    district_id: Optional[str] = Field(None, description="District ID")
    current_context: RiskFeatureContext = Field(..., description="Current RiskFeatureContext snapshot")
    prediction_horizon_minutes: int = Field(60, ge=5, le=1440, description="Target future horizon in minutes")
    historical_points: List[SegmentTimePoint] = Field(
        default_factory=list,
        description="Chronologically ordered observations (oldest to newest: t-N ... t-1)",
    )

    model_config = {"extra": "ignore"}

    def has_historical_data(self) -> bool:
        """Return True if at least one historical time point is provided."""
        return len(self.historical_points) > 0

    def rainfall_trend_rate(self) -> float:
        """
        Estimate the rate of rainfall change (mm/hr delta) over the window.
        Positive = rainfall is accelerating / intensifying.
        Negative = rainfall is subsiding.
        Zero = steady or no history.
        """
        if len(self.historical_points) < 1:
            return 0.0

        current_rain = self.current_context.effective_rainfall_mm()
        # Look at the most recent historical point
        prev = self.historical_points[-1]
        prev_rain = prev.rainfall_mm_1h if prev.rainfall_mm_1h is not None else (
            prev.rainfall_mm_24h / 24.0 if prev.rainfall_mm_24h is not None else 0.0
        )
        return round(current_rain - prev_rain, 2)

    def speed_drop_ratio(self) -> float:
        """
        Estimate relative speed drop over the window in [0.0, 1.0].
        0.0 = speed maintained or increased; 1.0 = traffic dropped to 0 km/h.
        """
        if len(self.historical_points) < 1:
            return 0.0

        prev = self.historical_points[-1]
        if prev.speed_kmh is None or prev.speed_kmh <= 0.0:
            return 0.0

        current_speed_proxy = 45.0  # default baseline speed
        if self.current_context.road_status == "BLOCKED":
            current_speed = 0.0
        elif self.current_context.road_status == "DISRUPTED":
            current_speed = prev.speed_kmh * 0.4
        else:
            current_speed = prev.speed_kmh

        drop = max(0.0, (prev.speed_kmh - current_speed) / prev.speed_kmh)
        return round(min(1.0, drop), 3)

    def incident_delta(self) -> int:
        """
        Delta in active incident count over window.
        Positive = incidents escalating.
        """
        if len(self.historical_points) < 1:
            return 0
        prev = self.historical_points[-1]
        return max(0, self.current_context.active_incident_count - prev.active_incident_count)

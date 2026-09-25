"""
features.py — Feature schema and normalisation helpers for the risk model.

Centralises all feature bounds, defaults, and encoding logic so that
both the training pipeline and the inference endpoint stay in sync.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional

# ---------------------------------------------------------------------------
# Feature schema
# ---------------------------------------------------------------------------

WEATHER_CONDITION_MAP: Dict[str, int] = {
    "CLEAR": 0,
    "RAIN": 1,
    "HEAVY_RAIN": 2,
    "FOG": 3,
    "THUNDERSTORM": 3,
}

SOIL_TYPE_MAP: Dict[str, float] = {
    "ROCKY": 0.1,
    "GRAVEL": 0.3,
    "LOAM": 0.6,
    "CLAY": 1.0,
}


@dataclass
class RiskFeatureSchema:
    """
    Describes the valid range, default, and encoding for each risk feature.
    """

    @dataclass
    class _FeatureDef:
        name: str
        min_val: float
        max_val: float
        default: float
        description: str

    features: list = field(default_factory=lambda: [
        RiskFeatureSchema._FeatureDef("rainfall_mm", 0.0, 1500.0, 0.0, "24-hour rainfall accumulation"),
        RiskFeatureSchema._FeatureDef("slope_degree", 0.0, 90.0, 15.0, "Terrain slope in degrees"),
        RiskFeatureSchema._FeatureDef("historical_landslides_count", 0, 100, 0, "Incidents in past 30 days"),
        RiskFeatureSchema._FeatureDef("active_incidents_count", 0, 50, 0, "Active open incidents nearby"),
    ])


RISK_FEATURE_SCHEMA = RiskFeatureSchema()


# ---------------------------------------------------------------------------
# Normalisation helpers
# ---------------------------------------------------------------------------


def normalize_rainfall(mm: float) -> float:
    """Scale rainfall to 0–1 using 200mm as the extreme threshold."""
    return min(1.0, max(0.0, mm / 200.0))


def classify_weather(condition: str) -> int:
    """Encode weather condition as integer (0=clear, 3=storm)."""
    return WEATHER_CONDITION_MAP.get(condition.upper(), 0)


def encode_soil_risk(soil_type: str) -> float:
    """Encode soil type as a fractional risk contribution (0=low, 1=high)."""
    return SOIL_TYPE_MAP.get(soil_type.upper(), 0.5)


def normalize_slope(degrees: float) -> float:
    """Scale slope angle to 0–1 using 45° as the critical threshold."""
    return min(1.0, max(0.0, degrees / 45.0))


def extract_features_from_request(request_dict: Dict[str, Any]) -> Dict[str, float]:
    """
    Build a normalised feature dict from a RiskPredictionRequest dict.
    Returns numeric values ready for the weighted risk model.
    """
    rainfall = float(request_dict.get("rainfall_mm", 0.0))
    slope = float(request_dict.get("slope_degree", 15.0))
    weather = str(request_dict.get("weather_condition", "CLEAR"))
    soil = str(request_dict.get("soil_type", "LOAM"))
    hist = int(request_dict.get("historical_landslides_count", 0))
    active = int(request_dict.get("active_incidents_count", 0))

    return {
        "rainfall_norm": normalize_rainfall(rainfall),
        "slope_norm": normalize_slope(slope),
        "weather_code": classify_weather(weather),
        "soil_risk": encode_soil_risk(soil),
        "historical_risk": min(1.0, hist / 10.0),
        "active_incident_risk": min(1.0, active / 5.0),
    }

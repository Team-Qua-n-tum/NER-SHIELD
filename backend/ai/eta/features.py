"""
features.py — ETA feature schema and normalisation for the ETA prediction model.
"""

from __future__ import annotations

from typing import Any, Dict

# ---------------------------------------------------------------------------
# Road condition encoding
# ---------------------------------------------------------------------------

ROAD_CONDITION_SPEED_FACTOR: Dict[str, float] = {
    "EXCELLENT": 1.00,
    "GOOD": 0.85,
    "FAIR": 0.70,
    "POOR": 0.50,
    "SEVERE_DAMAGE": 0.30,
}

WEATHER_SPEED_FACTOR: Dict[str, float] = {
    "CLEAR": 1.00,
    "RAIN": 0.85,
    "HEAVY_RAIN": 0.65,
    "FOG": 0.70,
    "THUNDERSTORM": 0.55,
}

# Average NER road speed (km/h) under normal conditions
BASE_SPEED_KMH = 45.0


# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------


def build_eta_features(
    distance_km: float,
    road_condition: str = "GOOD",
    weather_condition: str = "CLEAR",
    rainfall_mm: float = 0.0,
    disruption_risk: float = 0.0,
    incident_delay_hrs: float = 0.0,
) -> Dict[str, float]:
    """
    Produce a normalised feature dict for ETA computation.

    Returns
    -------
    dict with keys: distance_km, effective_speed_kmh, disruption_buffer_hrs, incident_delay_hrs
    """
    condition_factor = ROAD_CONDITION_SPEED_FACTOR.get(road_condition.upper(), 0.85)
    weather_factor = WEATHER_SPEED_FACTOR.get(weather_condition.upper(), 1.00)

    # Additional rainfall slow-down (0% at 0mm → 20% at 200mm)
    rainfall_factor = 1.0 - min(0.20, rainfall_mm / 1000.0)

    effective_speed = BASE_SPEED_KMH * condition_factor * weather_factor * rainfall_factor

    # Disruption risk buffer: adds 0–40% extra travel time
    disruption_buffer_hrs = (distance_km / effective_speed) * (disruption_risk ** 1.5) * 0.40

    return {
        "distance_km": distance_km,
        "effective_speed_kmh": round(max(5.0, effective_speed), 2),
        "disruption_buffer_hrs": round(disruption_buffer_hrs, 3),
        "incident_delay_hrs": round(incident_delay_hrs, 3),
    }

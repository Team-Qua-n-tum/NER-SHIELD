"""
gis_eta_engine.py — GIS-aware ETA estimation for NER-SHIELD.

Computes ETA adjustments from an assembled RiskFeatureContext. Produces
an operationally-understandable delay breakdown suitable for the routing branch.

Rules
-----
- ETA must remain positive (minimum 0.1 minutes) for eligible routes.
- A blocked road is not given an ETA — returns route_eligible=False.
- No routing/pathfinding logic is performed here.
- Traffic proxy only used if genuinely available in context.
- Delay breakdown must be internally consistent (sum = delay_minutes).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import numpy as np

from backend.ai.risk.risk_context import RiskFeatureContext

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MODEL_VERSION_HEURISTIC = "eta-heuristic-v2"

# Base NER road speed under normal conditions (km/h)
BASE_SPEED_KMH = 45.0

# Road condition speed factors
ROAD_CONDITION_SPEED_FACTOR: Dict[str, float] = {
    "EXCELLENT": 1.00,
    "GOOD": 0.85,
    "FAIR": 0.70,
    "POOR": 0.50,
    "SEVERE_DAMAGE": 0.30,
}

# Road status speed factors
ROAD_STATUS_SPEED_FACTOR: Dict[str, float] = {
    "OPEN": 1.00,
    "DISRUPTED": 0.50,
    "IN_PROGRESS": 0.60,
    "BLOCKED": 0.0,    # not eligible
    "CLOSED": 0.0,     # not eligible
}

# Weather condition speed factors
WEATHER_SPEED_FACTOR: Dict[str, float] = {
    "CLEAR": 1.00,
    "FOG": 0.70,
    "RAIN": 0.85,
    "HEAVY_RAIN": 0.60,
    "THUNDERSTORM": 0.50,
}


# ---------------------------------------------------------------------------
# Delay component calculation
# ---------------------------------------------------------------------------

def _weather_delay_minutes(
    distance_km: float,
    base_speed: float,
    rainfall_mm: float,
    weather_condition: str,
) -> float:
    """
    Additional delay caused by weather (compared to CLEAR baseline).
    Returns delay in minutes.
    """
    clear_speed = BASE_SPEED_KMH
    weather_factor = WEATHER_SPEED_FACTOR.get(weather_condition, 1.0)
    # Rainfall additional slow-down: 0% at 0mm → 20% at 200mm
    rainfall_factor = 1.0 - min(0.20, rainfall_mm / 1000.0)
    actual_speed = max(5.0, base_speed * weather_factor * rainfall_factor)

    if clear_speed <= 0 or actual_speed <= 0 or distance_km <= 0:
        return 0.0

    base_hrs = distance_km / clear_speed
    actual_hrs = distance_km / actual_speed
    delay_hrs = max(0.0, actual_hrs - base_hrs)
    return round(delay_hrs * 60.0, 2)


def _incident_delay_minutes(
    incident_severity: Optional[str],
    suggested_risk_penalty: Optional[float],
    active_incident_count: int,
) -> float:
    """
    Delay caused by active incidents on or near the road.
    Uses GIS suggested_risk_penalty as primary input.
    Returns delay in minutes.
    """
    if active_incident_count == 0:
        return 0.0

    penalty = suggested_risk_penalty or 0.0

    # Severity-based floor if penalty is low but incident is severe
    sev = (incident_severity or "").lower()
    sev_floor = {
        "critical": 0.90, "high": 0.70, "severe": 0.70,
        "moderate": 0.40, "medium": 0.40, "low": 0.20, "minor": 0.15,
    }
    floor = sev_floor.get(sev, 0.20)
    effective_penalty = max(penalty, floor)

    # Delay: up to 45 minutes for maximum penalty
    delay_minutes = effective_penalty * 45.0

    # Scale by count (diminishing returns: each additional incident adds half the weight)
    if active_incident_count > 1:
        delay_minutes *= (1.0 + 0.3 * min(3, active_incident_count - 1))

    return round(min(120.0, delay_minutes), 2)


def _road_condition_delay_minutes(
    distance_km: float,
    road_condition: Optional[str],
    base_speed: float,
) -> float:
    """
    Additional delay from degraded road conditions vs GOOD baseline.
    Returns delay in minutes.
    """
    good_speed = base_speed * ROAD_CONDITION_SPEED_FACTOR.get("GOOD", 0.85)
    condition = (road_condition or "GOOD").upper()
    cond_factor = ROAD_CONDITION_SPEED_FACTOR.get(condition, 0.85)
    actual_speed = max(5.0, base_speed * cond_factor)

    if good_speed <= 0 or distance_km <= 0:
        return 0.0

    base_hrs = distance_km / good_speed
    actual_hrs = distance_km / actual_speed
    delay_hrs = max(0.0, actual_hrs - base_hrs)
    return round(delay_hrs * 60.0, 2)


def _risk_buffer_minutes(
    risk_score: float,
    distance_km: float,
    base_speed: float,
) -> float:
    """
    Precautionary buffer for overall disruption risk (e.g., slow unexpected stops).
    Adds 0–40% extra time for risk scores 0–1.
    Returns delay in minutes.
    """
    if base_speed <= 0 or distance_km <= 0:
        return 0.0
    base_travel_hrs = distance_km / base_speed
    buffer_hrs = base_travel_hrs * (risk_score ** 1.5) * 0.40
    return round(buffer_hrs * 60.0, 2)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_eta(
    ctx: RiskFeatureContext,
    distance_km: float,
    risk_score: float = 0.0,
) -> Dict[str, Any]:
    """
    Calculate ETA adjustment for a route segment using assembled context.

    Parameters
    ----------
    ctx          : RiskFeatureContext — assembled operational context.
    distance_km  : Route or segment distance in km.
    risk_score   : Overall risk score from gis_risk_engine (0–1).

    Returns
    -------
    dict with:
        eta_minutes, base_eta_minutes, delay_minutes, delay_breakdown,
        method, model_version, calculated_at, input_freshness_seconds,
        stale, data_mode, source_status, route_eligible.
    """
    calculated_at = datetime.now(timezone.utc).isoformat()

    freshness_values = [
        v for v in [
            ctx.weather_freshness_seconds,
            ctx.road_state_freshness_seconds,
            ctx.incident_freshness_seconds,
        ]
        if v is not None
    ]
    input_freshness_seconds = round(max(freshness_values), 1) if freshness_values else None

    # Guard: blocked road → not route eligible
    if ctx.is_road_blocked():
        return {
            "eta_minutes": None,
            "base_eta_minutes": None,
            "delay_minutes": None,
            "delay_breakdown": None,
            "method": "deterministic_heuristic",
            "model_version": MODEL_VERSION_HEURISTIC,
            "calculated_at": calculated_at,
            "input_freshness_seconds": input_freshness_seconds,
            "stale": ctx.is_stale(),
            "data_mode": ctx.data_mode,
            "source_status": ctx.source_status,
            "route_eligible": False,
            "road_id": ctx.road_id,
            "reason": "Route ineligible — road is blocked or closed.",
        }

    if distance_km <= 0:
        return {
            "eta_minutes": 0.0,
            "base_eta_minutes": 0.0,
            "delay_minutes": 0.0,
            "delay_breakdown": {
                "weather_delay_minutes": 0.0,
                "incident_delay_minutes": 0.0,
                "road_condition_delay_minutes": 0.0,
                "risk_buffer_minutes": 0.0,
            },
            "method": "deterministic_heuristic",
            "model_version": MODEL_VERSION_HEURISTIC,
            "calculated_at": calculated_at,
            "input_freshness_seconds": input_freshness_seconds,
            "stale": ctx.is_stale(),
            "data_mode": ctx.data_mode,
            "source_status": ctx.source_status,
            "route_eligible": True,
            "road_id": ctx.road_id,
        }

    # ------------------------------------------------------------------
    # Effective speed calculation
    # ------------------------------------------------------------------
    road_condition = (ctx.road_condition or "GOOD").upper()
    weather_condition = ctx.effective_weather_condition()
    rainfall_mm = ctx.effective_rainfall_mm()

    # Status factor (blended with condition)
    rs = (ctx.road_status or "OPEN").upper()
    status_factor = ROAD_STATUS_SPEED_FACTOR.get(rs, 1.0)

    cond_factor = ROAD_CONDITION_SPEED_FACTOR.get(road_condition, 0.85)
    weather_factor = WEATHER_SPEED_FACTOR.get(weather_condition, 1.0)
    rainfall_factor = 1.0 - min(0.20, rainfall_mm / 1000.0)

    effective_speed = max(5.0, BASE_SPEED_KMH * cond_factor * weather_factor * rainfall_factor * status_factor)
    base_speed = max(5.0, BASE_SPEED_KMH * cond_factor)  # without weather

    # ------------------------------------------------------------------
    # Base ETA
    # ------------------------------------------------------------------
    base_eta_hrs = distance_km / effective_speed
    base_eta_minutes = round(base_eta_hrs * 60.0, 1)

    # ------------------------------------------------------------------
    # Delay components
    # ------------------------------------------------------------------
    weather_delay = _weather_delay_minutes(distance_km, base_speed, rainfall_mm, weather_condition)
    incident_delay = _incident_delay_minutes(
        ctx.incident_severity,
        ctx.suggested_risk_penalty,
        ctx.active_incident_count,
    )
    road_cond_delay = _road_condition_delay_minutes(distance_km, road_condition, BASE_SPEED_KMH)
    risk_buffer = _risk_buffer_minutes(risk_score, distance_km, base_speed)

    total_delay = round(weather_delay + incident_delay + road_cond_delay + risk_buffer, 1)

    eta_minutes = round(max(0.1, base_eta_minutes + total_delay), 1)

    # ------------------------------------------------------------------
    # Method label
    # ------------------------------------------------------------------
    # Attempt ML-backed ETA if model is available
    method = "deterministic_heuristic"
    model_version = MODEL_VERSION_HEURISTIC

    try:
        from backend.ai.eta.predictor import eta_predictor  # noqa: PLC0415
        if eta_predictor._model is not None:
            ml_result = eta_predictor.predict(
                distance_km=distance_km,
                road_condition=road_condition,
                weather_condition=weather_condition,
                rainfall_mm=rainfall_mm,
                disruption_risk=risk_score,
                incident_delay_hrs=incident_delay / 60.0,
            )
            if ml_result.get("method") == "ml":
                eta_minutes = round(max(0.1, ml_result["eta_hrs"] * 60.0), 1)
                method = "trained_model"
                model_version = ml_result.get("model_version", "ml-eta")
    except Exception as exc:
        logger.debug("[GISETAEngine] ML ETA fallback: %s", exc)

    return {
        "eta_minutes": eta_minutes,
        "base_eta_minutes": base_eta_minutes,
        "delay_minutes": total_delay,
        "delay_breakdown": {
            "weather_delay_minutes": weather_delay,
            "incident_delay_minutes": incident_delay,
            "road_condition_delay_minutes": road_cond_delay,
            "risk_buffer_minutes": risk_buffer,
        },
        "method": method,
        "model_version": model_version,
        "calculated_at": calculated_at,
        "input_freshness_seconds": input_freshness_seconds,
        "stale": ctx.is_stale(),
        "data_mode": ctx.data_mode,
        "source_status": ctx.source_status,
        "route_eligible": True,
        "road_id": ctx.road_id,
    }

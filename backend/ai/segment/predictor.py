"""
predictor.py — Future road-segment disruption and travel-time delay prediction engine.

Predicts future disruption probability, road closure probability, future travel speed,
and travel-time delay over a target horizon (e.g. 30m, 60m, 120m, 240m).

Routing Engine Authority:
Does NOT generate routes. Outputs are structured so the routing engine
can directly ingest them as edge cost, risk, and traversability constraints.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import numpy as np

from backend.ai.risk.risk_context import RiskFeatureContext
from backend.ai.segment.loader import SegmentModelLoader
from backend.ai.segment.model import extract_segment_features
from backend.ai.segment.temporal_context import RoadSegmentTemporalContext

logger = logging.getLogger(__name__)

# Standard design speed limits by road class (NER mountainous terrain calibration)
ROAD_CLASS_SPEED_LIMITS: Dict[str, float] = {
    "NH": 60.0,
    "SH": 50.0,
    "MDR": 40.0,
    "ODR": 30.0,
}
DEFAULT_SPEED_LIMIT_KMH = 45.0


def _get_baseline_speed_limit(ctx: RiskFeatureContext) -> float:
    """Determine baseline speed limit from road class."""
    rc = (ctx.road_class or "").upper()
    return ROAD_CLASS_SPEED_LIMITS.get(rc, DEFAULT_SPEED_LIMIT_KMH)


def _compute_confidence(temporal_ctx: RoadSegmentTemporalContext, is_ml: bool) -> float:
    """
    Compute prediction confidence score in [0.20, 0.95].
    Penalized by stale data, missing historical window, or extended prediction horizon.
    """
    base = 0.85 if is_ml else 0.70
    reduction = 0.0

    curr = temporal_ctx.current_context

    if curr.weather_stale or curr.rainfall_mm_24h is None:
        reduction += 0.12
    if curr.incident_stale:
        reduction += 0.08
    if not temporal_ctx.has_historical_data():
        reduction += 0.05
    if temporal_ctx.prediction_horizon_minutes > 120:
        reduction += 0.06
    elif temporal_ctx.prediction_horizon_minutes > 60:
        reduction += 0.03
    if curr.source_status in ("heuristic_fallback", "data_unavailable"):
        reduction += 0.15

    return round(float(np.clip(base - reduction, 0.20, 0.95)), 3)


def _heuristic_future_prediction(
    temporal_ctx: RoadSegmentTemporalContext,
    speed_limit: float,
) -> Dict[str, float]:
    """
    Deterministic future projection when deep-learning model artifact is unavailable.
    Scales current risk forward using rain trend and horizon duration.
    """
    curr = temporal_ctx.current_context
    horizon_hours = temporal_ctx.prediction_horizon_minutes / 60.0

    # Base factors
    rain_24h = curr.effective_rainfall_mm()
    rain_factor = min(1.0, rain_24h / 200.0)

    wc = curr.effective_weather_condition()
    wc_map = {"CLEAR": 0.0, "FOG": 0.25, "RAIN": 0.45, "HEAVY_RAIN": 0.80, "THUNDERSTORM": 0.95}
    weather_factor = wc_map.get(wc, 0.2)

    gis_penalty = float(curr.suggested_risk_penalty or 0.0)

    rs = (curr.road_status or "OPEN").upper()
    rs_penalties = {"OPEN": 0.0, "IN_PROGRESS": 0.35, "DISRUPTED": 0.65, "BLOCKED": 1.0, "CLOSED": 1.0}
    road_penalty = rs_penalties.get(rs, 0.0)

    # Base disruption score
    base_score = (
        0.26 * rain_factor +
        0.14 * weather_factor +
        0.32 * gis_penalty +
        0.20 * road_penalty +
        0.08 * min(1.0, curr.active_incident_count * 0.15)
    )

    # Trend adjustment from historical observations
    trend_rate = temporal_ctx.rainfall_trend_rate()
    if trend_rate > 5.0:
        # Rain accelerating
        base_score += min(0.15, (trend_rate / 20.0) * 0.15)
    elif trend_rate < -5.0:
        # Rain subsiding
        base_score = max(0.0, base_score - 0.08)

    # Horizon escalation: farther horizons compound worsening conditions
    escalation = 1.0 + 0.12 * min(4.0, horizon_hours)
    future_disruption = round(float(np.clip(base_score * escalation, 0.0, 1.0)), 4)

    # Closure probability
    if rs in ("BLOCKED", "CLOSED"):
        closure_prob = 0.99
    elif future_disruption >= 0.75:
        closure_prob = round(float(np.clip((future_disruption - 0.50) * 1.8, 0.0, 0.95)), 4)
    else:
        closure_prob = round(float(np.clip(future_disruption * 0.15, 0.0, 0.30)), 4)

    # Speed & delay
    if rs in ("BLOCKED", "CLOSED") or closure_prob >= 0.95:
        speed_ratio = 0.0
        predicted_speed = 0.0
        delay_minutes = round(60.0 * (1.0 + horizon_hours), 2)
        eta_mult = 999.0
    else:
        speed_ratio = round(float(np.clip(1.0 - (0.65 * future_disruption + 0.15 * road_penalty), 0.10, 1.0)), 4)
        predicted_speed = round(speed_limit * speed_ratio, 2)
        base_delay = 35.0 * future_disruption * (1.0 + 0.15 * horizon_hours)
        delay_minutes = round(max(0.0, base_delay), 2)
        eta_mult = round(float(np.clip(1.0 / speed_ratio, 1.0, 10.0)), 3)

    return {
        "disruption_probability": future_disruption,
        "closure_probability": closure_prob,
        "speed_ratio": speed_ratio,
        "predicted_speed_kmh": predicted_speed,
        "delay_minutes": delay_minutes,
        "eta_multiplier": eta_mult,
    }


def predict_segment_future(temporal_ctx: RoadSegmentTemporalContext) -> Dict[str, Any]:
    """
    Main entry point: Predict future road-segment disruption probability,
    closure probability, future speed, and travel-time delay.

    Execution Flow:
    1. Attempts deep learning model via SegmentModelLoader.
    2. If missing or unloadable, safely falls back to deterministic heuristic.
    3. Guarantees zero request-time training.
    4. Labels synthetic prototype outputs as 'prototype/synthetic-trained'.
    """
    calculated_at = datetime.now(timezone.utc).isoformat()
    curr = temporal_ctx.current_context
    speed_limit = _get_baseline_speed_limit(curr)

    # Attempt neural model inference
    model = SegmentModelLoader.get_model()

    if model is not None:
        try:
            features = extract_segment_features(temporal_ctx)
            raw_out = model.predict_outputs(features)

            p_disruption = raw_out["disruption_probability"]
            p_closure = raw_out["closure_probability"]
            speed_ratio = raw_out["speed_ratio"]
            delay_min = raw_out["delay_minutes"]

            # If road is currently BLOCKED, override closure & speed safely
            rs = (curr.road_status or "OPEN").upper()
            if rs in ("BLOCKED", "CLOSED"):
                p_disruption = max(p_disruption, 0.98)
                p_closure = max(p_closure, 0.98)
                speed_ratio = 0.0
                pred_speed = 0.0
                eta_mult = 999.0
            else:
                pred_speed = round(float(speed_limit * speed_ratio), 2)
                eta_mult = round(float(np.clip(1.0 / max(0.05, speed_ratio), 1.0, 10.0)), 3)

            confidence = _compute_confidence(temporal_ctx, is_ml=True)
            method = "prototype/synthetic-trained"
            model_version = "segment-dl-v1"

        except Exception as exc:
            logger.warning("[SegmentPredictor] ML inference failed: %s — using heuristic.", exc)
            heur = _heuristic_future_prediction(temporal_ctx, speed_limit)
            p_disruption = heur["disruption_probability"]
            p_closure = heur["closure_probability"]
            pred_speed = heur["predicted_speed_kmh"]
            delay_min = heur["delay_minutes"]
            eta_mult = heur["eta_multiplier"]
            confidence = _compute_confidence(temporal_ctx, is_ml=False)
            method = "deterministic_heuristic"
            model_version = "segment-heuristic-v1"
    else:
        # Fallback to deterministic heuristic
        heur = _heuristic_future_prediction(temporal_ctx, speed_limit)
        p_disruption = heur["disruption_probability"]
        p_closure = heur["closure_probability"]
        pred_speed = heur["predicted_speed_kmh"]
        delay_min = heur["delay_minutes"]
        eta_mult = heur["eta_multiplier"]
        confidence = _compute_confidence(temporal_ctx, is_ml=False)
        method = "deterministic_heuristic"
        model_version = "segment-heuristic-v1"

    is_stale = bool(curr.weather_stale or curr.incident_stale or curr.road_state_stale)

    return {
        "road_id": temporal_ctx.road_id,
        "predicted_disruption_probability": p_disruption,
        "closure_probability": p_closure,
        "predicted_delay_minutes": delay_min,
        "predicted_speed_kmh": pred_speed,
        "eta_multiplier": eta_mult,
        "prediction_confidence": confidence,
        "prediction_horizon_minutes": temporal_ctx.prediction_horizon_minutes,
        "method": method,
        "model_version": model_version,
        "calculated_at": calculated_at,
        "stale": is_stale,
        "data_mode": curr.data_mode,
    }


# ---------------------------------------------------------------------------
# Routing Engine Bridge Helper
# ---------------------------------------------------------------------------

def to_routing_edge_cost(
    prediction: Dict[str, Any],
    base_distance_km: float,
    speed_limit_kmh: Optional[float] = None,
    current_status: str = "OPEN",
) -> Dict[str, Any]:
    """
    Bridge segment prediction output into routing edge parameters.
    The routing engine remains the authority and uses these as graph edge updates.

    Returns:
    --------
    dict with:
      - disruption_risk: float in [0.0, 1.0]
      - effective_speed_kmh: float > 0
      - traversable: bool
      - suggested_status: str (OPEN, RESTRICTED, BLOCKED)
      - adjusted_travel_time_hrs: float
      - edge_cost_multiplier: float
    """
    p_disruption = prediction["predicted_disruption_probability"]
    p_closure = prediction["closure_probability"]
    pred_speed = prediction["predicted_speed_kmh"]
    eta_mult = prediction["eta_multiplier"]

    # Closure criteria: high closure probability or blocked status
    is_closed = (current_status.upper() in ("BLOCKED", "CLOSED")) or (p_closure >= 0.85)

    if is_closed:
        traversable = False
        suggested_status = "BLOCKED"
        effective_speed = 0.0
        travel_time_hrs = 999.0
        cost_mult = 999.0
    else:
        traversable = True
        suggested_status = "RESTRICTED" if p_disruption >= 0.60 else "OPEN"
        effective_speed = max(5.0, pred_speed if pred_speed > 0 else (speed_limit_kmh or 45.0) * 0.5)
        travel_time_hrs = round(base_distance_km / effective_speed, 3)
        cost_mult = eta_mult

    return {
        "disruption_risk": p_disruption,
        "effective_speed_kmh": effective_speed,
        "traversable": traversable,
        "suggested_status": suggested_status,
        "adjusted_travel_time_hrs": travel_time_hrs,
        "edge_cost_multiplier": cost_mult,
    }

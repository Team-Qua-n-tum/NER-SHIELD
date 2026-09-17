"""
gis_risk_engine.py — GIS-aware disruption risk inference for NER-SHIELD.

This module provides the upgraded risk calculation that consumes a
RiskFeatureContext assembled from live/demo operational data, weather,
and GIS spatial analysis.

Inference selection
-------------------
1. trained_model
   - Used when disruption_model.joblib is loadable and compatible.
   - Never triggers retraining.
2. deterministic_heuristic
   - Always available fallback.
   - Stable, documented weights.
   - The only path in DEMO_MODE=true if no artifact exists.
3. unavailable
   - Only when inputs are critically missing (no road, no mode info).

All outputs carry:
  risk_score, risk_level, confidence, reasons, recommendation,
  method, model_version, calculated_at, input_freshness_seconds,
  data_sources, stale, data_mode, source_status,
  route-ready fields: road_id, routing_recommendation, suggested_status,
  route_eligible, risk_penalty, affected_by_incident_ids,
  incident_count, highest_incident_severity.

Method labels are never falsified:
  - heuristic calculations are never called ML predictions.
  - demo data is never labelled as live provider data.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import numpy as np

from backend.ai.risk.risk_context import RiskFeatureContext

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MODEL_VERSION_HEURISTIC = "heuristic-v2"
MODEL_VERSION_UNKNOWN = "unavailable"

_STALE_FRESHNESS_THRESHOLD = 3600.0  # seconds — above this, confidence is reduced

RISK_THRESHOLDS = [
    (0.75, "CRITICAL"),
    (0.50, "HIGH"),
    (0.25, "MEDIUM"),
    (0.00, "LOW"),
]

# Routing recommendation thresholds
ROUTING_RECOMMENDATIONS = {
    "CRITICAL": "exclude_from_routing",
    "HIGH": "avoid_if_alternative",
    "MEDIUM": "caution",
    "LOW": "normal",
}

# Heuristic feature weights (calibrated for NER terrain)
HEURISTIC_WEIGHTS = {
    "rainfall": 0.28,
    "weather_severity": 0.12,
    "road_status": 0.20,
    "gis_penalty": 0.25,
    "active_incidents": 0.10,
    "existing_risk_score": 0.05,
}

# Weather condition severity mappings
WEATHER_SEVERITY_MAP: Dict[str, float] = {
    "CLEAR": 0.0,
    "FOG": 0.25,
    "RAIN": 0.40,
    "HEAVY_RAIN": 0.75,
    "THUNDERSTORM": 0.90,
}

ROAD_STATUS_PENALTY: Dict[str, float] = {
    "OPEN": 0.0,
    "DISRUPTED": 0.50,
    "BLOCKED": 1.0,
    "CLOSED": 0.90,
    "IN_PROGRESS": 0.35,
}


# ---------------------------------------------------------------------------
# Risk classification helpers
# ---------------------------------------------------------------------------

def _classify_risk(score: float) -> str:
    """Map a risk score in [0, 1] to a risk level string."""
    for threshold, level in RISK_THRESHOLDS:
        if score >= threshold:
            return level
    return "LOW"


def _routing_recommendation(risk_level: str, is_blocked: bool) -> str:
    """Determine routing recommendation from risk level and blockage."""
    if is_blocked:
        return "exclude_from_routing"
    return ROUTING_RECOMMENDATIONS.get(risk_level, "caution")


# ---------------------------------------------------------------------------
# Reason generation
# ---------------------------------------------------------------------------

def _build_reasons(ctx: RiskFeatureContext, score: float) -> List[str]:
    """
    Generate human-readable operational reasons for the risk score.
    Reasons are derived from input thresholds — honest about data source.
    """
    reasons: List[str] = []

    # Weather
    rainfall = ctx.effective_rainfall_mm()
    if rainfall >= 200:
        reasons.append(f"Extreme rainfall recorded ({rainfall:.0f}mm in 24 hours).")
    elif rainfall >= 100:
        reasons.append(f"Heavy rainfall recorded in the last 24 hours ({rainfall:.0f}mm).")
    elif rainfall >= 50:
        reasons.append(f"Moderate rainfall ({rainfall:.0f}mm in 24h) affecting road conditions.")

    wc = ctx.effective_weather_condition()
    if wc in ("HEAVY_RAIN", "THUNDERSTORM"):
        reasons.append(f"Severe weather pattern ({wc.replace('_', ' ').title()}) in the region.")
    elif wc == "FOG":
        reasons.append("Reduced visibility due to fog conditions.")

    # Road status
    rs = (ctx.road_status or "").upper()
    if rs == "BLOCKED":
        reasons.append("Road is currently blocked — no through traffic possible.")
    elif rs == "DISRUPTED":
        reasons.append("Road is disrupted — significant delays expected.")
    elif rs == "CLOSED":
        reasons.append("Road is officially closed to traffic.")

    # GIS incident impact
    if ctx.has_critical_incident():
        sev = (ctx.incident_severity or "unknown").capitalize()
        itype = (ctx.incident_type or "incident").replace("_", " ")
        reasons.append(
            f"{sev}-severity {itype} matched to this road segment."
        )

    gs = (ctx.suggested_status or "").lower()
    if gs == "blocked":
        reasons.append(
            "GIS hazard analysis indicates this road should be blocked "
            "based on incident impact assessment."
        )
    elif gs == "restricted":
        reasons.append(
            "GIS hazard analysis recommends restricted access on this road segment."
        )

    if ctx.affected_road_count > 1:
        reasons.append(
            f"{ctx.affected_road_count - 1} nearby road(s) are inside the hazard impact zone."
        )

    # Active incidents
    if ctx.active_incident_count > 0 and not ctx.has_critical_incident():
        reasons.append(
            f"{ctx.active_incident_count} active incident(s) reported in the zone."
        )

    # Stale data warnings
    if ctx.weather_stale:
        age_min = (ctx.weather_freshness_seconds or 0.0) / 60.0
        reasons.append(
            f"Weather observation is older than {age_min:.0f} minutes; confidence reduced."
        )
    if ctx.incident_stale:
        reasons.append("Incident data may not reflect the latest field conditions.")

    # Demo data label
    if ctx.source_status == "demo_synthetic_data":
        reasons.append("Risk calculated from demo data, not a live provider.")

    if not reasons:
        reasons.append("No significant risk factors detected for current conditions.")

    return reasons


# ---------------------------------------------------------------------------
# Heuristic inference
# ---------------------------------------------------------------------------

def _heuristic_score(ctx: RiskFeatureContext) -> Dict[str, Any]:
    """
    Compute a deterministic, weighted risk score from the feature context.

    Returns a dict with: raw_score, partial_scores.
    Fully deterministic — same inputs always produce the same output.
    """
    partial: Dict[str, float] = {}

    # 1. Rainfall
    rainfall = ctx.effective_rainfall_mm()
    partial["rainfall"] = min(1.0, rainfall / 200.0)

    # 2. Weather severity
    wc = ctx.effective_weather_condition()
    partial["weather_severity"] = WEATHER_SEVERITY_MAP.get(wc, 0.0)

    # 3. Road status
    rs = (ctx.road_status or "OPEN").upper()
    partial["road_status"] = ROAD_STATUS_PENALTY.get(rs, 0.0)

    # 4. GIS penalty — use the directly computed suggested_risk_penalty if available
    # This is the primary GIS contribution; we do NOT re-run spatial calcs here.
    gis_penalty = ctx.suggested_risk_penalty
    if gis_penalty is not None:
        partial["gis_penalty"] = float(np.clip(gis_penalty, 0.0, 1.0))
    elif ctx.affected_road_count > 0:
        # Road is in impact zone but no direct penalty — use impact level proxy
        il = (ctx.impact_level or "medium").lower()
        il_map = {"low": 0.20, "medium": 0.40, "high": 0.70, "critical": 0.95}
        partial["gis_penalty"] = il_map.get(il, 0.40)
    else:
        partial["gis_penalty"] = 0.0

    # 5. Active incidents (supplementary, not duplicating GIS penalty)
    partial["active_incidents"] = min(1.0, ctx.active_incident_count * 0.15)

    # 6. Existing risk score (passthrough blend)
    if ctx.current_risk_score is not None:
        partial["existing_risk_score"] = float(np.clip(ctx.current_risk_score, 0.0, 1.0))
    else:
        partial["existing_risk_score"] = 0.0

    # Weighted sum
    raw = sum(
        HEURISTIC_WEIGHTS.get(k, 0.0) * v for k, v in partial.items()
    )
    return {"raw_score": raw, "partial_scores": partial}


def _heuristic_confidence(ctx: RiskFeatureContext) -> float:
    """
    Compute confidence score reduced by stale/missing inputs.
    Base confidence for heuristic is 0.72 (lower than trained model).
    """
    base = 0.72
    reduction = 0.0

    if ctx.weather_stale or ctx.rainfall_mm_24h is None:
        reduction += 0.10
    if ctx.incident_stale:
        reduction += 0.08
    if ctx.road_state_stale:
        reduction += 0.05
    if ctx.source_status in ("heuristic_fallback", "data_unavailable"):
        reduction += 0.15
    if ctx.source_status == "demo_synthetic_data":
        reduction += 0.05  # slight reduction for synthetic data

    return round(max(0.20, base - reduction), 3)


# ---------------------------------------------------------------------------
# Trained model inference
# ---------------------------------------------------------------------------

def _try_trained_model(ctx: RiskFeatureContext) -> Optional[Dict[str, Any]]:
    """
    Attempt inference using the trained sklearn model artifact.
    Returns None if the model is unavailable, incompatible, or fails.
    Never triggers training.
    """
    try:
        from backend.ml.loader import ModelLoader  # noqa: PLC0415
        model = ModelLoader.get_model()
        if model is None:
            return None

        # Build feature vector matching the trained model's FEATURE_COLS
        from backend.ai.risk.risk_engine import FEATURE_COLS, FEATURE_DEFAULTS  # noqa: PLC0415
        import pandas as pd  # noqa: PLC0415

        row: Dict[str, float] = {}
        for col in FEATURE_COLS:
            row[col] = FEATURE_DEFAULTS[col]

        # Map RiskFeatureContext fields to model features
        rainfall = ctx.effective_rainfall_mm()
        row["rainfall_mm"] = min(2000.0, max(0.0, rainfall))

        rs = (ctx.road_status or "OPEN").upper()
        road_cond_map = {"OPEN": 0, "DISRUPTED": 2, "BLOCKED": 3, "CLOSED": 3, "IN_PROGRESS": 1}
        row["road_condition"] = float(road_cond_map.get(rs, 1))

        if ctx.active_incident_count > 0:
            row["historical_incidents"] = float(min(100, ctx.active_incident_count))

        if ctx.has_critical_incident():
            sev = (ctx.incident_severity or "medium").lower()
            sev_map = {"critical": 3, "high": 2, "severe": 2, "moderate": 1, "medium": 1}
            row["incident_severity"] = float(sev_map.get(sev, 1))
        elif ctx.active_incident_count >= 3:
            row["incident_severity"] = 2.0
        elif ctx.active_incident_count > 0:
            row["incident_severity"] = 1.0

        # Terrain risk from slope
        if ctx.slope_degree is not None:
            if ctx.slope_degree >= 40.0:
                row["terrain_risk"] = 2.0
            elif ctx.slope_degree >= 20.0:
                row["terrain_risk"] = 1.0
            else:
                row["terrain_risk"] = 0.0

        # Flood level from weather and rainfall
        wc = ctx.effective_weather_condition()
        if wc in ("HEAVY_RAIN", "THUNDERSTORM") or rainfall >= 180.0:
            row["flood_level"] = 2.0
        elif wc == "RAIN" or rainfall >= 60.0:
            row["flood_level"] = 1.0
        else:
            row["flood_level"] = 0.0

        # Landslide indicator from soil, slope, rainfall, and GIS penalty
        soil = (ctx.soil_type or "").upper()
        if soil in ("CLAY", "ROCKY") and (rainfall >= 80.0 or (ctx.slope_degree or 0.0) >= 30.0):
            row["landslide_indicator"] = 2.0
        elif soil in ("CLAY", "ROCKY") or rainfall >= 150.0:
            row["landslide_indicator"] = 1.0

        gis_penalty = ctx.suggested_risk_penalty or 0.0
        if gis_penalty >= 0.80:
            row["landslide_indicator"] = 2.0
        elif gis_penalty >= 0.40:
            row["landslide_indicator"] = max(row["landslide_indicator"], 1.0)

        X = pd.DataFrame([row], columns=FEATURE_COLS)
        raw_pred = model.predict_proba(X)
        arr = np.asarray(raw_pred)
        if arr.ndim == 2 and arr.shape[1] > 1:
            prob = float(arr[0, 1])
        elif arr.ndim == 1 and len(arr) > 1:
            prob = float(arr[1])
        else:
            prob = float(arr.flat[-1])
        prob = round(float(np.clip(prob, 0.0, 1.0)), 4)

        model_version_env = os.getenv("MODEL_VERSION", "disruption-rf-v1")
        return {
            "risk_score": prob,
            "method": "trained_model",
            "model_version": model_version_env,
        }

    except Exception as exc:
        logger.warning(
            "[GISRiskEngine] Trained model inference failed: %s — using heuristic.",
            exc,
        )
        return None


# ---------------------------------------------------------------------------
# Confidence from trained model
# ---------------------------------------------------------------------------

def _trained_model_confidence(ctx: RiskFeatureContext) -> float:
    """Confidence for trained-model path, reduced by stale inputs."""
    base = 0.88
    reduction = 0.0
    if ctx.weather_stale:
        reduction += 0.12
    if ctx.incident_stale:
        reduction += 0.08
    if ctx.source_status in ("heuristic_fallback", "data_unavailable"):
        reduction += 0.20
    if ctx.source_status == "demo_synthetic_data":
        reduction += 0.05
    return round(max(0.20, base - reduction), 3)


# ---------------------------------------------------------------------------
# Route-ready output assembly
# ---------------------------------------------------------------------------

def _build_route_fields(
    risk_level: str,
    ctx: RiskFeatureContext,
    risk_score: float,
) -> Dict[str, Any]:
    """
    Build route-ready fields for the routing branch to consume directly.
    """
    is_blocked = ctx.is_road_blocked()
    rec = _routing_recommendation(risk_level, is_blocked)
    route_eligible = not is_blocked and risk_score < 0.75

    # Effective routing penalty: prefer GIS penalty, else derive from score
    risk_penalty = ctx.suggested_risk_penalty
    if risk_penalty is None:
        risk_penalty = round(risk_score * 0.85, 3)

    return {
        "road_id": ctx.road_id,
        "routing_recommendation": rec,
        "suggested_status": ctx.suggested_status or (
            "blocked" if is_blocked else
            "restricted" if risk_level in ("HIGH", "CRITICAL") else
            "warning" if risk_level == "MEDIUM" else "normal"
        ),
        "route_eligible": route_eligible,
        "risk_penalty": round(float(np.clip(risk_penalty, 0.0, 1.0)), 3),
        "affected_by_incident_ids": ctx.affected_by_incident_ids,
        "incident_count": ctx.active_incident_count,
        "highest_incident_severity": ctx.highest_incident_severity,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_risk(ctx: RiskFeatureContext) -> Dict[str, Any]:
    """
    Calculate disruption risk from an assembled RiskFeatureContext.

    Inference selection:
      1. trained_model — if artifact available and compatible
      2. deterministic_heuristic — safe fallback
      3. unavailable — if context is critically broken

    Parameters
    ----------
    ctx : RiskFeatureContext
        Assembled feature context from risk_context_service.

    Returns
    -------
    dict with all required fields including route-ready outputs.
    """
    calculated_at = datetime.now(timezone.utc).isoformat()

    # Guard: can we produce a meaningful result?
    if ctx.source_status == "data_unavailable" and ctx.road_id is None:
        return {
            "risk_score": None,
            "risk_level": "UNKNOWN",
            "confidence": 0.0,
            "reasons": ["Insufficient data to calculate risk — no road or operational context."],
            "recommendation": "Unable to assess route risk. Verify data sources.",
            "method": "unavailable",
            "model_version": MODEL_VERSION_UNKNOWN,
            "calculated_at": calculated_at,
            "input_freshness_seconds": None,
            "data_sources": [],
            "stale": True,
            "data_mode": ctx.data_mode,
            "source_status": ctx.source_status,
            "road_id": ctx.road_id,
            "routing_recommendation": "exclude_from_routing",
            "suggested_status": None,
            "route_eligible": False,
            "risk_penalty": 1.0,
            "affected_by_incident_ids": [],
            "incident_count": 0,
            "highest_incident_severity": None,
        }

    # ------------------------------------------------------------------
    # 1. Try trained model
    # ------------------------------------------------------------------
    model_result = _try_trained_model(ctx)

    if model_result is not None:
        risk_score = model_result["risk_score"]
        method = "trained_model"
        model_version = model_result["model_version"]
        confidence = _trained_model_confidence(ctx)
    else:
        # ------------------------------------------------------------------
        # 2. Deterministic heuristic
        # ------------------------------------------------------------------
        heuristic = _heuristic_score(ctx)
        raw = heuristic["raw_score"]
        risk_score = round(float(np.clip(raw, 0.0, 1.0)), 4)
        method = "deterministic_heuristic"
        model_version = MODEL_VERSION_HEURISTIC
        confidence = _heuristic_confidence(ctx)

    # ------------------------------------------------------------------
    # Risk classification
    # ------------------------------------------------------------------
    risk_level = _classify_risk(risk_score)
    reasons = _build_reasons(ctx, risk_score)

    # Recommendation
    is_blocked = ctx.is_road_blocked()
    if is_blocked:
        recommendation = "Road blocked. Exclude from routing. Use emergency bypass if available."
    elif risk_level == "CRITICAL":
        recommendation = "Route unsafe. Divert heavy cargo to emergency alternate bypass immediately."
    elif risk_level == "HIGH":
        recommendation = "High disruption vulnerability. Dispatch with escort or monitor field alerts."
    elif risk_level == "MEDIUM":
        recommendation = "Moderate risk. Exercise caution in low-visibility mountain passes."
    else:
        recommendation = "Normal transit conditions. Standard speed and safety protocols apply."

    # ------------------------------------------------------------------
    # Freshness metadata
    # ------------------------------------------------------------------
    freshness_values = [
        v for v in [
            ctx.weather_freshness_seconds,
            ctx.road_state_freshness_seconds,
            ctx.incident_freshness_seconds,
        ]
        if v is not None
    ]
    input_freshness_seconds = round(max(freshness_values), 1) if freshness_values else None

    data_sources = []
    if ctx.weather_source:
        data_sources.append(f"weather:{ctx.weather_source}")
    if ctx.data_mode == "demo":
        data_sources.append("operational:demo_store")
    else:
        data_sources.append("operational:database")
    if ctx.affected_road_count > 0 or ctx.active_incident_count > 0:
        data_sources.append("gis:hazard_buffer")

    # ------------------------------------------------------------------
    # Route-ready fields
    # ------------------------------------------------------------------
    route_fields = _build_route_fields(risk_level, ctx, risk_score)

    return {
        # Core risk output
        "risk_score": risk_score,
        "risk_level": risk_level,
        "confidence": confidence,
        "reasons": reasons,
        "recommendation": recommendation,
        # Method / provenance
        "method": method,
        "model_version": model_version,
        "calculated_at": calculated_at,
        # Freshness
        "input_freshness_seconds": input_freshness_seconds,
        "data_sources": data_sources,
        "stale": ctx.is_stale(),
        "data_mode": ctx.data_mode,
        "source_status": ctx.source_status,
        # Route-ready fields (routing branch)
        **route_fields,
    }

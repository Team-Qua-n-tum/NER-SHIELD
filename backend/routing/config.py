"""
Centralized routing thresholds, cost weights, and engine selection settings.

CLOSURE_PROBABILITY_THRESHOLD (default 0.85)
    Matches to_routing_edge_cost() policy: only high-confidence closure forecasts
    mark an edge non-traversable. Lower-confidence forecasts apply cost penalties
    only — they never silently close a road.

PREDICTION_CONFIDENCE_MIN_FOR_SPEED_CLOSURE (default 0.55)
    predicted_speed_kmh <= 0 excludes an edge only when prediction confidence
    meets this floor, so weak forecasts cannot invent hard closures.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Literal

RoutingEngineMode = Literal["auto", "advanced", "simple"]

ROUTING_ENGINE_VERSION = "2.0.0-gis-ai"

# ---------------------------------------------------------------------------
# Hard safety / exclusion thresholds
# ---------------------------------------------------------------------------

CLOSURE_PROBABILITY_THRESHOLD: float = float(
    os.getenv("ROUTING_CLOSURE_PROBABILITY_THRESHOLD", "0.85")
)
PREDICTION_CONFIDENCE_MIN_FOR_SPEED_CLOSURE: float = float(
    os.getenv("ROUTING_PRED_CONFIDENCE_MIN", "0.55")
)
MAX_SNAP_DISTANCE_METERS: float = float(
    os.getenv("ROUTING_MAX_SNAP_DISTANCE_METERS", "50000")
)

# Status values that hard-exclude an edge (case-insensitive)
HARD_BLOCK_STATUSES = frozenset({"blocked", "closed"})

# ---------------------------------------------------------------------------
# Multi-factor cost weights
# ---------------------------------------------------------------------------

TIME_WEIGHT: float = float(os.getenv("ROUTING_TIME_WEIGHT", "1.0"))
DISTANCE_WEIGHT: float = float(os.getenv("ROUTING_DISTANCE_WEIGHT", "0.05"))
AI_RISK_WEIGHT: float = float(os.getenv("ROUTING_AI_RISK_WEIGHT", "12.0"))
GIS_IMPACT_WEIGHT: float = float(os.getenv("ROUTING_GIS_IMPACT_WEIGHT", "4.0"))
CONDITION_WEIGHT: float = float(os.getenv("ROUTING_CONDITION_WEIGHT", "1.5"))
INCIDENT_WEIGHT: float = float(os.getenv("ROUTING_INCIDENT_WEIGHT", "3.0"))
PREDICTION_WEIGHT: float = float(os.getenv("ROUTING_PREDICTION_WEIGHT", "5.0"))
STALE_DATA_WEIGHT: float = float(os.getenv("ROUTING_STALE_DATA_WEIGHT", "1.0"))

# Bounded stale-data penalty (hours-equivalent); never treated as live certainty
MAX_STALE_PENALTY: float = 2.0
RESTRICTED_STATUS_PENALTY: float = 2.0
HIGH_RISK_WARNING_PENALTY: float = 5.0

# Minimum positive finite edge cost (no zero/negative edges)
MIN_EDGE_COST: float = 1e-6
INF_COST: float = 1e9

# Alternate-route uniqueness
MAX_ALTERNATES: int = 2
ALTERNATE_EDGE_PENALTY_FACTOR: float = 100.0


def get_routing_engine_mode() -> RoutingEngineMode:
    raw = (os.getenv("ROUTING_ENGINE") or "").strip().lower()
    if not raw:
        try:
            from backend.app.core.config import settings

            raw = (getattr(settings, "ROUTING_ENGINE", None) or "auto").strip().lower()
        except Exception:
            raw = "auto"
    if raw in ("auto", "advanced", "simple"):
        return raw  # type: ignore[return-value]
    return "auto"


@dataclass
class CostWeights:
    time_weight: float = TIME_WEIGHT
    distance_weight: float = DISTANCE_WEIGHT
    ai_risk_weight: float = AI_RISK_WEIGHT
    gis_impact_weight: float = GIS_IMPACT_WEIGHT
    condition_weight: float = CONDITION_WEIGHT
    incident_weight: float = INCIDENT_WEIGHT
    prediction_weight: float = PREDICTION_WEIGHT
    stale_data_weight: float = STALE_DATA_WEIGHT


@dataclass
class SafetyPolicy:
    closure_probability_threshold: float = CLOSURE_PROBABILITY_THRESHOLD
    prediction_confidence_min: float = PREDICTION_CONFIDENCE_MIN_FOR_SPEED_CLOSURE
    max_snap_distance_meters: float = MAX_SNAP_DISTANCE_METERS
    hard_block_statuses: frozenset = field(default_factory=lambda: HARD_BLOCK_STATUSES)


DEFAULT_COST_WEIGHTS = CostWeights()
DEFAULT_SAFETY_POLICY = SafetyPolicy()

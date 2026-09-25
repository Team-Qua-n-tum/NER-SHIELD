"""
Configurable multi-factor Cost Function for NER-SHIELD.

Formula
-------
edge_cost =
    time_weight * adjusted_travel_time_seconds
  + distance_weight * distance_penalty
  + ai_risk_weight * ai_risk_penalty
  + gis_impact_weight * gis_impact_penalty
  + condition_weight * road_condition_penalty
  + incident_weight * incident_penalty
  + prediction_weight * future_disruption_penalty
  + stale_data_weight * bounded_freshness_penalty

Precedence (double-counting avoidance)
--------------------------------------
1. Hard closure/ineligibility → INF (handled before cost terms).
2. AI ``risk_penalty`` is the primary combined operational penalty.
3. GIS ``suggested_risk_penalty`` supplements only when AI penalty is
   missing, or when GIS provides segment-specific detail not already
   reflected in the AI value (tracked via ``gis_penalty_applied``).
4. A single incident is never scored through both AI and GIS terms.
5. Forecast probabilities influence cost only for traversable edges.
6. Stale data adds a bounded conservative penalty; it is never certainty.
"""

from __future__ import annotations

import math
from typing import Dict, Optional, Tuple

from .config import (
    DEFAULT_COST_WEIGHTS,
    HIGH_RISK_WARNING_PENALTY,
    INF_COST,
    MAX_STALE_PENALTY,
    MIN_EDGE_COST,
    RESTRICTED_STATUS_PENALTY,
    CostWeights,
)
from .eligibility import evaluate_edge_eligibility
from .models import CommodityPriority, Edge, RoadStatus


class CostFunction:
    """
    Evaluates edge weights from time, AI risk, GIS impact, condition,
    incidents, future disruption, and stale-data penalties.
    """

    INF_COST: float = INF_COST

    def __init__(
        self,
        w_time: float = 1.0,
        w_risk: float = 10.0,
        w_condition: float = 1.5,
        weights: Optional[CostWeights] = None,
    ) -> None:
        """
        Legacy ``w_time`` / ``w_risk`` / ``w_condition`` args are preserved for
        existing unit tests; ``weights`` overrides when provided.
        """
        base = weights or CostWeights(
            time_weight=w_time,
            ai_risk_weight=w_risk,
            condition_weight=w_condition,
        )
        # Honour legacy constructor: if only legacy args passed, map them
        if weights is None:
            base = CostWeights(
                time_weight=w_time,
                ai_risk_weight=w_risk,
                condition_weight=w_condition,
            )
        self.weights = base
        # Back-compat attributes used by older tests/callers
        self.w_time = base.time_weight
        self.w_risk = base.ai_risk_weight
        self.w_condition = base.condition_weight

    def calculate_edge_cost(
        self, edge: Edge, commodity: CommodityPriority = CommodityPriority.GENERAL
    ) -> float:
        cost, breakdown = self.calculate_edge_cost_detailed(edge, commodity)
        edge.last_cost_breakdown = breakdown
        return cost

    def calculate_edge_cost_detailed(
        self, edge: Edge, commodity: CommodityPriority = CommodityPriority.GENERAL
    ) -> Tuple[float, Dict[str, float]]:
        traversable, reasons = evaluate_edge_eligibility(edge)
        if not traversable or edge.status == RoadStatus.BLOCKED:
            breakdown = {"excluded": self.INF_COST, "exclusion_count": float(len(reasons))}
            edge.exclusion_reasons = reasons
            edge.traversable = False
            return self.INF_COST, breakdown

        w = self.weights
        commodity_mult = commodity.risk_weight_multiplier

        # --- Time (seconds → hours scaled for numerical stability) ---
        # Store seconds conceptually; weight operates on hours to keep scales sane
        adjusted_hrs = max(0.0, edge.adjusted_travel_time_hrs)
        time_term = w.time_weight * (adjusted_hrs * 3600.0) / 3600.0  # = hours

        # --- Distance ---
        distance_term = w.distance_weight * max(0.0, edge.distance_km)

        # --- AI risk (primary) vs GIS supplement ---
        ai_penalty = edge.risk_penalty
        gis_penalty = edge.suggested_risk_penalty
        ai_term = 0.0
        gis_term = 0.0

        if ai_penalty is not None:
            ai_term = w.ai_risk_weight * (max(0.0, min(1.0, ai_penalty)) ** 2) * commodity_mult
            # GIS supplements only missing/extra segment detail
            if gis_penalty is not None and edge.gis_penalty_applied:
                residual = max(0.0, min(1.0, gis_penalty) - max(0.0, min(1.0, ai_penalty)))
                if residual > 0.01:
                    gis_term = w.gis_impact_weight * (residual ** 2) * commodity_mult
            # else: GIS already folded into AI — do not double-count
        elif gis_penalty is not None:
            gis_term = w.gis_impact_weight * (max(0.0, min(1.0, gis_penalty)) ** 2) * commodity_mult
        else:
            # Fall back to disruption_risk squared (legacy)
            risk_score = max(0.0, min(1.0, edge.disruption_risk))
            ai_term = w.ai_risk_weight * (risk_score ** 2) * commodity_mult

        # --- Condition ---
        condition_penalty = edge.road_condition.condition_penalty_score * (
            edge.distance_km / 10.0
        )
        condition_term = w.condition_weight * condition_penalty

        # --- Incidents (only if not already represented by AI risk_penalty) ---
        incident_term = 0.0
        if edge.incident_ids and ai_penalty is None:
            incident_term = w.incident_weight * min(3.0, float(len(edge.incident_ids))) * 0.5
        elif edge.incident_ids and ai_penalty is not None:
            # Soft additive for multi-incident corridors without replaying AI score
            extra = max(0, len(edge.incident_ids) - 1)
            if extra > 0:
                incident_term = w.incident_weight * 0.25 * extra

        # --- Future disruption (traversable edges only) ---
        prediction_term = 0.0
        if edge.closure_probability is not None:
            cp = max(0.0, min(1.0, edge.closure_probability))
            prediction_term = w.prediction_weight * (cp ** 2) * commodity_mult
        elif edge.disruption_risk and edge.eta_multiplier and edge.eta_multiplier > 1.0:
            prediction_term = w.prediction_weight * min(2.0, edge.eta_multiplier - 1.0)

        # --- Status soft penalties ---
        status_term = 0.0
        if edge.status == RoadStatus.HIGH_RISK_WARNING:
            status_term = HIGH_RISK_WARNING_PENALTY * commodity_mult
        elif edge.status == RoadStatus.RESTRICTED:
            status_term = RESTRICTED_STATUS_PENALTY

        # --- Bounded stale-data penalty ---
        stale_term = 0.0
        if edge.stale:
            freshness = edge.freshness_seconds or 7200.0
            # Linear ramp up to MAX_STALE_PENALTY over 2 hours of staleness signal
            stale_term = w.stale_data_weight * min(
                MAX_STALE_PENALTY, MAX_STALE_PENALTY * (freshness / 7200.0)
            )

        total = (
            time_term
            + distance_term
            + ai_term
            + gis_term
            + condition_term
            + incident_term
            + prediction_term
            + status_term
            + stale_term
        )

        if not math.isfinite(total) or total <= 0:
            total = MIN_EDGE_COST
        else:
            total = max(MIN_EDGE_COST, total)

        breakdown = {
            "time": round(time_term, 4),
            "distance": round(distance_term, 4),
            "ai_risk": round(ai_term, 4),
            "gis_impact": round(gis_term, 4),
            "condition": round(condition_term, 4),
            "incident": round(incident_term, 4),
            "prediction": round(prediction_term, 4),
            "status": round(status_term, 4),
            "stale": round(stale_term, 4),
            "total": round(total, 4),
        }
        return total, breakdown

    def calculate_shortest_distance_cost(self, edge: Edge) -> float:
        traversable, _ = evaluate_edge_eligibility(edge)
        if not traversable or edge.status == RoadStatus.BLOCKED:
            return self.INF_COST
        dist = edge.distance_km
        if not math.isfinite(dist) or dist <= 0:
            return MIN_EDGE_COST
        return dist

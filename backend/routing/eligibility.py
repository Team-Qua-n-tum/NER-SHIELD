"""
Hard safety / edge eligibility policy for NER-SHIELD routing.

Precedence:
  1. Hard closure / ineligibility always excludes an edge (non-traversable).
  2. Soft restrictions remain traversable but receive cost penalties.
  3. Low-confidence forecasts never invent hard closures without meeting
     configured confidence floors (see backend.routing.config).
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from .config import DEFAULT_SAFETY_POLICY, SafetyPolicy
from .models import Edge, RoadStatus


def evaluate_edge_eligibility(
    edge: Edge,
    policy: Optional[SafetyPolicy] = None,
) -> Tuple[bool, List[str]]:
    """
    Return (traversable, exclusion_reasons).

    An edge is non-traversable when any hard-safety condition is true.
    """
    policy = policy or DEFAULT_SAFETY_POLICY
    reasons: List[str] = []

    status_raw = (edge.status.value if isinstance(edge.status, RoadStatus) else str(edge.status)).lower()
    suggested = (edge.suggested_status or "").lower()
    road_status = (edge.road_status or status_raw or "").lower()

    if road_status in policy.hard_block_statuses or status_raw in policy.hard_block_statuses:
        reasons.append(f"road_status={road_status or status_raw}")

    if suggested in policy.hard_block_statuses:
        reasons.append(f"suggested_status={suggested}")

    if edge.route_eligible is False:
        reasons.append("route_eligible=False")

    if (edge.routing_recommendation or "").lower() == "exclude_from_routing":
        reasons.append("routing_recommendation=exclude_from_routing")

    closure_p = edge.closure_probability
    if closure_p is not None and closure_p >= policy.closure_probability_threshold:
        reasons.append(
            f"closure_probability={closure_p:.3f}>={policy.closure_probability_threshold}"
        )

    pred_speed = edge.predicted_speed_kmh
    pred_conf = edge.prediction_confidence
    if (
        pred_speed is not None
        and pred_speed <= 0.0
        and pred_conf is not None
        and pred_conf >= policy.prediction_confidence_min
    ):
        reasons.append(
            f"predicted_speed_kmh={pred_speed} with confidence={pred_conf:.3f}"
        )

    # Explicit traversable flag from AI bridge
    if edge.traversable is False:
        reasons.append("traversable=False")

    # Legacy RoadStatus.BLOCKED
    if edge.status == RoadStatus.BLOCKED:
        if "road_status=blocked" not in reasons and "status=BLOCKED" not in "".join(reasons):
            reasons.append("status=BLOCKED")

    traversable = len(reasons) == 0
    return traversable, reasons


def apply_eligibility_to_edge(
    edge: Edge,
    policy: Optional[SafetyPolicy] = None,
) -> Edge:
    """Mutate edge.traversable / exclusion_reasons from current fields."""
    traversable, reasons = evaluate_edge_eligibility(edge, policy)
    edge.traversable = traversable
    edge.exclusion_reasons = reasons
    if not traversable and edge.status != RoadStatus.BLOCKED:
        # Keep optimizer skip path consistent
        edge.status = RoadStatus.BLOCKED
    return edge


def eligibility_summary(edge: Edge) -> Dict[str, Any]:
    return {
        "edge_id": edge.id,
        "road_id": edge.road_id or edge.id,
        "traversable": edge.traversable if edge.traversable is not None else True,
        "exclusion_reasons": list(edge.exclusion_reasons or []),
        "suggested_status": edge.suggested_status,
        "route_eligible": edge.route_eligible,
        "routing_recommendation": edge.routing_recommendation,
        "closure_probability": edge.closure_probability,
    }

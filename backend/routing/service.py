"""
Unified Routing Service for NER-SHIELD Backend Integration.
"""

from typing import Dict, Any, Optional
from .models import (
    RouteRequest,
    RoutingResponse,
    CommodityPriority,
    RoadStatus,
    RoadCondition,
)
from .graph import RoadNetwork
from .cost import CostFunction
from .optimizer import RouteOptimizer
from .eta import ETAEngine


class RoutingService:
    """
    Primary API surface for backend routing and ETA operations.
    Integrates graph data structure, risk-aware cost calculation, multi-criteria route optimization,
    and dynamic ETA estimation.
    """

    def __init__(
        self,
        network: Optional[RoadNetwork] = None,
        cost_fn: Optional[CostFunction] = None,
    ) -> None:
        self.network = network or RoadNetwork()
        self.cost_fn = cost_fn or CostFunction()
        self.optimizer = RouteOptimizer(self.network, self.cost_fn)
        self.eta_engine = ETAEngine()

    def plan_route(self, request: RouteRequest) -> RoutingResponse:
        """
        Executes end-to-end route optimization and ETA calculation.
        """
        response = self.optimizer.find_route(request)

        # Refine ETA metrics if recommended route exists
        if response.recommended:
            eta_details = self.eta_engine.compute_route_eta(
                route=response.recommended,
                commodity=request.commodity,
                traffic_factor=request.traffic_factor,
            )
            response.estimated_travel_time_hrs = eta_details["total_eta_hrs"]

        if response.alternate:
            self.eta_engine.compute_route_eta(
                route=response.alternate,
                commodity=request.commodity,
                traffic_factor=request.traffic_factor,
            )

        return response

    def update_road_telemetry(
        self,
        edge_id: str,
        status: Optional[RoadStatus] = None,
        disruption_risk: Optional[float] = None,
        road_condition: Optional[RoadCondition] = None,
    ) -> bool:
        """
        Updates live road network status from AI models or field officer reports.
        """
        updated = False
        if status is not None:
            updated |= self.network.update_edge_status(edge_id, status)
        if disruption_risk is not None:
            updated |= self.network.update_edge_risk(edge_id, disruption_risk)
        if road_condition is not None:
            updated |= self.network.update_edge_condition(edge_id, road_condition)

        return updated

    def get_network_summary(self) -> Dict[str, Any]:
        """
        Provides overview metrics of network nodes, edges, blocked roads, and high risk segments.
        """
        total_nodes = len(self.network.nodes)
        total_edges = len(
            [e for e in self.network.edges.values() if not e.id.endswith("_rev")]
        )
        blocked_edges = [
            e.id
            for e in self.network.edges.values()
            if e.status == RoadStatus.BLOCKED and not e.id.endswith("_rev")
        ]
        high_risk_edges = [
            e.id
            for e in self.network.edges.values()
            if e.disruption_risk >= 0.5 and not e.id.endswith("_rev")
        ]

        return {
            "total_nodes": total_nodes,
            "total_edges": total_edges,
            "blocked_edges_count": len(blocked_edges),
            "high_risk_edges_count": len(high_risk_edges),
            "blocked_edge_ids": blocked_edges,
            "high_risk_edge_ids": high_risk_edges,
        }

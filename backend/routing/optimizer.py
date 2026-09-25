"""
Route Optimizer implementation for NER-SHIELD.
Implements multi-criteria Dijkstra and alternate path selection algorithms.
"""

import heapq
from typing import Dict, List, Optional, Tuple, Set
from .models import (
    Node,
    Edge,
    RoadStatus,
    CommodityPriority,
    RouteRequest,
    RouteResult,
    RoutingResponse,
)
from .graph import RoadNetwork
from .cost import CostFunction


class RouteOptimizer:
    """
    Core pathfinder engine for computing primary recommended routes and alternate paths.
    """

    def __init__(self, network: RoadNetwork, cost_fn: Optional[CostFunction] = None) -> None:
        self.network = network
        self.cost_fn = cost_fn or CostFunction()

    def find_route(self, request: RouteRequest) -> RoutingResponse:
        """
        Main routing entry point. Computes recommended route, alternate route, and rationale.
        """
        source = request.source_id
        target = request.destination_id

        # 1. Validation checks
        if source not in self.network.nodes:
            return RoutingResponse(
                recommended=None,
                alternate=None,
                estimated_travel_time_hrs=0.0,
                risk_level="UNKNOWN",
                reason=f"Source node '{source}' does not exist in road network.",
            )

        if target not in self.network.nodes:
            return RoutingResponse(
                recommended=None,
                alternate=None,
                estimated_travel_time_hrs=0.0,
                risk_level="UNKNOWN",
                reason=f"Destination node '{target}' does not exist in road network.",
            )

        if source == target:
            return RoutingResponse(
                recommended=RouteResult(
                    path_nodes=[source],
                    path_edges=[],
                    total_distance_km=0.0,
                    base_travel_time_hrs=0.0,
                    adjusted_travel_time_hrs=0.0,
                    eta_hrs=0.0,
                    route_cost=0.0,
                    average_risk=0.0,
                    max_risk=0.0,
                    risk_level="LOW",
                    bottlenecks=[],
                ),
                alternate=None,
                estimated_travel_time_hrs=0.0,
                risk_level="LOW",
                reason="Source and destination are identical.",
            )

        # 2. Compute Primary (Recommended) Route using Risk-Aware Cost Function
        recommended_route = self._dijkstra(
            source=source,
            target=target,
            commodity=request.commodity,
            use_risk_cost=True,
        )

        if not recommended_route:
            return RoutingResponse(
                recommended=None,
                alternate=None,
                estimated_travel_time_hrs=0.0,
                risk_level="SEVERE",
                reason="No viable route available. Corridor may be completely blocked or disconnected.",
            )

        # 3. Compute Alternate Route (by penalizing recommended path edges)
        alternate_route = self._find_alternate_route(
            source=source,
            target=target,
            primary_route=recommended_route,
            commodity=request.commodity,
        )

        # 4. Generate comparative rationale / reason
        reason = self._generate_reason(
            recommended=recommended_route,
            alternate=alternate_route,
            commodity=request.commodity,
        )

        return RoutingResponse(
            recommended=recommended_route,
            alternate=alternate_route,
            estimated_travel_time_hrs=recommended_route.adjusted_travel_time_hrs,
            risk_level=recommended_route.risk_level,
            reason=reason,
        )

    def find_shortest_distance_route(self, source: str, target: str) -> Optional[RouteResult]:
        """
        Utility to find traditional pure shortest distance route for benchmark comparison.
        """
        return self._dijkstra(
            source=source,
            target=target,
            commodity=CommodityPriority.GENERAL,
            use_risk_cost=False,
        )

    def _dijkstra(
        self,
        source: str,
        target: str,
        commodity: CommodityPriority,
        use_risk_cost: bool = True,
        penalized_edges: Optional[Set[str]] = None,
        penalty_factor: float = 5.0,
    ) -> Optional[RouteResult]:
        """
        Dijkstra shortest path algorithm supporting custom dynamic edge weighting and penalties.
        """
        penalized_edges = penalized_edges or set()

        # Priority queue storing tuples of (accumulated_cost, node_id)
        pq: List[Tuple[float, str]] = [(0.0, source)]
        distances: Dict[str, float] = {source: 0.0}
        previous_edge: Dict[str, Tuple[str, Edge]] = {}

        while pq:
            current_cost, u = heapq.heappop(pq)

            if u == target:
                break

            if current_cost > distances.get(u, float("inf")):
                continue

            for edge in self.network.get_neighbors(u):
                # Calculate edge cost
                if use_risk_cost:
                    base_edge_cost = self.cost_fn.calculate_edge_cost(edge, commodity)
                else:
                    base_edge_cost = self.cost_fn.calculate_shortest_distance_cost(edge)

                if base_edge_cost >= CostFunction.INF_COST:
                    continue  # Skip impassable / blocked edge

                # Apply penalty factor if edge is in penalized set (for alternate route generation)
                if edge.id in penalized_edges or f"{edge.id}_rev" in penalized_edges:
                    edge_cost = base_edge_cost * penalty_factor
                else:
                    edge_cost = base_edge_cost

                new_cost = current_cost + edge_cost

                v = edge.target
                if new_cost < distances.get(v, float("inf")):
                    distances[v] = new_cost
                    previous_edge[v] = (u, edge)
                    heapq.heappush(pq, (new_cost, v))

        if target not in previous_edge and source != target:
            return None

        # Reconstruct path
        path_nodes: List[str] = [target]
        path_edges: List[Edge] = []
        curr = target

        while curr != source:
            prev_node, edge = previous_edge[curr]
            path_nodes.append(prev_node)
            path_edges.append(edge)
            curr = prev_node

        path_nodes.reverse()
        path_edges.reverse()

        # Compute aggregate metrics
        total_distance = sum(e.distance_km for e in path_edges)
        base_travel_time = sum(e.base_travel_time_hrs for e in path_edges)
        adjusted_travel_time = sum(e.adjusted_travel_time_hrs for e in path_edges)

        risks = [e.disruption_risk for e in path_edges]
        avg_risk = sum(risks) / len(risks) if risks else 0.0
        max_risk = max(risks) if risks else 0.0

        bottlenecks = [
            f"{e.name or e.id} ({e.status.value}, Risk: {e.disruption_risk})"
            for e in path_edges
            if e.disruption_risk >= 0.5 or e.status != RoadStatus.OPEN
        ]

        risk_level = self._classify_risk_level(avg_risk, max_risk)

        return RouteResult(
            path_nodes=path_nodes,
            path_edges=path_edges,
            total_distance_km=total_distance,
            base_travel_time_hrs=base_travel_time,
            adjusted_travel_time_hrs=adjusted_travel_time,
            eta_hrs=adjusted_travel_time,  # Base ETA before dynamic ETA refinement
            route_cost=distances[target],
            average_risk=avg_risk,
            max_risk=max_risk,
            risk_level=risk_level,
            bottlenecks=bottlenecks,
        )

    def _find_alternate_route(
        self,
        source: str,
        target: str,
        primary_route: RouteResult,
        commodity: CommodityPriority,
    ) -> Optional[RouteResult]:
        """
        Generate a distinct alternate route by penalizing primary route edges.
        """
        primary_edge_ids = {e.id for e in primary_route.path_edges}

        # Try finding path with primary edges heavily penalized
        alternate = self._dijkstra(
            source=source,
            target=target,
            commodity=commodity,
            use_risk_cost=True,
            penalized_edges=primary_edge_ids,
            penalty_factor=100.0,
        )

        if not alternate:
            return None

        # Check if alternate is distinct enough (doesn't share 100% of nodes)
        if set(alternate.path_nodes) == set(primary_route.path_nodes):
            return None

        return alternate

    def _classify_risk_level(self, avg_risk: float, max_risk: float) -> str:
        if max_risk >= 0.8 or avg_risk >= 0.6:
            return "SEVERE"
        if max_risk >= 0.5 or avg_risk >= 0.35:
            return "HIGH"
        if max_risk >= 0.25 or avg_risk >= 0.15:
            return "MODERATE"
        return "LOW"

    def _generate_reason(
        self,
        recommended: RouteResult,
        alternate: Optional[RouteResult],
        commodity: CommodityPriority,
    ) -> str:
        """
        Generates human-readable rationale explaining why recommended route was selected.
        """
        if not alternate:
            if recommended.risk_level in ["HIGH", "SEVERE"]:
                return f"Recommended route is the only accessible corridor, but carries {recommended.risk_level} disruption risk."
            return "Recommended route is the optimal accessible path; no viable alternate corridor exists."

        risk_diff = alternate.average_risk - recommended.average_risk
        dist_diff = recommended.total_distance_km - alternate.total_distance_km

        if risk_diff > 0.15:
            return (
                f"Recommended route has lower disruption risk ({recommended.risk_level} vs {alternate.risk_level}) "
                f"for essential cargo ({commodity.value})."
            )
        elif dist_diff > 5.0 and risk_diff < -0.1:
            return (
                f"Recommended route saves distance ({recommended.total_distance_km:.1f} km vs {alternate.total_distance_km:.1f} km) "
                f"with acceptable risk."
            )
        elif recommended.total_distance_km < alternate.total_distance_km:
            return (
                f"Recommended route provides shortest practical travel time ({recommended.adjusted_travel_time_hrs:.1f}h) "
                f"and lowest disruption risk."
            )
        else:
            return f"Recommended route balances safety and efficiency for {commodity.value} transport."

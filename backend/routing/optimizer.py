"""
Route Optimizer — multi-criteria Dijkstra with distinct alternate paths.
"""

from __future__ import annotations

import heapq
from typing import Dict, List, Optional, Set, Tuple

from .config import ALTERNATE_EDGE_PENALTY_FACTOR, MAX_ALTERNATES
from .cost import CostFunction
from .graph import RoadNetwork
from .models import (
    CommodityPriority,
    Edge,
    RoadStatus,
    RouteRequest,
    RouteResult,
    RoutingResponse,
)


class RouteOptimizer:
    """
    Core pathfinder for primary recommended routes and distinct alternates.
    """

    def __init__(self, network: RoadNetwork, cost_fn: Optional[CostFunction] = None) -> None:
        self.network = network
        self.cost_fn = cost_fn or CostFunction()

    def find_route(self, request: RouteRequest) -> RoutingResponse:
        source = request.source_id
        target = request.destination_id

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
                reason=(
                    "No viable route available. No safe route is currently available "
                    "because all connecting road segments are blocked or ineligible."
                ),
            )

        alternates = self._find_alternates(
            source=source,
            target=target,
            primary_route=recommended_route,
            commodity=request.commodity,
            max_count=MAX_ALTERNATES,
        )
        alternate_route = alternates[0] if alternates else None

        reason = self._generate_reason(
            recommended=recommended_route,
            alternate=alternate_route,
            commodity=request.commodity,
        )

        response = RoutingResponse(
            recommended=recommended_route,
            alternate=alternate_route,
            estimated_travel_time_hrs=recommended_route.adjusted_travel_time_hrs,
            risk_level=recommended_route.risk_level,
            reason=reason,
        )
        # Attach extra alternates for enriched API mapping
        response._alternates = alternates  # type: ignore[attr-defined]
        return response

    def find_shortest_distance_route(self, source: str, target: str) -> Optional[RouteResult]:
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
        forbidden_edges: Optional[Set[str]] = None,
    ) -> Optional[RouteResult]:
        penalized_edges = penalized_edges or set()
        forbidden_edges = forbidden_edges or set()

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
                canonical = edge.id[:-4] if edge.id.endswith("_rev") else edge.id
                if edge.id in forbidden_edges or canonical in forbidden_edges:
                    continue

                if use_risk_cost:
                    base_edge_cost = self.cost_fn.calculate_edge_cost(edge, commodity)
                else:
                    base_edge_cost = self.cost_fn.calculate_shortest_distance_cost(edge)

                if base_edge_cost >= CostFunction.INF_COST:
                    continue

                if (
                    edge.id in penalized_edges
                    or canonical in penalized_edges
                    or f"{canonical}_rev" in penalized_edges
                ):
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

        # Guard: never return a path containing non-traversable edges
        for e in path_edges:
            if e.traversable is False or e.status == RoadStatus.BLOCKED:
                return None

        total_distance = sum(e.distance_km for e in path_edges)
        base_travel_time = sum(e.base_travel_time_hrs for e in path_edges)
        adjusted_travel_time = sum(e.adjusted_travel_time_hrs for e in path_edges)

        risks = [e.risk_score if e.risk_score is not None else e.disruption_risk for e in path_edges]
        avg_risk = sum(risks) / len(risks) if risks else 0.0
        max_risk = max(risks) if risks else 0.0
        # Conservative route risk: max edge + bounded cumulative penalty
        cumulative = sum(max(0.0, r - 0.25) for r in risks)
        route_risk = min(1.0, max_risk + 0.15 * min(cumulative, 2.0))

        bottlenecks = [
            f"{e.name or e.id} ({e.status.value}, Risk: {e.disruption_risk})"
            for e in path_edges
            if e.disruption_risk >= 0.5 or e.status != RoadStatus.OPEN
        ]

        risk_level = self._classify_risk_level(route_risk, max_risk)

        return RouteResult(
            path_nodes=path_nodes,
            path_edges=path_edges,
            total_distance_km=total_distance,
            base_travel_time_hrs=base_travel_time,
            adjusted_travel_time_hrs=adjusted_travel_time,
            eta_hrs=adjusted_travel_time,
            route_cost=distances.get(target, 0.0),
            average_risk=route_risk,
            max_risk=max_risk,
            risk_level=risk_level,
            bottlenecks=bottlenecks,
        )

    @staticmethod
    def _canonical_edge_ids(route: RouteResult) -> List[str]:
        ids: List[str] = []
        for e in route.path_edges:
            eid = e.road_id or e.id
            if eid.endswith("_rev"):
                eid = eid[:-4]
            ids.append(eid)
        return ids

    @staticmethod
    def _routes_distinct(a: RouteResult, b: RouteResult) -> bool:
        return RouteOptimizer._canonical_edge_ids(a) != RouteOptimizer._canonical_edge_ids(b)

    def _find_alternates(
        self,
        source: str,
        target: str,
        primary_route: RouteResult,
        commodity: CommodityPriority,
        max_count: int = 2,
    ) -> List[RouteResult]:
        results: List[RouteResult] = []
        forbidden: Set[str] = set()
        primary_ids = set(self._canonical_edge_ids(primary_route))

        # Pass 1: heavily penalize primary edges
        alt = self._dijkstra(
            source=source,
            target=target,
            commodity=commodity,
            use_risk_cost=True,
            penalized_edges=primary_ids,
            penalty_factor=ALTERNATE_EDGE_PENALTY_FACTOR,
        )
        if alt and self._routes_distinct(alt, primary_route):
            results.append(alt)
            forbidden.update(self._canonical_edge_ids(alt))

        # Pass 2: forbid one primary edge at a time to force divergence
        for edge_id in list(primary_ids):
            if len(results) >= max_count:
                break
            candidate = self._dijkstra(
                source=source,
                target=target,
                commodity=commodity,
                use_risk_cost=True,
                forbidden_edges={edge_id},
            )
            if not candidate:
                continue
            if not self._routes_distinct(candidate, primary_route):
                continue
            if any(not self._routes_distinct(candidate, existing) for existing in results):
                continue
            results.append(candidate)

        # Deterministic ranking: cost, risk, ETA, distance
        results.sort(
            key=lambda r: (r.route_cost, r.average_risk, r.eta_hrs, r.total_distance_km)
        )
        return results[:max_count]

    def _find_alternate_route(
        self,
        source: str,
        target: str,
        primary_route: RouteResult,
        commodity: CommodityPriority,
    ) -> Optional[RouteResult]:
        alts = self._find_alternates(source, target, primary_route, commodity, max_count=1)
        return alts[0] if alts else None

    def _classify_risk_level(self, avg_risk: float, max_risk: float) -> str:
        # Map to API-facing levels (LOW/MEDIUM/HIGH/CRITICAL) while keeping
        # legacy SEVERE/MODERATE synonyms for internal advanced tests.
        if max_risk >= 0.8 or avg_risk >= 0.75:
            return "CRITICAL"
        if max_risk >= 0.5 or avg_risk >= 0.5:
            return "HIGH"
        if max_risk >= 0.25 or avg_risk >= 0.25:
            return "MEDIUM"
        return "LOW"

    def _generate_reason(
        self,
        recommended: RouteResult,
        alternate: Optional[RouteResult],
        commodity: CommodityPriority,
    ) -> str:
        avoided = [
            e for e in self.network.edges.values()
            if not e.id.endswith("_rev")
            and (e.traversable is False or e.status == RoadStatus.BLOCKED)
        ]
        avoided_names = [e.name or e.road_id or e.id for e in avoided[:3]]

        if avoided_names and recommended:
            msg = (
                f"Selected because it avoids the {avoided_names[0]} closure."
                if len(avoided_names) == 1
                else f"Selected because it avoids blocked corridors ({', '.join(avoided_names)})."
            )
            if alternate:
                eta_delta = (alternate.eta_hrs - recommended.eta_hrs) * 60.0
                if eta_delta > 1:
                    msg += (
                        f" This option adds {eta_delta:.0f} minutes versus the next "
                        f"alternative but keeps disruption risk at {recommended.risk_level}."
                    )
            return msg

        restricted = [
            e for e in recommended.path_edges
            if e.status == RoadStatus.RESTRICTED
            or (e.suggested_status or "").lower() == "restricted"
        ]
        if restricted:
            return (
                "Restricted road usage adds a condition penalty; monitor before departure. "
                f"Optimal accessible path for {commodity.value}."
            )

        stale_edges = [e for e in recommended.path_edges if e.stale]
        if stale_edges:
            return "Weather observations are stale; route confidence is reduced."

        high_closure = [
            e for e in recommended.path_edges
            if e.closure_probability is not None and e.closure_probability >= 0.4
        ]
        if high_closure:
            horizon = high_closure[0].prediction_horizon_minutes or 120
            return (
                f"Forecast indicates elevated closure risk within the next {horizon} minutes."
            )

        if not alternate:
            if recommended.risk_level in ("HIGH", "CRITICAL", "SEVERE"):
                return (
                    f"Recommended route is the only accessible corridor, but carries "
                    f"{recommended.risk_level} disruption risk."
                )
            return "Recommended route is the optimal accessible path; no viable alternate corridor exists."

        risk_diff = alternate.average_risk - recommended.average_risk
        if risk_diff > 0.15:
            return (
                f"This option reduces disruption risk from {alternate.risk_level} to "
                f"{recommended.risk_level} for essential cargo ({commodity.value})."
            )
        if recommended.total_distance_km <= alternate.total_distance_km:
            return (
                f"Recommended route provides shortest practical travel time "
                f"({recommended.adjusted_travel_time_hrs:.1f}h) and lowest disruption risk."
            )
        return f"Recommended route balances safety and efficiency for {commodity.value} transport."

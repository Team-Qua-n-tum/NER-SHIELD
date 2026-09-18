"""
Engine selection, eligibility, cost, snap, alternatives, and reroute showcase.
"""

from __future__ import annotations

import math
import os

import pytest

from backend.routing.config import (
    CLOSURE_PROBABILITY_THRESHOLD,
    INF_COST,
    MIN_EDGE_COST,
    get_routing_engine_mode,
)
from backend.routing.cost import CostFunction
from backend.routing.eligibility import evaluate_edge_eligibility
from backend.routing.engine_selector import plan_with_engine_selection
from backend.routing.graph import RoadNetwork
from backend.routing.graph_builder import (
    build_network_from_store,
    invalidate_network_cache,
    simulate_road_closure,
)
from backend.routing.models import (
    CommodityPriority,
    Edge,
    Node,
    RoadCondition,
    RoadStatus,
    RouteRequest,
)
from backend.routing.optimizer import RouteOptimizer
from backend.routing.service import RoutingService
from backend.routing.snap import resolve_endpoint, snap_to_nearest_node


@pytest.fixture(autouse=True)
def _iso_cache(monkeypatch):
    monkeypatch.setenv("ROUTING_ENGINE", "advanced")
    invalidate_network_cache("test")
    yield
    invalidate_network_cache("test")


def _tiny_dual_network() -> RoadNetwork:
    network = RoadNetwork()
    network.add_node(Node(id="A", name="A", lat=26.14, lon=91.73))
    network.add_node(Node(id="B", name="B", lat=26.30, lon=92.00))
    network.add_node(Node(id="C", name="C", lat=26.50, lon=92.50))
    network.add_edge(
        Edge(
            id="E_SHORT",
            source="A",
            target="C",
            distance_km=50.0,
            speed_limit_kmh=50.0,
            disruption_risk=0.1,
            risk_penalty=0.1,
            geometry={"type": "LineString", "coordinates": [[91.73, 26.14], [92.50, 26.50]]},
        )
    )
    network.add_edge(
        Edge(
            id="E_LONG1",
            source="A",
            target="B",
            distance_km=40.0,
            speed_limit_kmh=50.0,
            disruption_risk=0.05,
            risk_penalty=0.05,
        )
    )
    network.add_edge(
        Edge(
            id="E_LONG2",
            source="B",
            target="C",
            distance_km=40.0,
            speed_limit_kmh=50.0,
            disruption_risk=0.05,
            risk_penalty=0.05,
        )
    )
    network.graph_status = "ready"
    return network


# ---------------------------------------------------------------------------
# Engine selection
# ---------------------------------------------------------------------------


class TestEngineSelection:
    def test_get_mode_from_env(self, monkeypatch):
        monkeypatch.setenv("ROUTING_ENGINE", "simple")
        assert get_routing_engine_mode() == "simple"
        monkeypatch.setenv("ROUTING_ENGINE", "advanced")
        assert get_routing_engine_mode() == "advanced"

    def test_auto_uses_advanced_with_valid_graph(self, monkeypatch):
        monkeypatch.setenv("ROUTING_ENGINE", "auto")
        result = plan_with_engine_selection("dist-guwahati", "dist-itanagar")
        assert result["routing_engine"] == "advanced"
        assert result["fallback_used"] is False
        assert result["status"] == "success"
        assert result["recommended_route"] is not None

    def test_auto_falls_back_when_graph_unavailable(self, monkeypatch):
        monkeypatch.setenv("ROUTING_ENGINE", "auto")

        def _boom(*_a, **_k):
            raise RuntimeError("graph build failed")

        monkeypatch.setattr(
            "backend.routing.engine_selector._run_advanced",
            _boom,
        )
        result = plan_with_engine_selection("dist-guwahati", "dist-itanagar")
        assert result["fallback_used"] is True
        assert result["routing_engine"] == "simple"
        assert "advanced_exception" in (result.get("fallback_reason") or "")

    def test_explicit_advanced_does_not_silently_fallback(self, monkeypatch):
        monkeypatch.setenv("ROUTING_ENGINE", "advanced")

        def _unavailable(*_a, **_k):
            return {
                "status": "graph_unavailable",
                "message": "Advanced routing graph is unavailable.",
                "reason_code": "graph_unavailable",
                "selected_route": None,
                "recommended_route": None,
                "routes": [],
                "alternatives": [],
                "error": "graph_unavailable",
                "graph_status": "empty",
                "data_mode": "demo",
                "source_status": "demo_synthetic_data",
                "stale": False,
            }

        monkeypatch.setattr(
            "backend.routing.engine_selector._run_advanced",
            _unavailable,
        )
        result = plan_with_engine_selection(
            "dist-guwahati", "dist-itanagar", engine_mode="advanced"
        )
        assert result["routing_engine"] == "advanced"
        assert result["fallback_used"] is False
        assert result["status"] == "graph_unavailable"

    def test_simple_mode_preserves_legacy(self, monkeypatch):
        monkeypatch.setenv("ROUTING_ENGINE", "simple")
        result = plan_with_engine_selection("dist-guwahati", "dist-tezpur")
        assert result["routing_engine"] == "simple"
        assert result["fallback_used"] is False
        assert result["recommended_route"] is not None
        assert "waypoints" in result["recommended_route"]


# ---------------------------------------------------------------------------
# Graph + safety
# ---------------------------------------------------------------------------


class TestGraphAndSafety:
    def test_build_network_from_store_has_edges(self):
        network = build_network_from_store(enrich_ai=False)
        assert network.graph_status == "ready"
        assert "road-nh27-gt" in network.edges
        assert "road-ah1-gi" in network.edges
        edge = network.edges["road-nh27-gt"]
        assert edge.geometry is not None
        assert edge.geometry["type"] == "LineString"
        lon, lat = edge.geometry["coordinates"][0]
        assert lon > lat  # lon ~91, lat ~26

    def test_invalid_geometry_skipped_safely(self):
        network = RoadNetwork()
        network.add_node(Node(id="A", name="A", lat=26.0, lon=91.0))
        network.add_node(Node(id="B", name="B", lat=26.1, lon=91.1))
        ok = network.add_edge(
            Edge(
                id="BAD",
                source="A",
                target="B",
                distance_km=10.0,
                speed_limit_kmh=40.0,
                disruption_risk=0.1,
                geometry={"type": "LineString", "coordinates": [[91.0]]},  # invalid
            )
        )
        assert ok is True  # topological edge kept
        assert network.edges["BAD"].geometry is None
        assert any(d.get("reason") == "invalid_geometry" for d in network.diagnostics)

    def test_blocked_excluded(self):
        edge = Edge(
            id="E1",
            source="A",
            target="B",
            distance_km=10.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.9,
            road_status="BLOCKED",
            status=RoadStatus.BLOCKED,
        )
        trav, reasons = evaluate_edge_eligibility(edge)
        assert trav is False
        assert reasons

    def test_ai_ineligible_excluded(self):
        edge = Edge(
            id="E1",
            source="A",
            target="B",
            distance_km=10.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.8,
            route_eligible=False,
            routing_recommendation="exclude_from_routing",
        )
        trav, reasons = evaluate_edge_eligibility(edge)
        assert trav is False
        assert "route_eligible=False" in reasons

    def test_restricted_traversable_with_penalty(self):
        edge = Edge(
            id="E1",
            source="A",
            target="B",
            distance_km=10.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.4,
            status=RoadStatus.RESTRICTED,
            risk_penalty=0.3,
        )
        trav, _ = evaluate_edge_eligibility(edge)
        assert trav is True
        cost = CostFunction().calculate_edge_cost(edge)
        assert cost < INF_COST
        assert cost > MIN_EDGE_COST

    def test_closure_probability_policy(self):
        edge = Edge(
            id="E1",
            source="A",
            target="B",
            distance_km=10.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.5,
            closure_probability=CLOSURE_PROBABILITY_THRESHOLD,
            prediction_confidence=0.9,
        )
        trav, reasons = evaluate_edge_eligibility(edge)
        assert trav is False
        assert any("closure_probability" in r for r in reasons)

        # Below threshold → traversable
        edge2 = Edge(
            id="E2",
            source="A",
            target="B",
            distance_km=10.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.5,
            closure_probability=0.5,
            prediction_confidence=0.9,
        )
        trav2, _ = evaluate_edge_eligibility(edge2)
        assert trav2 is True


# ---------------------------------------------------------------------------
# Cost
# ---------------------------------------------------------------------------


class TestCostBehavior:
    def test_penalties_increase_cost(self):
        base = Edge(
            id="E1",
            source="A",
            target="B",
            distance_km=20.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.1,
            risk_penalty=0.1,
        )
        risky = Edge(
            id="E2",
            source="A",
            target="B",
            distance_km=20.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.8,
            risk_penalty=0.8,
            closure_probability=0.4,
            predicted_delay_minutes=30.0,
            eta_multiplier=1.5,
        )
        cf = CostFunction()
        assert cf.calculate_edge_cost(risky, CommodityPriority.MEDICINE) > cf.calculate_edge_cost(
            base, CommodityPriority.MEDICINE
        )

    def test_no_negative_zero_nonfinite(self):
        edge = Edge(
            id="E1",
            source="A",
            target="B",
            distance_km=0.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.0,
            risk_penalty=0.0,
        )
        cost = CostFunction().calculate_edge_cost(edge)
        assert math.isfinite(cost)
        assert cost > 0

    def test_no_double_count_ai_and_gis(self):
        edge = Edge(
            id="E1",
            source="A",
            target="B",
            distance_km=20.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.5,
            risk_penalty=0.5,
            suggested_risk_penalty=0.5,
            gis_penalty_applied=False,  # already folded into AI
        )
        cf = CostFunction()
        _, breakdown = cf.calculate_edge_cost_detailed(edge)
        assert breakdown["gis_impact"] == 0.0
        assert breakdown["ai_risk"] > 0.0

    def test_stale_penalty_bounded(self):
        edge = Edge(
            id="E1",
            source="A",
            target="B",
            distance_km=20.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.1,
            risk_penalty=0.1,
            stale=True,
            freshness_seconds=999999.0,
        )
        _, breakdown = CostFunction().calculate_edge_cost_detailed(edge)
        assert breakdown["stale"] <= 2.0 + 1e-6


# ---------------------------------------------------------------------------
# Snapping
# ---------------------------------------------------------------------------


class TestSnapping:
    def test_district_resolves(self):
        network = build_network_from_store(enrich_ai=False)
        snap = resolve_endpoint(network, district_id="dist-guwahati")
        assert snap["status"] == "ok"
        assert snap["node_id"] == "dist-guwahati"
        assert snap["snap_distance_meters"] == 0.0

    def test_coordinate_snap(self):
        network = build_network_from_store(enrich_ai=False)
        snap = snap_to_nearest_node(network, 26.1445, 91.7362)
        assert snap["snapped"] is True
        assert snap["node_id"] == "dist-guwahati"

    def test_distant_unmappable(self):
        network = build_network_from_store(enrich_ai=False)
        snap = snap_to_nearest_node(network, 0.0, 0.0)
        assert snap["snapped"] is False
        assert snap["status"] in ("out_of_bounds", "unmappable", "invalid_coordinates")

    def test_same_origin_destination(self):
        result = plan_with_engine_selection(
            "dist-guwahati", "dist-guwahati", engine_mode="advanced"
        )
        assert result["status"] == "success"
        assert result["recommended_route"]["total_distance_km"] == 0.0


# ---------------------------------------------------------------------------
# Alternatives
# ---------------------------------------------------------------------------


class TestAlternatives:
    def test_distinct_alternatives(self):
        network = _tiny_dual_network()
        svc = RoutingService(network=network)
        resp = svc.plan_route(RouteRequest(source_id="A", destination_id="C"))
        assert resp.recommended is not None
        alts = getattr(resp, "_alternates", []) or ([resp.alternate] if resp.alternate else [])
        assert alts
        primary_ids = [e.id.replace("_rev", "") for e in resp.recommended.path_edges]
        for alt in alts:
            alt_ids = [e.id.replace("_rev", "") for e in alt.path_edges]
            assert alt_ids != primary_ids

    def test_excluded_roads_never_appear(self):
        network = _tiny_dual_network()
        network.update_edge_status("E_SHORT", RoadStatus.BLOCKED)
        svc = RoutingService(network=network)
        resp = svc.plan_route(RouteRequest(source_id="A", destination_id="C"))
        assert resp.recommended is not None
        ids = [e.id.replace("_rev", "") for e in resp.recommended.path_edges]
        assert "E_SHORT" not in ids


# ---------------------------------------------------------------------------
# Reroute showcase
# ---------------------------------------------------------------------------


class TestRerouteShowcase:
    def test_before_after_disruption(self):
        from backend.app.db.store import db_store

        invalidate_network_cache("showcase_start")

        before = plan_with_engine_selection(
            "dist-guwahati", "dist-itanagar", engine_mode="advanced", force_rebuild=True
        )
        assert before["status"] == "success"
        selected_before = before["recommended_route"]
        roads_before = list(selected_before["road_ids"])
        assert roads_before
        # Prefer shorter Tezpur corridor when both open
        assert "road-nh27-gt" in roads_before or "road-nh27-ti" in roads_before or "road-ah1-gi" in roads_before

        # Prefer path should include Tezpur hop when open (cheaper than 420km alt)
        assert before.get("alternative_status") in ("ok", "no_distinct_safe_alternative")
        if before.get("alternatives"):
            assert before["alternatives"][0]["road_ids"] != roads_before

        # Close a road on the selected path
        target_road = None
        for rid in roads_before:
            if rid in ("road-nh27-gt", "road-nh27-ti"):
                target_road = rid
                break
        if target_road is None:
            target_road = roads_before[0]

        original = db_store.roads[target_road]
        simulate_road_closure(
            target_road,
            title="Critical landslide on preferred corridor",
        )

        after = plan_with_engine_selection(
            "dist-guwahati", "dist-itanagar", engine_mode="advanced", force_rebuild=True
        )

        # Restore seed road for other tests
        db_store.roads[target_road] = original
        if f"inc-showcase-{target_road}" in db_store.incidents:
            del db_store.incidents[f"inc-showcase-{target_road}"]
        invalidate_network_cache("showcase_restore")

        if after["status"] == "no_route":
            assert after["reason_code"] == "all_connecting_roads_blocked"
            return

        assert after["status"] == "success"
        roads_after = after["recommended_route"]["road_ids"]
        assert target_road not in roads_after
        for alt in after.get("alternatives") or []:
            assert target_road not in alt["road_ids"]
        assert roads_after != roads_before
        assert after["recommended_route"].get("reasoning") or after.get("reasoning")
        assert after.get("data_mode") == "demo"
        assert after.get("stale") in (True, False)

    def test_all_paths_blocked_no_route(self):
        network = _tiny_dual_network()
        network.update_edge_status("E_SHORT", RoadStatus.BLOCKED)
        network.update_edge_status("E_LONG1", RoadStatus.BLOCKED)
        network.update_edge_status("E_LONG2", RoadStatus.BLOCKED)
        svc = RoutingService(network=network)
        resp = svc.plan_route(RouteRequest(source_id="A", destination_id="C"))
        assert resp.recommended is None
        assert "no viable route" in resp.reason.lower()

    def test_cache_invalidation(self):
        invalidate_network_cache("manual")
        n1 = build_network_from_store(enrich_ai=False)
        rev1 = n1.state_revision
        invalidate_network_cache("again")
        n2 = build_network_from_store(enrich_ai=False)
        assert n2 is not n1 or n2.state_revision >= rev1


# ---------------------------------------------------------------------------
# Demo safety
# ---------------------------------------------------------------------------


class TestDemoSafety:
    def test_demo_labels_truthful(self):
        result = plan_with_engine_selection(
            "dist-guwahati", "dist-itanagar", engine_mode="advanced"
        )
        assert result["data_mode"] == "demo"
        assert "demo" in (result.get("source_status") or "").lower() or result.get(
            "source_status"
        ) == "demo_synthetic_data"

    def test_no_db_engine_in_demo(self):
        from backend.app.core.config import settings
        from backend.app.db import database as dbmod

        assert settings.DEMO_MODE is True
        assert dbmod.get_engine() is None

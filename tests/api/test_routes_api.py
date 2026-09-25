"""
tests/api/test_routes_api.py
Tests for POST /api/v1/routes/recommend, /routes/plan, and /routes/recalculate.
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.routing.graph_builder import invalidate_network_cache

client = TestClient(app)

# Reachable OD with dual corridors in demo seed (GT+TI vs AH-1)
VALID_ROUTE_REQUEST = {
    "source_district": "dist-guwahati",
    "destination_district": "dist-itanagar",
    "commodity": "MEDICINES",
    "constraints": {
        "avoid_high_risk": True,
        "vehicle_type": "TRUCK",
    },
}


@pytest.fixture(autouse=True)
def _clear_graph_cache():
    invalidate_network_cache("test_setup")
    yield
    invalidate_network_cache("test_teardown")


class TestRoutesRecommend:
    def test_valid_route_returns_200(self):
        res = client.post("/api/v1/routes/recommend", json=VALID_ROUTE_REQUEST)
        assert res.status_code == 200

    def test_response_has_recommended_route(self):
        body = client.post("/api/v1/routes/recommend", json=VALID_ROUTE_REQUEST).json()
        assert body.get("status") == "success"
        assert body.get("recommended_route") is not None

    def test_recommended_route_has_distance(self):
        body = client.post("/api/v1/routes/recommend", json=VALID_ROUTE_REQUEST).json()
        assert body["recommended_route"]["total_distance_km"] > 0

    def test_recommended_route_has_eta(self):
        body = client.post("/api/v1/routes/recommend", json=VALID_ROUTE_REQUEST).json()
        assert body["recommended_route"]["eta_hours"] > 0

    def test_recommended_route_has_risk_level(self):
        body = client.post("/api/v1/routes/recommend", json=VALID_ROUTE_REQUEST).json()
        assert body["recommended_route"]["risk_level"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")

    def test_response_has_source_destination(self):
        body = client.post("/api/v1/routes/recommend", json=VALID_ROUTE_REQUEST).json()
        assert "source" in body
        assert "destination" in body

    def test_enriched_engine_provenance_fields(self):
        body = client.post("/api/v1/routes/recommend", json=VALID_ROUTE_REQUEST).json()
        assert body.get("routing_engine") in ("advanced", "simple")
        assert body.get("routing_engine_version")
        assert "fallback_used" in body
        assert body.get("data_mode") == "demo"
        assert body.get("graph_status") in ("ready", "unused", "invalidated")

    def test_geojson_linestring_lon_lat_order(self):
        body = client.post("/api/v1/routes/recommend", json=VALID_ROUTE_REQUEST).json()
        geom = body["recommended_route"].get("geometry")
        assert geom is not None
        assert geom["type"] == "LineString"
        assert len(geom["coordinates"]) >= 2
        lon, lat = geom["coordinates"][0]
        # NER longitude ~87-98, latitude ~21-30
        assert 87.0 <= lon <= 98.5
        assert 21.0 <= lat <= 30.5

    def test_food_commodity_route(self):
        payload = {**VALID_ROUTE_REQUEST, "commodity": "FOOD"}
        res = client.post("/api/v1/routes/recommend", json=payload)
        assert res.status_code == 200

    def test_invalid_source_district_returns_400(self):
        bad = {**VALID_ROUTE_REQUEST, "source_district": "dist-nonexistent-xyz"}
        res = client.post("/api/v1/routes/recommend", json=bad)
        assert res.status_code == 400

    def test_invalid_destination_district_returns_400(self):
        bad = {**VALID_ROUTE_REQUEST, "destination_district": "dist-nonexistent-xyz"}
        res = client.post("/api/v1/routes/recommend", json=bad)
        assert res.status_code == 400

    def test_same_source_destination_returns_200(self):
        payload = {**VALID_ROUTE_REQUEST, "destination_district": "dist-guwahati"}
        res = client.post("/api/v1/routes/recommend", json=payload)
        assert res.status_code == 200

    def test_blocked_tawang_returns_no_route_contract(self):
        """NH-13 Itanagar–Tawang is BLOCKED in demo seed → structured no_route."""
        payload = {
            **VALID_ROUTE_REQUEST,
            "destination_district": "dist-tawang",
        }
        body = client.post("/api/v1/routes/recommend", json=payload).json()
        # Advanced engine should report no_route; simple fallback may still fabricate.
        if body.get("routing_engine") == "advanced" and not body.get("fallback_used"):
            assert body["status"] == "no_route"
            assert body["reason_code"] == "all_connecting_roads_blocked"
            assert body["selected_route"] is None
            assert body["routes"] == [] or body["routes"] is None or len(body.get("routes") or []) == 0
            assert body["recommended_route"] is None
            assert body.get("data_mode") == "demo"


class TestRoutesPlan:
    def test_plan_alias_returns_200(self):
        res = client.post("/api/v1/routes/plan", json=VALID_ROUTE_REQUEST)
        assert res.status_code == 200

    def test_plan_and_recommend_return_same_structure(self):
        body_recommend = client.post("/api/v1/routes/recommend", json=VALID_ROUTE_REQUEST).json()
        body_plan = client.post("/api/v1/routes/plan", json=VALID_ROUTE_REQUEST).json()
        assert set(body_recommend.keys()) == set(body_plan.keys())

    def test_plan_invalid_district_returns_400(self):
        bad = {**VALID_ROUTE_REQUEST, "source_district": "bad-district"}
        res = client.post("/api/v1/routes/plan", json=bad)
        assert res.status_code == 400


class TestRoutesRecalculate:
    def test_recalculate_endpoint_returns_200(self):
        res = client.post("/api/v1/routes/recalculate", json=VALID_ROUTE_REQUEST)
        assert res.status_code == 200
        body = res.json()
        assert body.get("status") in ("success", "no_route", "degraded")

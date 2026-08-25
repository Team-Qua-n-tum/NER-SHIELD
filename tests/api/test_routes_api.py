"""
tests/api/test_routes_api.py
Tests for POST /api/v1/routes/recommend and /routes/plan endpoints.
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

VALID_ROUTE_REQUEST = {
    "source_district": "dist-guwahati",
    "destination_district": "dist-tawang",
    "commodity": "MEDICINES",
    "constraints": {
        "avoid_high_risk": True,
        "vehicle_type": "TRUCK",
    },
}


class TestRoutesRecommend:
    def test_valid_route_returns_200(self):
        res = client.post("/api/v1/routes/recommend", json=VALID_ROUTE_REQUEST)
        assert res.status_code == 200

    def test_response_has_recommended_route(self):
        body = client.post("/api/v1/routes/recommend", json=VALID_ROUTE_REQUEST).json()
        assert "recommended_route" in body

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

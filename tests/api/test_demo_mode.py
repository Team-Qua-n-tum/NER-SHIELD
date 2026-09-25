"""
tests/api/test_demo_mode.py
Verifies that the application is fully functional in DEMO_MODE=true
(the default) without any database connection.
"""

import os
import pytest
import sys

# Force demo mode for this test module
os.environ.setdefault("DEMO_MODE", "true")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestDemoMode:
    """All endpoints must work correctly in DEMO_MODE=true."""

    def test_health_demo_mode_true(self):
        body = client.get("/health").json()
        assert body["demo_mode"] is True

    def test_districts_available_in_demo(self):
        body = client.get("/api/v1/districts").json()
        assert body["total"] >= 8

    def test_roads_available_in_demo(self):
        body = client.get("/api/v1/roads").json()
        assert body["total"] >= 5

    def test_incidents_available_in_demo(self):
        body = client.get("/api/v1/incidents").json()
        assert body["total"] >= 1

    def test_vehicles_available_in_demo(self):
        body = client.get("/api/v1/vehicles").json()
        assert body["total"] >= 1

    def test_alerts_available_in_demo(self):
        body = client.get("/api/v1/alerts").json()
        assert body["total"] >= 1

    def test_risk_prediction_works_in_demo(self):
        res = client.post("/api/v1/risk/predict", json={
            "rainfall_mm": 120.0,
            "slope_degree": 35.0,
            "weather_condition": "HEAVY_RAIN",
        })
        assert res.status_code == 200

    def test_route_planning_works_in_demo(self):
        res = client.post("/api/v1/routes/recommend", json={
            "source_district": "dist-guwahati",
            "destination_district": "dist-shillong",
            "commodity": "FOOD",
        })
        assert res.status_code == 200

    def test_dashboard_available_in_demo(self):
        res = client.get("/api/v1/dashboard")
        assert res.status_code == 200
        body = res.json()
        assert "districts_monitored" in body
        assert "total_roads" in body

    def test_no_db_connection_needed(self):
        """
        In demo mode, all CRUD operations must work without a live PostgreSQL server.
        This test passes if the above tests all pass (they would fail if DB was required).
        """
        # Create an incident — must work without DB
        res = client.post("/api/v1/incidents", json={
            "title": "Demo Mode Test Incident",
            "incident_type": "FLOOD",
            "severity": "MODERATE",
            "district_id": "dist-guwahati",
            "lat": 26.15,
            "lng": 91.77,
            "description": "Test in demo mode",
            "reported_by": "Test Suite",
        })
        assert res.status_code == 201

"""
tests/api/test_incidents_api.py
Tests for /api/v1/incidents CRUD endpoints.
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

VALID_INCIDENT = {
    "title": "Test Landslide - API Test",
    "incident_type": "LANDSLIDE",
    "severity": "SEVERE",
    "district_id": "dist-guwahati",
    "road_id": "road-nh27-gt",
    "lat": 26.2000,
    "lng": 91.8000,
    "description": "Large rocks blocking NH-27 near Guwahati.",
    "reported_by": "Test Suite",
}


class TestIncidentsList:
    def test_get_incidents_returns_200(self):
        res = client.get("/api/v1/incidents")
        assert res.status_code == 200

    def test_get_incidents_has_total(self):
        body = client.get("/api/v1/incidents").json()
        assert "total" in body
        assert isinstance(body["total"], int)

    def test_get_incidents_has_list(self):
        body = client.get("/api/v1/incidents").json()
        assert "incidents" in body
        assert isinstance(body["incidents"], list)

    def test_seed_incidents_exist(self):
        body = client.get("/api/v1/incidents").json()
        assert body["total"] >= 1


class TestCreateIncident:
    def test_create_incident_returns_201(self):
        res = client.post("/api/v1/incidents", json=VALID_INCIDENT)
        assert res.status_code == 201

    def test_create_incident_response_fields(self):
        body = client.post("/api/v1/incidents", json=VALID_INCIDENT).json()
        assert "id" in body
        assert body["title"] == VALID_INCIDENT["title"]
        assert body["incident_type"] == "LANDSLIDE"

    def test_create_incident_id_format(self):
        body = client.post("/api/v1/incidents", json=VALID_INCIDENT).json()
        assert body["id"].startswith("inc-")

    def test_create_incident_default_status(self):
        body = client.post("/api/v1/incidents", json=VALID_INCIDENT).json()
        assert body["status"] == "ACTIVE"

    def test_create_increments_total(self):
        before = client.get("/api/v1/incidents").json()["total"]
        client.post("/api/v1/incidents", json=VALID_INCIDENT)
        after = client.get("/api/v1/incidents").json()["total"]
        assert after == before + 1

    def test_missing_required_field_returns_422(self):
        bad = {k: v for k, v in VALID_INCIDENT.items() if k != "title"}
        res = client.post("/api/v1/incidents", json=bad)
        assert res.status_code == 422


class TestGetSingleIncident:
    def test_get_existing_incident_returns_200(self):
        created = client.post("/api/v1/incidents", json=VALID_INCIDENT).json()
        res = client.get(f"/api/v1/incidents/{created['id']}")
        assert res.status_code == 200
        assert res.json()["id"] == created["id"]

    def test_get_nonexistent_incident_returns_404(self):
        res = client.get("/api/v1/incidents/inc-does-not-exist-99999")
        assert res.status_code == 404


class TestUpdateIncidentStatus:
    def test_update_status_to_in_progress(self):
        created = client.post("/api/v1/incidents", json=VALID_INCIDENT).json()
        res = client.patch(
            f"/api/v1/incidents/{created['id']}/status",
            json={"status": "IN_PROGRESS", "notes": "Teams dispatched"},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "IN_PROGRESS"

    def test_update_status_to_resolved(self):
        created = client.post("/api/v1/incidents", json=VALID_INCIDENT).json()
        res = client.patch(
            f"/api/v1/incidents/{created['id']}/status",
            json={"status": "RESOLVED"},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "RESOLVED"

    def test_update_nonexistent_incident_returns_404(self):
        res = client.patch(
            "/api/v1/incidents/inc-nonexistent/status",
            json={"status": "RESOLVED"},
        )
        assert res.status_code == 404

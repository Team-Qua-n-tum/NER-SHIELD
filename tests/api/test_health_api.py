"""
tests/api/test_health_api.py
Tests for the /health endpoint.
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_root_health_returns_200(self):
        res = client.get("/health")
        assert res.status_code == 200

    def test_root_health_status_ok(self):
        body = client.get("/health").json()
        assert body["status"] == "ok"

    def test_root_health_has_required_fields(self):
        body = client.get("/health").json()
        required = {
            "status", "service", "version", "timestamp",
            "database_connected", "ai_engine_ready",
            "routing_engine_ready", "demo_mode",
        }
        assert required.issubset(body.keys())

    def test_root_health_ai_engine_ready(self):
        assert client.get("/health").json()["ai_engine_ready"] is True

    def test_root_health_routing_engine_ready(self):
        assert client.get("/health").json()["routing_engine_ready"] is True

    def test_root_health_demo_mode_is_bool(self):
        assert isinstance(client.get("/health").json()["demo_mode"], bool)

    def test_api_v1_health_returns_200(self):
        res = client.get("/api/v1/health")
        assert res.status_code == 200

    def test_api_v1_health_status_ok(self):
        assert client.get("/api/v1/health").json()["status"] == "ok"

    def test_version_field_is_semver(self):
        version = client.get("/health").json()["version"]
        parts = version.split(".")
        assert len(parts) >= 2, f"Version {version!r} is not semver-like"

    def test_no_double_prefix_path(self):
        """Ensure the erroneous /api/v1/api/v1/health does NOT exist."""
        res = client.get("/api/v1/api/v1/health")
        assert res.status_code == 404

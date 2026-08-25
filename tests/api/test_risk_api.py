"""
tests/api/test_risk_api.py
Tests for POST /api/v1/risk/predict endpoint.
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestRiskPredict:
    def test_low_risk_inputs_returns_200(self):
        payload = {
            "rainfall_mm": 0.0,
            "slope_degree": 5.0,
            "weather_condition": "CLEAR",
            "soil_type": "ROCKY",
            "historical_landslides_count": 0,
            "active_incidents_count": 0,
        }
        res = client.post("/api/v1/risk/predict", json=payload)
        assert res.status_code == 200

    def test_low_risk_inputs_returns_low_level(self):
        payload = {
            "rainfall_mm": 0.0,
            "slope_degree": 5.0,
            "weather_condition": "CLEAR",
            "soil_type": "ROCKY",
            "historical_landslides_count": 0,
            "active_incidents_count": 0,
        }
        body = client.post("/api/v1/risk/predict", json=payload).json()
        assert body["risk_level"] in ("LOW", "MEDIUM")

    def test_high_risk_inputs_returns_high_level(self):
        payload = {
            "rainfall_mm": 250.0,
            "slope_degree": 55.0,
            "weather_condition": "HEAVY_RAIN",
            "soil_type": "CLAY",
            "historical_landslides_count": 8,
            "active_incidents_count": 4,
        }
        body = client.post("/api/v1/risk/predict", json=payload).json()
        assert body["risk_level"] in ("HIGH", "CRITICAL")
        assert body["risk_probability"] > 0.5

    def test_response_has_required_fields(self):
        payload = {"rainfall_mm": 100.0, "slope_degree": 30.0}
        body = client.post("/api/v1/risk/predict", json=payload).json()
        required = {
            "risk_probability", "risk_level", "risk_factors",
            "confidence_score", "recommendation", "model_version", "calculated_at",
        }
        assert required.issubset(body.keys())

    def test_risk_probability_in_range(self):
        payload = {"rainfall_mm": 75.0, "slope_degree": 25.0, "weather_condition": "RAIN"}
        body = client.post("/api/v1/risk/predict", json=payload).json()
        assert 0.0 <= body["risk_probability"] <= 1.0

    def test_risk_factors_is_list(self):
        payload = {"rainfall_mm": 150.0, "slope_degree": 40.0, "weather_condition": "HEAVY_RAIN"}
        body = client.post("/api/v1/risk/predict", json=payload).json()
        assert isinstance(body["risk_factors"], list)

    def test_recommendation_is_non_empty_string(self):
        payload = {"rainfall_mm": 50.0}
        body = client.post("/api/v1/risk/predict", json=payload).json()
        assert isinstance(body["recommendation"], str)
        assert len(body["recommendation"]) > 0

    def test_model_version_is_string(self):
        body = client.post("/api/v1/risk/predict", json={"rainfall_mm": 0.0}).json()
        assert isinstance(body["model_version"], str)

    def test_negative_rainfall_rejected(self):
        res = client.post("/api/v1/risk/predict", json={"rainfall_mm": -10.0})
        assert res.status_code == 422

    def test_slope_over_90_rejected(self):
        res = client.post("/api/v1/risk/predict", json={"slope_degree": 95.0})
        assert res.status_code == 422

    def test_optional_district_id_accepted(self):
        res = client.post("/api/v1/risk/predict", json={
            "district_id": "dist-shillong",
            "rainfall_mm": 80.0,
        })
        assert res.status_code == 200

    def test_defaults_work_when_body_is_empty(self):
        res = client.post("/api/v1/risk/predict", json={})
        assert res.status_code == 200

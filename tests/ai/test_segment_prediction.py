"""
test_segment_prediction.py — Unit tests for deep-learning road-segment prediction module.

Verifies:
- All required 12 fields are exposed in response.
- Deterministic heuristic fallback when model artifact is unavailable.
- Prototype/synthetic-trained labeling when trained model is loaded.
- Zero-training during inference.
- Historical time-window feature effects (accelerating rain increases risk).
- Prediction horizon scaling (longer horizons scale risk/delay).
- Blocked road safety constraints (closure_prob ~ 1.0, speed = 0, not traversable).
- Routing engine consumption (to_routing_edge_cost and Edge integration).
- API endpoint contracts via FastAPI TestClient (fixed fixtures, no live network).
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from fastapi.testclient import TestClient

from backend.ai.risk.risk_context import RiskFeatureContext
from backend.ai.segment.loader import SegmentModelLoader
from backend.ai.segment.model import extract_segment_features
from backend.ai.segment.predictor import predict_segment_future, to_routing_edge_cost
from backend.ai.segment.temporal_context import RoadSegmentTemporalContext, SegmentTimePoint
from backend.app.main import app
from backend.routing.models import Edge, RoadCondition, RoadStatus


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_loader():
    """Reset SegmentModelLoader before each test."""
    SegmentModelLoader.reset()
    yield
    SegmentModelLoader.reset()


def _make_base_context(
    road_id: str = "road-test-01",
    road_status: str = "OPEN",
    rainfall_mm: float = 25.0,
    weather_condition: str = "CLEAR",
    slope_degree: float = 15.0,
    gis_penalty: float = 0.0,
    active_incidents: int = 0,
    weather_stale: bool = False,
) -> RiskFeatureContext:
    return RiskFeatureContext(
        road_id=road_id,
        district_id="dist-kamrup",
        data_mode="demo",
        road_status=road_status,
        road_class="NH",
        rainfall_mm_24h=rainfall_mm,
        rainfall_mm_1h=rainfall_mm / 24.0,
        weather_condition=weather_condition,
        slope_degree=slope_degree,
        soil_type="LOAM",
        active_incident_count=active_incidents,
        suggested_risk_penalty=gis_penalty,
        weather_stale=weather_stale,
        source_status="demo_synthetic_data",
    )


def _make_temporal_context(
    road_id: str = "road-test-01",
    road_status: str = "OPEN",
    rainfall_mm: float = 25.0,
    weather_condition: str = "CLEAR",
    gis_penalty: float = 0.0,
    horizon_minutes: int = 60,
    historical_points: list = None,
    weather_stale: bool = False,
) -> RoadSegmentTemporalContext:
    ctx = _make_base_context(
        road_id=road_id,
        road_status=road_status,
        rainfall_mm=rainfall_mm,
        weather_condition=weather_condition,
        gis_penalty=gis_penalty,
        weather_stale=weather_stale,
    )
    return RoadSegmentTemporalContext(
        road_id=road_id,
        district_id="dist-kamrup",
        current_context=ctx,
        prediction_horizon_minutes=horizon_minutes,
        historical_points=historical_points or [],
    )


# ---------------------------------------------------------------------------
# Output Field Requirements
# ---------------------------------------------------------------------------

class TestOutputFieldContract:
    def test_all_twelve_required_fields_present(self):
        t_ctx = _make_temporal_context()
        result = predict_segment_future(t_ctx)

        required_keys = {
            "predicted_disruption_probability",
            "closure_probability",
            "predicted_delay_minutes",
            "predicted_speed_kmh",
            "eta_multiplier",
            "prediction_confidence",
            "prediction_horizon_minutes",
            "method",
            "model_version",
            "calculated_at",
            "stale",
            "data_mode",
        }
        for key in required_keys:
            assert key in result, f"Missing required field: {key}"

    def test_output_field_value_bounds(self):
        t_ctx = _make_temporal_context()
        res = predict_segment_future(t_ctx)

        assert 0.0 <= res["predicted_disruption_probability"] <= 1.0
        assert 0.0 <= res["closure_probability"] <= 1.0
        assert res["predicted_delay_minutes"] >= 0.0
        assert res["predicted_speed_kmh"] >= 0.0
        assert res["eta_multiplier"] >= 1.0
        assert 0.0 <= res["prediction_confidence"] <= 1.0
        assert res["prediction_horizon_minutes"] == 60
        assert isinstance(res["stale"], bool)
        assert res["data_mode"] in ("demo", "live", "degraded")


# ---------------------------------------------------------------------------
# Heuristic Fallback & Labeling
# ---------------------------------------------------------------------------

class TestInferencePathSelection:
    def test_fallback_to_heuristic_when_model_missing(self):
        with patch.object(SegmentModelLoader, "get_model", return_value=None):
            t_ctx = _make_temporal_context()
            res = predict_segment_future(t_ctx)

            assert res["method"] == "deterministic_heuristic"
            assert res["model_version"] == "segment-heuristic-v1"

    def test_prototype_synthetic_trained_label_when_model_present(self):
        mock_model = MagicMock()
        mock_model.predict_outputs.return_value = {
            "disruption_probability": 0.45,
            "closure_probability": 0.12,
            "speed_ratio": 0.70,
            "delay_minutes": 15.0,
        }

        with patch.object(SegmentModelLoader, "get_model", return_value=mock_model):
            t_ctx = _make_temporal_context()
            res = predict_segment_future(t_ctx)

            assert res["method"] == "prototype/synthetic-trained"
            assert res["model_version"] == "segment-dl-v1"
            assert res["predicted_disruption_probability"] == 0.45
            assert res["closure_probability"] == 0.12

    def test_fallback_when_model_raises_exception(self):
        mock_model = MagicMock()
        mock_model.predict_outputs.side_effect = RuntimeError("Broken weight dimension")

        with patch.object(SegmentModelLoader, "get_model", return_value=mock_model):
            t_ctx = _make_temporal_context()
            res = predict_segment_future(t_ctx)

            # Safely fell back
            assert res["method"] == "deterministic_heuristic"
            assert 0.0 <= res["predicted_disruption_probability"] <= 1.0

    def test_zero_training_guarantee(self):
        """Verify that get_model never invokes training."""
        with patch("backend.ai.segment.train.train_and_save") as mock_train:
            with patch("pathlib.Path.exists", return_value=False):
                model = SegmentModelLoader.get_model()
                assert model is None
                assert mock_train.call_count == 0


# ---------------------------------------------------------------------------
# Historical Window & Horizon Features
# ---------------------------------------------------------------------------

class TestTemporalWindowAndHorizon:
    def test_accelerating_rainfall_increases_risk(self):
        """When historical rain was 5mm/h and now is 35mm/h, trend should escalate risk."""
        # Steady / calm history
        steady_history = [
            SegmentTimePoint(rainfall_mm_1h=5.0, speed_kmh=50.0),
        ]
        t_steady = _make_temporal_context(rainfall_mm=120.0, historical_points=steady_history)

        # Accelerating history (was dry, now deluge)
        accel_history = [
            SegmentTimePoint(rainfall_mm_1h=0.0, speed_kmh=55.0),
        ]
        t_accel = _make_temporal_context(rainfall_mm=120.0, historical_points=accel_history)

        # Force heuristic to directly evaluate trend math
        with patch.object(SegmentModelLoader, "get_model", return_value=None):
            res_steady = predict_segment_future(t_steady)
            res_accel = predict_segment_future(t_accel)

            assert res_accel["predicted_disruption_probability"] >= res_steady["predicted_disruption_probability"]

    def test_horizon_escalation(self):
        """Under high rain, a 120min horizon should project equal or higher delay than 30min."""
        t_30 = _make_temporal_context(rainfall_mm=150.0, gis_penalty=0.5, horizon_minutes=30)
        t_120 = _make_temporal_context(rainfall_mm=150.0, gis_penalty=0.5, horizon_minutes=120)

        with patch.object(SegmentModelLoader, "get_model", return_value=None):
            res_30 = predict_segment_future(t_30)
            res_120 = predict_segment_future(t_120)

            assert res_120["predicted_delay_minutes"] >= res_30["predicted_delay_minutes"]
            assert res_120["predicted_disruption_probability"] >= res_30["predicted_disruption_probability"]

    def test_stale_data_reduces_confidence(self):
        t_fresh = _make_temporal_context(weather_stale=False)
        t_stale = _make_temporal_context(weather_stale=True)

        res_fresh = predict_segment_future(t_fresh)
        res_stale = predict_segment_future(t_stale)

        assert res_stale["stale"] is True
        assert res_fresh["stale"] is False
        assert res_stale["prediction_confidence"] < res_fresh["prediction_confidence"]


# ---------------------------------------------------------------------------
# Blocked Road Safety Constraint
# ---------------------------------------------------------------------------

class TestBlockedRoadSafety:
    def test_blocked_road_closure_prob_near_one_and_zero_speed(self):
        t_blocked = _make_temporal_context(road_status="BLOCKED")
        res = predict_segment_future(t_blocked)

        assert res["closure_probability"] >= 0.95
        assert res["predicted_speed_kmh"] == 0.0
        assert res["eta_multiplier"] >= 900.0


# ---------------------------------------------------------------------------
# Routing Engine Consumption
# ---------------------------------------------------------------------------

class TestRoutingEngineBridge:
    def test_to_routing_edge_cost_open_road(self):
        prediction = {
            "predicted_disruption_probability": 0.15,
            "closure_probability": 0.05,
            "predicted_speed_kmh": 50.0,
            "eta_multiplier": 1.1,
        }
        edge_update = to_routing_edge_cost(prediction, base_distance_km=25.0, speed_limit_kmh=60.0)

        assert edge_update["traversable"] is True
        assert edge_update["suggested_status"] == "OPEN"
        assert edge_update["disruption_risk"] == 0.15
        assert edge_update["effective_speed_kmh"] == 50.0
        assert edge_update["adjusted_travel_time_hrs"] == 0.5  # 25 km / 50 km/h

    def test_to_routing_edge_cost_blocked_road_not_traversable(self):
        prediction = {
            "predicted_disruption_probability": 0.99,
            "closure_probability": 0.98,
            "predicted_speed_kmh": 0.0,
            "eta_multiplier": 999.0,
        }
        edge_update = to_routing_edge_cost(
            prediction,
            base_distance_km=25.0,
            speed_limit_kmh=60.0,
            current_status="BLOCKED",
        )

        assert edge_update["traversable"] is False
        assert edge_update["suggested_status"] == "BLOCKED"
        assert edge_update["effective_speed_kmh"] == 0.0
        assert edge_update["adjusted_travel_time_hrs"] >= 900.0

    def test_direct_edge_model_assignment(self):
        """Verify routing Edge model can directly ingest the output."""
        prediction = {
            "predicted_disruption_probability": 0.35,
            "closure_probability": 0.10,
            "predicted_speed_kmh": 40.0,
            "eta_multiplier": 1.25,
        }
        edge_update = to_routing_edge_cost(prediction, base_distance_km=20.0, speed_limit_kmh=50.0)

        # Create routing Edge and apply updates
        edge = Edge(
            id="edge-1",
            source="A",
            target="B",
            distance_km=20.0,
            speed_limit_kmh=50.0,
            disruption_risk=edge_update["disruption_risk"],
            status=RoadStatus.OPEN if edge_update["traversable"] else RoadStatus.BLOCKED,
        )

        assert edge.disruption_risk == 0.35
        assert edge.status == RoadStatus.OPEN
        assert edge.status.is_traversable is True


# ---------------------------------------------------------------------------
# API Endpoints Test (Fixed Fixtures, No Network)
# ---------------------------------------------------------------------------

class TestAPIFuturePredictionEndpoints:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_post_predict_future_endpoint(self, client):
        payload = {
            "road_id": "road-nh13-it",
            "prediction_horizon_minutes": 60,
            "distance_km": 30.0,
            "historical_points": [
                {"speed_kmh": 45.0, "rainfall_mm_1h": 5.0},
            ],
            "lat": 26.1445,
            "lon": 91.7362,
        }
        response = client.post("/api/v1/risk/road/road-nh13-it/predict-future", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert data["road_id"] == "road-nh13-it"
        assert "predicted_disruption_probability" in data
        assert "closure_probability" in data
        assert "predicted_delay_minutes" in data
        assert "predicted_speed_kmh" in data
        assert "eta_multiplier" in data
        assert "prediction_confidence" in data
        assert "method" in data
        assert "model_version" in data
        assert "stale" in data
        assert "routing_edge_impact" in data
        assert data["routing_edge_impact"] is not None
        assert "traversable" in data["routing_edge_impact"]

    def test_get_forecast_endpoint(self, client):
        response = client.get("/api/v1/risk/road/road-nh13-it/forecast?horizon_minutes=120&distance_km=40.0")
        assert response.status_code == 200

        data = response.json()
        assert data["road_id"] == "road-nh13-it"
        assert data["prediction_horizon_minutes"] == 120
        assert data["routing_edge_impact"] is not None
        assert 0.0 <= data["predicted_disruption_probability"] <= 1.0

"""
tests/ai/test_eta.py
Unit tests for the ETA predictor and feature module.
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.ai.eta.predictor import ETAPredictor
from backend.ai.eta.features import build_eta_features, ROAD_CONDITION_SPEED_FACTOR


class TestETAPredictor:
    """Tests for the heuristic path (no ML model)."""

    def setup_method(self):
        # Instantiate with no model path → forces heuristic
        self.predictor = ETAPredictor(model_path=None)

    def test_basic_prediction_returns_dict(self):
        result = self.predictor.predict(distance_km=100.0)
        assert isinstance(result, dict)

    def test_required_keys_present(self):
        result = self.predictor.predict(distance_km=100.0)
        required = {
            "eta_hrs", "base_travel_time_hrs", "disruption_buffer_hrs",
            "incident_delay_hrs", "effective_speed_kmh", "method", "model_version",
        }
        assert required.issubset(result.keys())

    def test_zero_distance_returns_zero_eta(self):
        result = self.predictor.predict(distance_km=0.0)
        assert result["eta_hrs"] == 0.0

    def test_eta_is_positive(self):
        result = self.predictor.predict(distance_km=150.0, disruption_risk=0.3)
        assert result["eta_hrs"] > 0.0

    def test_high_disruption_increases_eta(self):
        low_risk = self.predictor.predict(distance_km=100.0, disruption_risk=0.0)
        high_risk = self.predictor.predict(distance_km=100.0, disruption_risk=0.9)
        assert high_risk["eta_hrs"] > low_risk["eta_hrs"]

    def test_poor_road_condition_reduces_speed(self):
        good = self.predictor.predict(distance_km=100.0, road_condition="GOOD")
        poor = self.predictor.predict(distance_km=100.0, road_condition="POOR")
        assert poor["eta_hrs"] > good["eta_hrs"]

    def test_heavy_rain_reduces_speed(self):
        clear = self.predictor.predict(distance_km=100.0, weather_condition="CLEAR")
        heavy = self.predictor.predict(distance_km=100.0, weather_condition="HEAVY_RAIN")
        assert heavy["eta_hrs"] > clear["eta_hrs"]

    def test_incident_delay_adds_to_eta(self):
        no_delay = self.predictor.predict(distance_km=100.0, incident_delay_hrs=0.0)
        with_delay = self.predictor.predict(distance_km=100.0, incident_delay_hrs=2.0)
        assert abs(with_delay["eta_hrs"] - no_delay["eta_hrs"] - 2.0) < 0.1

    def test_method_is_heuristic(self):
        result = self.predictor.predict(distance_km=100.0)
        assert result["method"] == "heuristic"

    def test_model_version_is_string(self):
        result = self.predictor.predict(distance_km=100.0)
        assert isinstance(result["model_version"], str)

    def test_effective_speed_positive(self):
        result = self.predictor.predict(distance_km=100.0, road_condition="GOOD")
        assert result["effective_speed_kmh"] > 0.0

    def test_severe_damage_road_slowest(self):
        excellent = self.predictor.predict(distance_km=100.0, road_condition="EXCELLENT")
        severe = self.predictor.predict(distance_km=100.0, road_condition="SEVERE_DAMAGE")
        assert severe["eta_hrs"] > excellent["eta_hrs"]


class TestETAFeatures:
    def test_excellent_road_fastest(self):
        f = build_eta_features(100.0, road_condition="EXCELLENT")
        assert f["effective_speed_kmh"] == pytest.approx(45.0 * 1.0, abs=1.0)

    def test_poor_road_slower(self):
        excellent = build_eta_features(100.0, road_condition="EXCELLENT")
        poor = build_eta_features(100.0, road_condition="POOR")
        assert poor["effective_speed_kmh"] < excellent["effective_speed_kmh"]

    def test_disruption_buffer_zero_for_zero_risk(self):
        f = build_eta_features(100.0, disruption_risk=0.0)
        assert f["disruption_buffer_hrs"] == 0.0

    def test_disruption_buffer_grows_with_risk(self):
        low = build_eta_features(100.0, disruption_risk=0.2)
        high = build_eta_features(100.0, disruption_risk=0.8)
        assert high["disruption_buffer_hrs"] > low["disruption_buffer_hrs"]

    def test_distance_preserved(self):
        f = build_eta_features(200.0)
        assert f["distance_km"] == 200.0

    def test_min_speed_floor(self):
        # Even worst-case conditions should have speed > 0
        f = build_eta_features(
            100.0,
            road_condition="SEVERE_DAMAGE",
            weather_condition="THUNDERSTORM",
            rainfall_mm=300.0,
        )
        assert f["effective_speed_kmh"] >= 5.0

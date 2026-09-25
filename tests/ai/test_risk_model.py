"""
tests/ai/test_risk_model.py
Unit tests for the AI risk model and features module.
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.ai.risk.model import ai_risk_model
from backend.ai.risk.features import (
    normalize_rainfall,
    normalize_slope,
    classify_weather,
    encode_soil_risk,
    extract_features_from_request,
)


class TestRiskModelPredict:
    def test_low_risk_inputs_return_low_level(self):
        result = ai_risk_model.predict(
            rainfall_mm=0.0,
            slope_degree=5.0,
            weather_condition="CLEAR",
            soil_type="ROCKY",
            historical_landslides_count=0,
            active_incidents_count=0,
        )
        assert result["risk_level"] in ("LOW", "MEDIUM")

    def test_high_risk_inputs_return_high_level(self):
        result = ai_risk_model.predict(
            rainfall_mm=300.0,
            slope_degree=60.0,
            weather_condition="HEAVY_RAIN",
            soil_type="CLAY",
            historical_landslides_count=10,
            active_incidents_count=5,
        )
        assert result["risk_level"] in ("HIGH", "CRITICAL")

    def test_risk_probability_in_range(self):
        result = ai_risk_model.predict(
            rainfall_mm=100.0,
            slope_degree=30.0,
            weather_condition="RAIN",
            soil_type="LOAM",
            historical_landslides_count=2,
            active_incidents_count=1,
        )
        assert 0.0 <= result["risk_probability"] <= 1.0

    def test_result_has_required_keys(self):
        result = ai_risk_model.predict(rainfall_mm=0.0)
        required = {"risk_probability", "risk_level", "risk_factors", "confidence_score", "recommendation"}
        assert required.issubset(result.keys())

    def test_risk_factors_is_list(self):
        result = ai_risk_model.predict(rainfall_mm=200.0, slope_degree=50.0, weather_condition="HEAVY_RAIN")
        assert isinstance(result["risk_factors"], list)

    def test_recommendation_is_string(self):
        result = ai_risk_model.predict(rainfall_mm=50.0)
        assert isinstance(result["recommendation"], str)
        assert len(result["recommendation"]) > 0

    def test_zero_inputs_return_low_risk(self):
        result = ai_risk_model.predict(rainfall_mm=0.0, slope_degree=0.0)
        assert result["risk_probability"] < 0.5

    def test_extreme_rainfall_high_risk(self):
        result = ai_risk_model.predict(rainfall_mm=500.0)
        assert result["risk_probability"] > 0.5


class TestRiskFeatures:
    def test_normalize_rainfall_zero(self):
        assert normalize_rainfall(0.0) == 0.0

    def test_normalize_rainfall_extreme(self):
        assert normalize_rainfall(200.0) == 1.0

    def test_normalize_rainfall_capped_at_1(self):
        assert normalize_rainfall(500.0) == 1.0

    def test_normalize_slope_zero(self):
        assert normalize_slope(0.0) == 0.0

    def test_normalize_slope_critical(self):
        assert normalize_slope(45.0) == 1.0

    def test_normalize_slope_capped(self):
        assert normalize_slope(90.0) == 1.0

    def test_classify_weather_clear(self):
        assert classify_weather("CLEAR") == 0

    def test_classify_weather_heavy_rain(self):
        assert classify_weather("HEAVY_RAIN") == 2

    def test_classify_weather_case_insensitive(self):
        assert classify_weather("heavy_rain") == classify_weather("HEAVY_RAIN")

    def test_encode_soil_clay_highest(self):
        assert encode_soil_risk("CLAY") > encode_soil_risk("ROCKY")

    def test_extract_features_from_request(self):
        req = {
            "rainfall_mm": 100.0,
            "slope_degree": 30.0,
            "weather_condition": "RAIN",
            "soil_type": "LOAM",
            "historical_landslides_count": 3,
            "active_incidents_count": 1,
        }
        features = extract_features_from_request(req)
        assert "rainfall_norm" in features
        assert "slope_norm" in features
        assert 0.0 <= features["rainfall_norm"] <= 1.0
        assert 0.0 <= features["slope_norm"] <= 1.0

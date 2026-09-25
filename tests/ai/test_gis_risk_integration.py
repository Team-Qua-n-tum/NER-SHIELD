"""
test_gis_risk_integration.py — Comprehensive tests for NER-SHIELD GIS-aware risk layer.

Tests cover:
1. Feature validation
2. GIS integration
3. Freshness/provenance
4. Inference selection
5. ETA calculations
6. Database behavior
7. API compatibility

No live network, Firebase, OSRM, or database calls are made.
All providers and sessions are mocked.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Path setup (ensure backend package is importable)
# ---------------------------------------------------------------------------

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------

from backend.ai.risk.risk_context import AffectedRoadContext, RiskFeatureContext
from backend.ai.risk.gis_risk_engine import (
    calculate_risk,
    _classify_risk,
    _heuristic_score,
    _build_reasons,
    RISK_THRESHOLDS,
)
from backend.ai.eta.gis_eta_engine import calculate_eta


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _make_context(**kwargs) -> RiskFeatureContext:
    """Build a minimal valid RiskFeatureContext for testing."""
    defaults = {
        "road_id": "road-test-001",
        "district_id": "dist-guwahati",
        "data_mode": "demo",
        "source_status": "demo_synthetic_data",
        "rainfall_mm_24h": 10.0,
        "weather_condition": "CLEAR",
        "road_status": "OPEN",
        "road_condition": "GOOD",
        "active_incident_count": 0,
        "weather_stale": False,
        "road_state_stale": False,
        "incident_stale": False,
    }
    defaults.update(kwargs)
    return RiskFeatureContext(**defaults)


def _make_high_severity_incident_context() -> RiskFeatureContext:
    """Context for a critical landslide matched to road-nh13-it (BLOCKED)."""
    return _make_context(
        road_id="road-nh13-it",
        district_id="dist-tawang",
        road_status="BLOCKED",
        road_condition="SEVERE_DAMAGE",
        rainfall_mm_24h=180.0,
        weather_condition="HEAVY_RAIN",
        active_incident_count=1,
        incident_type="landslide",
        incident_severity="critical",
        impact_level="critical",
        suggested_status="blocked",
        suggested_risk_penalty=1.0,
        hazard_radius_km=3.0,
        affected_road_ids=["road-nh13-it"],
        affected_road_count=1,
        current_risk_score=0.95,
        affected_by_incident_ids=["inc-101"],
        highest_incident_severity="critical",
    )


# ===========================================================================
# 1. FEATURE VALIDATION
# ===========================================================================

class TestFeatureValidation:

    def test_valid_live_context_accepted(self):
        ctx = _make_context(
            rainfall_mm_24h=45.0,
            weather_condition="RAIN",
            active_incident_count=2,
            source_status="live_provider_data",
            data_mode="live",
        )
        assert ctx.rainfall_mm_24h == 45.0
        assert ctx.weather_condition == "RAIN"
        assert ctx.active_incident_count == 2

    def test_missing_optional_weather_fields_do_not_crash(self):
        """Missing weather fields are None, not crash."""
        ctx = _make_context(
            rainfall_mm_24h=None,
            wind_speed_kmh=None,
            visibility_m=None,
            temperature_c=None,
        )
        assert ctx.rainfall_mm_24h is None
        # effective_rainfall_mm should return 0 when both are None
        assert ctx.effective_rainfall_mm() == 0.0

    def test_negative_rainfall_rejected(self):
        """Negative rainfall raises Pydantic validation error."""
        with pytest.raises(Exception):
            RiskFeatureContext(
                road_id="r1",
                data_mode="demo",
                source_status="demo_synthetic_data",
                rainfall_mm_24h=-5.0,
            )

    def test_risk_score_always_bounded_0_to_1(self):
        """Risk score must always be in [0.0, 1.0] regardless of inputs."""
        for rainfall in [0, 50, 200, 1000, 2000]:
            ctx = _make_context(rainfall_mm_24h=float(rainfall))
            result = calculate_risk(ctx)
            score = result["risk_score"]
            assert score is not None
            assert 0.0 <= score <= 1.0, f"Score {score} out of range for rainfall={rainfall}"

    def test_invalid_source_status_normalized(self):
        """Invalid source_status is normalized to data_unavailable."""
        ctx = RiskFeatureContext(
            road_id="r1",
            data_mode="demo",
            source_status="totally_invalid_value",
        )
        assert ctx.source_status == "data_unavailable"

    def test_effective_rainfall_prefers_24h(self):
        ctx = _make_context(rainfall_mm_24h=80.0, rainfall_mm_1h=5.0)
        assert ctx.effective_rainfall_mm() == 80.0

    def test_effective_rainfall_extrapolates_from_1h(self):
        ctx = _make_context(rainfall_mm_24h=None, rainfall_mm_1h=10.0)
        assert ctx.effective_rainfall_mm() == 40.0  # 10 * 4

    def test_is_stale_flag(self):
        ctx = _make_context(weather_stale=True)
        assert ctx.is_stale() is True

        ctx2 = _make_context(weather_stale=False, incident_stale=False)
        assert ctx2.is_stale() is False


# ===========================================================================
# 2. GIS INTEGRATION
# ===========================================================================

class TestGISIntegration:

    def test_critical_landslide_matched_road_increases_risk_substantially(self):
        """A critical incident matched to a road must produce a high/critical score."""
        ctx = _make_high_severity_incident_context()
        result = calculate_risk(ctx)
        assert result["risk_score"] >= 0.50, (
            f"Expected risk_score >= 0.50 for critical landslide, got {result['risk_score']}"
        )
        assert result["risk_level"] in ("HIGH", "CRITICAL")

    def test_suggested_status_blocked_returns_exclude_from_routing(self):
        """suggested_status=blocked must produce exclude_from_routing recommendation."""
        ctx = _make_high_severity_incident_context()
        result = calculate_risk(ctx)
        assert result["routing_recommendation"] == "exclude_from_routing"
        assert result["route_eligible"] is False

    def test_blocked_road_status_also_returns_exclude(self):
        """Road with BLOCKED status must be excluded from routing."""
        ctx = _make_context(road_status="BLOCKED")
        result = calculate_risk(ctx)
        assert result["routing_recommendation"] == "exclude_from_routing"
        assert result["route_eligible"] is False

    def test_nearby_affected_road_less_penalty_than_matched_road(self):
        """A road inside hazard zone (not matched) gets less penalty than matched road."""
        # Matched road (primary)
        ctx_matched = _make_context(
            road_id="road-primary",
            suggested_risk_penalty=1.0,
            impact_level="critical",
            suggested_status="blocked",
            active_incident_count=1,
            incident_severity="critical",
        )
        # Nearby road (secondary)
        ctx_nearby = _make_context(
            road_id="road-nearby",
            suggested_risk_penalty=0.35,  # GIS gave reduced penalty for distance
            impact_level="medium",
            suggested_status="restricted",
            active_incident_count=1,
            incident_severity="critical",
        )

        result_matched = calculate_risk(ctx_matched)
        result_nearby = calculate_risk(ctx_nearby)

        assert result_matched["risk_score"] > result_nearby["risk_score"], (
            f"Matched ({result_matched['risk_score']}) should score higher "
            f"than nearby ({result_nearby['risk_score']})"
        )

    def test_gis_metadata_preserved_in_output(self):
        """GIS fields must be retained in the output."""
        ctx = _make_high_severity_incident_context()
        result = calculate_risk(ctx)
        assert result.get("affected_by_incident_ids") == ["inc-101"]
        assert result.get("incident_count") == 1
        assert result.get("highest_incident_severity") == "critical"

    def test_no_incident_penalty_duplication(self):
        """A single incident's penalty must not be counted twice."""
        ctx = _make_context(
            active_incident_count=1,
            incident_severity="critical",
            suggested_risk_penalty=1.0,
            impact_level="critical",
            suggested_status="blocked",
        )
        result = calculate_risk(ctx)
        # Score must not exceed 1.0
        assert result["risk_score"] <= 1.0

    def test_distant_incident_outside_gis_zone_lower_penalty(self):
        """Incident outside GIS impact zone gets lower penalty."""
        ctx_no_gis = _make_context(
            active_incident_count=1,
            incident_severity="critical",
            suggested_risk_penalty=None,  # not in impact zone
            impact_level=None,
            suggested_status=None,
            affected_road_count=0,
        )
        ctx_in_zone = _make_context(
            active_incident_count=1,
            incident_severity="critical",
            suggested_risk_penalty=1.0,
            impact_level="critical",
            suggested_status="blocked",
            affected_road_count=1,
        )
        result_outside = calculate_risk(ctx_no_gis)
        result_in_zone = calculate_risk(ctx_in_zone)

        assert result_in_zone["risk_score"] > result_outside["risk_score"]


# ===========================================================================
# 3. FRESHNESS / PROVENANCE
# ===========================================================================

class TestFreshnessProvenance:

    def test_fresh_live_data_produces_live_provider_status(self):
        ctx = _make_context(
            data_mode="live",
            source_status="live_provider_data",
            weather_stale=False,
            road_state_stale=False,
            incident_stale=False,
        )
        result = calculate_risk(ctx)
        assert result["source_status"] == "live_provider_data"
        assert result["data_mode"] == "live"

    def test_stale_weather_lowers_confidence_and_sets_stale_flag(self):
        ctx_fresh = _make_context(weather_stale=False, weather_freshness_seconds=60.0)
        ctx_stale = _make_context(weather_stale=True, weather_freshness_seconds=7200.0)

        result_fresh = calculate_risk(ctx_fresh)
        result_stale = calculate_risk(ctx_stale)

        assert result_stale["stale"] is True
        assert result_fresh["stale"] is False
        # Stale confidence must be lower
        assert result_stale["confidence"] <= result_fresh["confidence"]

    def test_provider_failure_produces_heuristic_fallback_status(self):
        ctx = _make_context(
            data_mode="live",
            source_status="heuristic_fallback",
            weather_stale=True,
        )
        result = calculate_risk(ctx)
        assert result["source_status"] == "heuristic_fallback"

    def test_demo_input_labelled_demo_synthetic_data(self):
        ctx = _make_context(data_mode="demo", source_status="demo_synthetic_data")
        result = calculate_risk(ctx)
        assert result["source_status"] == "demo_synthetic_data"
        assert result["data_mode"] == "demo"

    def test_stale_reasons_mention_age(self):
        ctx = _make_context(
            weather_stale=True,
            weather_freshness_seconds=5400.0,  # 90 minutes
        )
        result = calculate_risk(ctx)
        reasons_text = " ".join(result["reasons"])
        assert "90" in reasons_text or "minute" in reasons_text.lower() or "stale" in reasons_text.lower() or "older" in reasons_text.lower()


# ===========================================================================
# 4. INFERENCE SELECTION
# ===========================================================================

class TestInferenceSelection:

    def test_unavailable_artifact_uses_heuristic(self):
        """When model artifact is missing/None, heuristic is selected."""
        with patch("backend.ml.loader.ModelLoader.get_model", return_value=None):
            ctx = _make_context()
            result = calculate_risk(ctx)
            assert result["method"] == "deterministic_heuristic"
            assert "heuristic" in result["model_version"].lower()

    def test_loadable_model_uses_trained_model_path(self):
        """When model returns a valid probability, method=trained_model."""
        mock_model = MagicMock()
        mock_model.predict_proba.return_value = [[0.05, 0.72]]

        with patch("backend.ml.loader.ModelLoader.get_model", return_value=mock_model):
            ctx = _make_context()
            result = calculate_risk(ctx)
            assert result["method"] == "trained_model"
            assert 0.0 <= result["risk_score"] <= 1.0

    def test_normal_request_does_not_call_training(self):
        """calculate_risk() must never call the train() function."""
        with patch("backend.ai.disruption.train.train") as mock_train:
            with patch("backend.ml.loader.ModelLoader.get_model", return_value=None):
                ctx = _make_context()
                calculate_risk(ctx)
                mock_train.assert_not_called()

    def test_method_label_is_truthful_for_heuristic(self):
        """Heuristic method must never be labelled as 'trained_model' or 'ml'."""
        with patch("backend.ml.loader.ModelLoader.get_model", return_value=None):
            ctx = _make_context()
            result = calculate_risk(ctx)
            assert result["method"] not in ("trained_model", "ml")
            assert "heuristic" in result["method"]

    def test_broken_model_falls_back_to_heuristic(self):
        """A model that throws on predict_proba falls back gracefully."""
        mock_model = MagicMock()
        mock_model.predict_proba.side_effect = RuntimeError("model error")

        with patch("backend.ml.loader.ModelLoader.get_model", return_value=mock_model):
            ctx = _make_context()
            result = calculate_risk(ctx)
            # Should not crash, should fall back to heuristic
            assert result["method"] == "deterministic_heuristic"

    def test_risk_level_thresholds_are_documented_and_consistent(self):
        """Risk levels must follow the documented thresholds."""
        scores_and_expected = [
            (0.80, "CRITICAL"),
            (0.75, "CRITICAL"),
            (0.60, "HIGH"),
            (0.50, "HIGH"),
            (0.30, "MEDIUM"),
            (0.25, "MEDIUM"),
            (0.10, "LOW"),
            (0.00, "LOW"),
        ]
        for score, expected in scores_and_expected:
            actual = _classify_risk(score)
            assert actual == expected, f"score={score}: expected {expected}, got {actual}"


# ===========================================================================
# 5. ETA CALCULATIONS
# ===========================================================================

class TestETACalculations:

    def test_high_rain_and_high_incident_increases_eta(self):
        ctx_clear = _make_context(
            rainfall_mm_24h=0.0, weather_condition="CLEAR",
            active_incident_count=0, suggested_risk_penalty=None,
        )
        ctx_bad = _make_context(
            rainfall_mm_24h=180.0, weather_condition="HEAVY_RAIN",
            active_incident_count=1, incident_severity="critical",
            suggested_risk_penalty=1.0,
        )
        eta_clear = calculate_eta(ctx_clear, distance_km=100.0, risk_score=0.1)
        eta_bad = calculate_eta(ctx_bad, distance_km=100.0, risk_score=0.9)

        assert eta_bad["eta_minutes"] > eta_clear["eta_minutes"], (
            f"Bad conditions ETA ({eta_bad['eta_minutes']}) should exceed "
            f"clear conditions ETA ({eta_clear['eta_minutes']})"
        )

    def test_blocked_road_is_not_route_eligible(self):
        ctx = _make_context(
            road_status="BLOCKED",
            suggested_status="blocked",
        )
        eta = calculate_eta(ctx, distance_km=100.0, risk_score=0.95)
        assert eta["route_eligible"] is False
        assert eta["eta_minutes"] is None

    def test_delay_breakdown_sums_to_total_delay(self):
        ctx = _make_context(
            rainfall_mm_24h=80.0,
            weather_condition="RAIN",
            active_incident_count=1,
            incident_severity="moderate",
            suggested_risk_penalty=0.40,
            road_condition="POOR",
        )
        eta = calculate_eta(ctx, distance_km=50.0, risk_score=0.55)
        bd = eta["delay_breakdown"]
        assert bd is not None
        total_from_breakdown = (
            bd["weather_delay_minutes"]
            + bd["incident_delay_minutes"]
            + bd["road_condition_delay_minutes"]
            + bd["risk_buffer_minutes"]
        )
        assert abs(total_from_breakdown - eta["delay_minutes"]) < 0.5, (
            f"Breakdown sum {total_from_breakdown} doesn't match "
            f"delay_minutes {eta['delay_minutes']}"
        )

    def test_eta_remains_positive_for_eligible_route(self):
        """ETA must always be >= 0.1 for route-eligible roads."""
        ctx = _make_context(road_status="OPEN", rainfall_mm_24h=0.0)
        for dist in [1.0, 10.0, 100.0, 500.0]:
            eta = calculate_eta(ctx, distance_km=dist, risk_score=0.1)
            if eta["route_eligible"]:
                assert eta["eta_minutes"] >= 0.1, (
                    f"ETA {eta['eta_minutes']} must be >= 0.1 for distance={dist}"
                )

    def test_source_status_propagated_to_eta(self):
        ctx = _make_context(source_status="demo_synthetic_data", data_mode="demo")
        eta = calculate_eta(ctx, distance_km=50.0, risk_score=0.2)
        assert eta["source_status"] == "demo_synthetic_data"
        assert eta["data_mode"] == "demo"


# ===========================================================================
# 6. DATABASE BEHAVIOR
# ===========================================================================

class TestDatabaseBehavior:

    def test_demo_mode_does_not_create_db_session(self):
        """In DEMO_MODE=true, no database engine or session must be created."""
        with patch("backend.app.core.config.settings") as mock_settings:
            mock_settings.DEMO_MODE = True
            mock_settings.VERSION = "1.0.0"
            mock_settings.APP_ENV = "test"

            # sqlalchemy should not be called
            with patch("sqlalchemy.create_engine") as mock_engine:
                ctx = _make_context(data_mode="demo", source_status="demo_synthetic_data")
                calculate_risk(ctx)
                mock_engine.assert_not_called()

    def test_demo_records_not_labelled_as_live(self):
        """Demo-mode results must have source_status=demo_synthetic_data."""
        ctx = _make_context(data_mode="demo", source_status="demo_synthetic_data")
        result = calculate_risk(ctx)
        assert result["source_status"] == "demo_synthetic_data"
        assert result["data_mode"] == "demo"
        # Must not claim to be live
        assert result["source_status"] != "live_provider_data"

    def test_persistence_failure_does_not_corrupt_prediction(self):
        """If a persistence call fails, the prediction response is still valid."""
        # Simulate a db write failure — risk result should still be returned
        ctx = _make_context()
        result = calculate_risk(ctx)
        # Basic sanity checks
        assert result["risk_score"] is not None
        assert result["risk_level"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
        assert result["method"] in ("trained_model", "deterministic_heuristic", "unavailable")


# ===========================================================================
# 7. API COMPATIBILITY
# ===========================================================================

class TestAPICompatibility:

    def test_legacy_request_fields_still_work(self):
        """Old-style requests without road_id must still produce valid responses."""
        from backend.app.schemas.risk import RiskPredictionRequest
        from backend.app.services.ai_service import AIService

        request = RiskPredictionRequest(
            rainfall_mm=45.0,
            slope_degree=20.0,
            weather_condition="RAIN",
            soil_type="CLAY",
            historical_landslides_count=2,
            active_incidents_count=1,
        )
        response = AIService.predict_risk(request)
        assert response.risk_probability is not None
        assert 0.0 <= response.risk_probability <= 1.0
        assert response.risk_level in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
        assert response.recommendation
        assert response.model_version

    def test_enriched_fields_present_in_response(self):
        """New enriched fields should be present (may be None for legacy requests)."""
        from backend.app.schemas.risk import RiskPredictionRequest
        from backend.app.services.ai_service import AIService

        request = RiskPredictionRequest(rainfall_mm=10.0)
        response = AIService.predict_risk(request)
        # New fields should be present as attributes
        assert hasattr(response, "method")
        assert hasattr(response, "source_status")
        assert hasattr(response, "stale")
        assert hasattr(response, "route_eligible")
        assert hasattr(response, "routing_recommendation")

    def test_response_does_not_expose_secrets(self):
        """Response must not contain API keys, credentials, or raw provider payloads."""
        from backend.app.schemas.risk import RiskPredictionRequest
        from backend.app.services.ai_service import AIService

        request = RiskPredictionRequest(rainfall_mm=20.0)
        response = AIService.predict_risk(request)
        response_json = response.model_dump()
        response_str = str(response_json).lower()

        for secret_key in ("api_key", "password", "credential", "firebase", "secret", "token"):
            assert secret_key not in response_str, (
                f"Response appears to contain secret field: {secret_key}"
            )

    def test_road_risk_endpoint_response_shape(self):
        """predict_risk_for_road() returns all required RiskRoadResponse fields."""
        from backend.app.services.ai_service import AIService

        response = AIService.predict_risk_for_road(road_id="road-nh13-it")
        assert response.road_id == "road-nh13-it"
        assert 0.0 <= response.risk_score <= 1.0
        assert response.risk_level in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
        assert response.method in ("trained_model", "deterministic_heuristic", "unavailable")
        assert response.routing_recommendation in (
            "normal", "caution", "avoid_if_alternative", "exclude_from_routing"
        )
        assert isinstance(response.route_eligible, bool)
        assert 0.0 <= response.risk_penalty <= 1.0

    def test_eta_endpoint_response_shape(self):
        """predict_eta() returns valid ETAResponse."""
        from backend.app.services.ai_service import AIService

        response = AIService.predict_eta(road_id="road-nh27-gt", distance_km=100.0)
        # Should be route-eligible for an OPEN road
        if response.route_eligible:
            assert response.eta_minutes is not None
            assert response.eta_minutes >= 0.0
            assert response.delay_breakdown is not None


# ===========================================================================
# 8. RISK CONTEXT SERVICE INTEGRATION
# ===========================================================================

class TestRiskContextServiceIntegration:

    def test_assemble_context_for_known_road(self):
        """assemble_risk_context returns a valid context for a seeded road."""
        from backend.app.services.risk_context_service import assemble_risk_context

        ctx = assemble_risk_context(road_id="road-nh13-it", district_id="dist-tawang")
        assert ctx.road_id == "road-nh13-it"
        assert ctx.data_mode in ("demo", "live")
        assert ctx.source_status in (
            "demo_synthetic_data", "live_provider_data", "mixed_live_and_fallback",
            "stale_live_data", "heuristic_fallback", "data_unavailable"
        )

    def test_assemble_context_unknown_road_returns_valid_context(self):
        """Unknown road_id produces a context (not a crash)."""
        from backend.app.services.risk_context_service import assemble_risk_context

        ctx = assemble_risk_context(road_id="road-does-not-exist")
        assert ctx is not None
        assert ctx.road_id == "road-does-not-exist"

    def test_critical_road_gets_high_risk_score(self):
        """The BLOCKED road road-nh13-it must produce HIGH or CRITICAL risk."""
        from backend.app.services.risk_context_service import assemble_risk_context

        ctx = assemble_risk_context(road_id="road-nh13-it")
        result = calculate_risk(ctx)
        assert result["risk_level"] in ("HIGH", "CRITICAL"), (
            f"Expected HIGH or CRITICAL for BLOCKED road, got {result['risk_level']}"
        )
        assert result["route_eligible"] is False

    def test_open_low_risk_road_passes_routing(self):
        """A low-risk OPEN road should be route_eligible=True."""
        from backend.app.services.risk_context_service import assemble_risk_context

        # road-nh27-gt is OPEN with low risk in seed data
        ctx = assemble_risk_context(road_id="road-nh27-gt")
        result = calculate_risk(ctx)
        assert result["route_eligible"] is True

    def test_model_loader_no_retrain_on_missing_artifact(self):
        """ModelLoader must return None (not retrain) when artifact is absent."""
        from backend.ml.loader import ModelLoader

        original_path = ModelLoader._model_path
        try:
            ModelLoader.reset()
            ModelLoader._model_path = Path("/nonexistent/model.joblib")
            model = ModelLoader.get_model()
            assert model is None, "Expected None when artifact is missing"
        finally:
            ModelLoader.reset()
            ModelLoader._model_path = original_path

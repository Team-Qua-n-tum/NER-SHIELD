"""
test_disruption_model.py
------------------------
Automated test suite for the NER-SHIELD disruption risk AI layer.

Covers:
  1. Dataset integrity
  2. Prediction contract (keys, types)
  3. High-risk input -> HIGH or CRITICAL
  4. Low-risk input  -> LOW or MODERATE
  5. Missing values  -> handled gracefully
  6. Invalid types   -> ValueError raised
  7. Determinism     -> same input = same output
  8. Model loads correctly from disk
  9. Explanation generated for high-risk inputs
 10. Risk levels are well-defined across full probability range
 11. FastAPI router import is successful

Run with:
    python -m pytest tests/ai/ -v
"""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import pytest

# Ensure project root is on sys.path for 'backend.*' imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.ai.risk.risk_engine import predict_disruption, _classify_risk
from backend.ai.risk.explainer import explain_risk_factors
from backend.ml.loader import ModelLoader

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

DATASET_PATH = PROJECT_ROOT / "data" / "synthetic" / "disruption_dataset.csv"

HIGH_RISK_INPUT = {
    "rainfall_mm": 250,
    "flood_level": 3,
    "landslide_indicator": 2,
    "road_condition": 3,
    "traffic_level": 4,
    "historical_incidents": 9,
    "terrain_risk": 2,
    "bridge_condition": 2,
    "incident_severity": 3,
    "connectivity_score": 0.1,
}

LOW_RISK_INPUT = {
    "rainfall_mm": 5,
    "flood_level": 0,
    "landslide_indicator": 0,
    "road_condition": 0,
    "traffic_level": 0,
    "historical_incidents": 0,
    "terrain_risk": 0,
    "bridge_condition": 0,
    "incident_severity": 0,
    "connectivity_score": 0.98,
}

EXPECTED_KEYS = {"risk_probability", "risk_level", "risk_factors", "model_version"}
VALID_RISK_LEVELS = {"LOW", "MODERATE", "HIGH", "CRITICAL"}

FEATURE_COLS = [
    "rainfall_mm",
    "flood_level",
    "landslide_indicator",
    "road_condition",
    "traffic_level",
    "historical_incidents",
    "terrain_risk",
    "bridge_condition",
    "incident_severity",
    "connectivity_score",
    "disruption",
]


# ---------------------------------------------------------------------------
# Test 1: Dataset integrity
# ---------------------------------------------------------------------------


class TestDataset:
    def test_dataset_exists(self):
        """Dataset CSV must exist after generate_dataset.py has been run."""
        assert DATASET_PATH.exists(), (
            f"Dataset not found at {DATASET_PATH}. "
            "Run: python backend/ai/disruption/generate_dataset.py"
        )

    def test_dataset_has_expected_columns(self):
        """Dataset must contain all required feature and target columns."""
        df = pd.read_csv(DATASET_PATH, comment="#")
        missing = set(FEATURE_COLS) - set(df.columns)
        assert not missing, f"Dataset missing columns: {missing}"

    def test_dataset_has_rows(self):
        """Dataset must be non-empty."""
        df = pd.read_csv(DATASET_PATH, comment="#")
        assert len(df) >= 100, f"Dataset too small: {len(df)} rows"

    def test_target_column_is_binary(self):
        """Disruption target must be binary (0 or 1)."""
        df = pd.read_csv(DATASET_PATH, comment="#")
        unique_values = set(df["disruption"].unique())
        assert unique_values <= {0, 1}, f"Non-binary target values: {unique_values}"

    def test_positive_rate_is_reasonable(self):
        """Disruption positive rate should be between 10% and 90%."""
        df = pd.read_csv(DATASET_PATH, comment="#")
        rate = df["disruption"].mean()
        assert 0.10 <= rate <= 0.90, f"Extreme class imbalance: positive rate = {rate:.2%}"


# ---------------------------------------------------------------------------
# Test 2: Prediction contract
# ---------------------------------------------------------------------------


class TestPredictionContract:
    def test_returns_all_required_keys(self):
        """predict_disruption must return all required keys."""
        result = predict_disruption(HIGH_RISK_INPUT)
        assert EXPECTED_KEYS == set(result.keys()), (
            f"Missing keys: {EXPECTED_KEYS - set(result.keys())}"
        )

    def test_risk_probability_is_float_in_range(self):
        """risk_probability must be a float in [0, 1]."""
        result = predict_disruption(HIGH_RISK_INPUT)
        prob = result["risk_probability"]
        assert isinstance(prob, float), f"risk_probability is {type(prob)}"
        assert 0.0 <= prob <= 1.0, f"risk_probability out of range: {prob}"

    def test_risk_level_is_valid(self):
        """risk_level must be one of the four defined levels."""
        result = predict_disruption(HIGH_RISK_INPUT)
        assert result["risk_level"] in VALID_RISK_LEVELS

    def test_risk_factors_is_list(self):
        """risk_factors must always be a list."""
        result = predict_disruption(HIGH_RISK_INPUT)
        assert isinstance(result["risk_factors"], list)

    def test_model_version_is_string(self):
        """model_version must be a non-empty string."""
        result = predict_disruption(HIGH_RISK_INPUT)
        assert isinstance(result["model_version"], str)
        assert len(result["model_version"]) > 0


# ---------------------------------------------------------------------------
# Test 3: High-risk inputs
# ---------------------------------------------------------------------------


class TestHighRiskPrediction:
    def test_high_risk_input_gives_high_or_critical(self):
        """Maximum-stress input must yield HIGH or CRITICAL risk level."""
        result = predict_disruption(HIGH_RISK_INPUT)
        assert result["risk_level"] in ("HIGH", "CRITICAL"), (
            f"Expected HIGH/CRITICAL for severe conditions, got: {result['risk_level']} "
            f"(p={result['risk_probability']})"
        )

    def test_high_risk_probability_exceeds_threshold(self):
        """Maximum-stress input must have probability >= 0.50."""
        result = predict_disruption(HIGH_RISK_INPUT)
        assert result["risk_probability"] >= 0.50, (
            f"Expected p >= 0.50, got {result['risk_probability']}"
        )


# ---------------------------------------------------------------------------
# Test 4: Low-risk inputs
# ---------------------------------------------------------------------------


class TestLowRiskPrediction:
    def test_low_risk_input_gives_low_or_moderate(self):
        """Calm-conditions input must yield LOW or MODERATE risk level."""
        result = predict_disruption(LOW_RISK_INPUT)
        assert result["risk_level"] in ("LOW", "MODERATE"), (
            f"Expected LOW/MODERATE for calm conditions, got: {result['risk_level']} "
            f"(p={result['risk_probability']})"
        )

    def test_low_risk_probability_below_threshold(self):
        """Calm-conditions input must have probability < 0.50."""
        result = predict_disruption(LOW_RISK_INPUT)
        assert result["risk_probability"] < 0.50, (
            f"Expected p < 0.50, got {result['risk_probability']}"
        )


# ---------------------------------------------------------------------------
# Test 5: Missing values handled gracefully
# ---------------------------------------------------------------------------


class TestMissingValueHandling:
    def test_empty_dict_does_not_raise(self):
        """Empty input dict must not raise any exception."""
        result = predict_disruption({})
        assert "risk_level" in result

    def test_partial_input_does_not_raise(self):
        """Partial input with a few keys must not raise any exception."""
        result = predict_disruption({"rainfall_mm": 120, "flood_level": 2})
        assert "risk_probability" in result

    def test_none_values_do_not_raise(self):
        """None values for optional features must be handled gracefully."""
        result = predict_disruption({"rainfall_mm": None, "flood_level": None})
        assert "risk_level" in result

    def test_all_none_gives_valid_result(self):
        """All-None input must produce a valid risk response."""
        input_all_none = {k: None for k in [
            "rainfall_mm", "flood_level", "landslide_indicator",
            "road_condition", "traffic_level", "historical_incidents",
            "terrain_risk", "bridge_condition", "incident_severity",
            "connectivity_score",
        ]}
        result = predict_disruption(input_all_none)
        assert result["risk_level"] in VALID_RISK_LEVELS


# ---------------------------------------------------------------------------
# Test 6: Invalid inputs raise errors
# ---------------------------------------------------------------------------


class TestInvalidInputHandling:
    def test_non_dict_input_raises_type_error(self):
        """Non-dict input must raise TypeError."""
        with pytest.raises(TypeError):
            predict_disruption("not a dict")

    def test_non_numeric_feature_raises_value_error(self):
        """Non-numeric feature value must raise ValueError."""
        with pytest.raises(ValueError):
            predict_disruption({"rainfall_mm": "heavy"})

    def test_out_of_range_rainfall_raises_value_error(self):
        """rainfall_mm above 2000 must raise ValueError."""
        with pytest.raises(ValueError):
            predict_disruption({"rainfall_mm": 9999})

    def test_out_of_range_flood_level_raises_value_error(self):
        """flood_level above 3 must raise ValueError."""
        with pytest.raises(ValueError):
            predict_disruption({"flood_level": 99})

    def test_negative_connectivity_raises_value_error(self):
        """connectivity_score below 0 must raise ValueError."""
        with pytest.raises(ValueError):
            predict_disruption({"connectivity_score": -0.1})


# ---------------------------------------------------------------------------
# Test 7: Determinism
# ---------------------------------------------------------------------------


class TestDeterminism:
    def test_same_input_gives_same_output(self):
        """Same input must always produce identical output."""
        r1 = predict_disruption(HIGH_RISK_INPUT)
        r2 = predict_disruption(HIGH_RISK_INPUT)
        assert r1["risk_probability"] == r2["risk_probability"]
        assert r1["risk_level"] == r2["risk_level"]
        assert r1["risk_factors"] == r2["risk_factors"]

    def test_different_inputs_may_differ(self):
        """High-risk and low-risk inputs must produce different probabilities."""
        r_high = predict_disruption(HIGH_RISK_INPUT)
        r_low = predict_disruption(LOW_RISK_INPUT)
        assert r_high["risk_probability"] > r_low["risk_probability"]


# ---------------------------------------------------------------------------
# Test 8: Model loads correctly
# ---------------------------------------------------------------------------


class TestModelLoader:
    def test_model_loads_without_error(self):
        """ModelLoader.get_model() must return a non-None object."""
        ModelLoader.reset()
        model = ModelLoader.get_model()
        assert model is not None

    def test_model_has_predict_proba(self):
        """Loaded model must have predict_proba method (sklearn Pipeline)."""
        model = ModelLoader.get_model()
        assert hasattr(model, "predict_proba"), "Model must support predict_proba"

    def test_model_predict_proba_shape(self):
        """predict_proba must return shape (1, 2) for single input."""
        import pandas as pd
        model = ModelLoader.get_model()
        X = pd.DataFrame([{
            "rainfall_mm": 50.0,
            "flood_level": 1,
            "landslide_indicator": 0,
            "road_condition": 1,
            "traffic_level": 1,
            "historical_incidents": 2,
            "terrain_risk": 1,
            "bridge_condition": 0,
            "incident_severity": 0,
            "connectivity_score": 0.7,
        }])
        proba = model.predict_proba(X)
        assert proba.shape == (1, 2), f"Expected (1, 2), got {proba.shape}"
        assert abs(proba[0].sum() - 1.0) < 1e-6, "Probabilities must sum to 1"


# ---------------------------------------------------------------------------
# Test 9: Explanation quality
# ---------------------------------------------------------------------------


class TestExplanation:
    def test_high_risk_has_nonempty_factors(self):
        """High-risk input must produce at least one risk factor."""
        result = predict_disruption(HIGH_RISK_INPUT)
        assert len(result["risk_factors"]) > 0, "High-risk input must have factors"

    def test_factors_are_strings(self):
        """All risk factors must be non-empty strings."""
        result = predict_disruption(HIGH_RISK_INPUT)
        for factor in result["risk_factors"]:
            assert isinstance(factor, str) and len(factor) > 0

    def test_explainer_directly_with_known_input(self):
        """Explainer must identify heavy rainfall as a factor."""
        factors = explain_risk_factors({"rainfall_mm": 250}, probability=0.9)
        assert any("rainfall" in f.lower() or "rain" in f.lower() for f in factors), (
            f"Expected rainfall factor, got: {factors}"
        )

    def test_low_risk_has_no_spurious_factors(self):
        """Calm-conditions input must produce no risk factors."""
        result = predict_disruption(LOW_RISK_INPUT)
        assert len(result["risk_factors"]) == 0, (
            f"Expected no factors for calm conditions, got: {result['risk_factors']}"
        )


# ---------------------------------------------------------------------------
# Test 10: Risk level thresholds are well-defined
# ---------------------------------------------------------------------------


class TestRiskThresholds:
    @pytest.mark.parametrize("prob,expected", [
        (0.00, "LOW"),
        (0.24, "LOW"),
        (0.25, "MODERATE"),
        (0.49, "MODERATE"),
        (0.50, "HIGH"),
        (0.74, "HIGH"),
        (0.75, "CRITICAL"),
        (1.00, "CRITICAL"),
    ])
    def test_risk_level_thresholds(self, prob: float, expected: str):
        """Risk level classification must match defined thresholds."""
        result = _classify_risk(prob)
        assert result == expected, (
            f"p={prob}: expected {expected}, got {result}"
        )


# ---------------------------------------------------------------------------
# Test 11: FastAPI router
# ---------------------------------------------------------------------------


class TestFastAPIRouter:
    def test_router_imports_successfully(self):
        """FastAPI predict router must import without errors."""
        from backend.app.api.predict import router
        assert router is not None

    def test_router_has_required_routes(self):
        """Router must expose the /disruption POST and /health GET routes."""
        from backend.app.api.predict import router
        paths = [route.path for route in router.routes]
        assert any(p.endswith("/disruption") for p in paths), (
            f"Missing /disruption route. Found: {paths}"
        )
        assert any(p.endswith("/health") for p in paths), (
            f"Missing /health route. Found: {paths}"
        )

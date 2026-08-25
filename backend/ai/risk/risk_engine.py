"""
risk_engine.py
--------------
Core public interface for NER-SHIELD disruption-risk prediction.

Usage (backend integration contract)
-------------------------------------
    from backend.ai.risk.risk_engine import predict_disruption

    result = predict_disruption({
        "rainfall_mm": 220,
        "flood_level": 2,
        "landslide_indicator": 1,
        "road_condition": 2,
        "traffic_level": 2,
        "historical_incidents": 6,
        "terrain_risk": 2,
        "bridge_condition": 1,
        "incident_severity": 2,
        "connectivity_score": 0.3,
    })

    # result:
    # {
    #   "risk_probability": 0.82,
    #   "risk_level": "HIGH",
    #   "risk_factors": ["Heavy rainfall (220mm)", "Active landslide warning", ...],
    #   "model_version": "prototype-v1"
    # }

Risk Level Thresholds
---------------------
    CRITICAL : probability >= 0.75
    HIGH     : probability >= 0.50
    MODERATE : probability >= 0.25
    LOW      : probability <  0.25
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from backend.ai.risk.explainer import explain_risk_factors
from backend.ml.loader import ModelLoader

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MODEL_VERSION = os.getenv("MODEL_VERSION", "prototype-v1")

RISK_THRESHOLDS = [
    (0.75, "CRITICAL"),
    (0.50, "HIGH"),
    (0.25, "MODERATE"),
    (0.00, "LOW"),
]

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
]

# Defaults used for missing features (median-ish neutral values)
FEATURE_DEFAULTS: dict[str, float] = {
    "rainfall_mm": 40.0,
    "flood_level": 0,
    "landslide_indicator": 0,
    "road_condition": 1,
    "traffic_level": 1,
    "historical_incidents": 2,
    "terrain_risk": 1,
    "bridge_condition": 0,
    "incident_severity": 0,
    "connectivity_score": 0.7,
}

# ---------------------------------------------------------------------------
# Risk classification
# ---------------------------------------------------------------------------


def _classify_risk(probability: float) -> str:
    """Map a probability in [0, 1] to a human-readable risk level."""
    for threshold, level in RISK_THRESHOLDS:
        if probability >= threshold:
            return level
    return "LOW"


# ---------------------------------------------------------------------------
# Input validation & coercion
# ---------------------------------------------------------------------------

_NUMERIC_BOUNDS: dict[str, tuple[float, float]] = {
    "rainfall_mm": (0.0, 2000.0),
    "flood_level": (0, 3),
    "landslide_indicator": (0, 2),
    "road_condition": (0, 3),
    "traffic_level": (0, 4),
    "historical_incidents": (0, 100),
    "terrain_risk": (0, 2),
    "bridge_condition": (0, 2),
    "incident_severity": (0, 3),
    "connectivity_score": (0.0, 1.0),
}


def _validate_and_coerce(raw: dict[str, Any]) -> pd.DataFrame:
    """
    Validate input types and ranges, fill missing features with defaults,
    and return a single-row DataFrame ready for the model pipeline.

    Raises
    ------
    ValueError
        If a provided value cannot be coerced to float or is outside bounds.
    TypeError
        If `raw` is not a dict.
    """
    if not isinstance(raw, dict):
        raise TypeError(f"Input must be a dict, got {type(raw).__name__}")

    row: dict[str, float] = {}
    for col in FEATURE_COLS:
        value = raw.get(col)
        if value is None:
            row[col] = FEATURE_DEFAULTS[col]
            continue

        try:
            value = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"Feature '{col}' must be numeric, got {type(raw[col]).__name__!r}: {raw[col]!r}"
            ) from exc

        lo, hi = _NUMERIC_BOUNDS[col]
        if not (lo <= value <= hi):
            raise ValueError(
                f"Feature '{col}' out of range [{lo}, {hi}]: got {value}"
            )

        row[col] = value

    return pd.DataFrame([row], columns=FEATURE_COLS)


# ---------------------------------------------------------------------------
# Public prediction API
# ---------------------------------------------------------------------------


def predict_disruption(input_data: dict[str, Any]) -> dict:
    """
    Predict logistics disruption risk for a route/segment.

    Parameters
    ----------
    input_data : dict
        Feature values. Any missing key is filled with its neutral default.
        All provided numeric values must be within valid bounds (see module
        docstring for feature schema).

    Returns
    -------
    dict with keys:
        risk_probability : float in [0, 1]
        risk_level       : "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
        risk_factors     : list[str] — human-readable explanations
        model_version    : str

    Raises
    ------
    ValueError  : bad feature value or out-of-range
    TypeError   : input_data is not a dict
    RuntimeError: model could not be loaded
    """
    X = _validate_and_coerce(input_data)

    model = ModelLoader.get_model()
    prob = float(model.predict_proba(X)[0, 1])
    prob = round(np.clip(prob, 0.0, 1.0), 4)

    level = _classify_risk(prob)
    factors = explain_risk_factors(input_data, prob)

    return {
        "risk_probability": prob,
        "risk_level": level,
        "risk_factors": factors,
        "model_version": MODEL_VERSION,
    }

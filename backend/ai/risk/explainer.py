"""
explainer.py
------------
Rule-based explainability for the NER disruption-risk engine.

Philosophy
----------
The explanations are generated from input feature thresholds — the same
thresholds that drove the synthetic label generation. This keeps
explanations honest and aligned with what the model actually learned.

We deliberately avoid heavy SHAP/LIME dependencies for this prototype:
- Keeps the system lightweight and fast (< 1 ms per call)
- Thresholds are inspectable and auditable by a jury
- Explanations are in plain language suitable for field officials

If a real-data model is substituted later, SHAP explanations can be layered
on top by replacing this module — the API contract is identical.

Output format
-------------
A list of human-readable strings, ordered by risk contribution (highest first).
Empty list when no risk factors are detected.

Example
-------
    explain_risk_factors({"rainfall_mm": 220, "flood_level": 2, ...}, prob=0.83)
    # -> [
    #      "Heavy rainfall (220.0mm)",
    #      "Moderate flood level",
    #      "Poor road condition",
    #    ]
"""

from __future__ import annotations

from typing import Any


# ---------------------------------------------------------------------------
# Individual factor detectors
# Each returns (weight, message) or None.
# Weight controls ordering — higher weight appears first in the output list.
# ---------------------------------------------------------------------------


def _check_rainfall(v: float | None) -> tuple[float, str] | None:
    if v is None:
        return None
    v = float(v)
    if v >= 200:
        return (0.95, f"Heavy rainfall ({v:.0f}mm — extreme risk threshold)")
    if v >= 100:
        return (0.70, f"Significant rainfall ({v:.0f}mm)")
    if v >= 50:
        return (0.35, f"Moderate rainfall ({v:.0f}mm)")
    return None


def _check_flood(v: float | None) -> tuple[float, str] | None:
    if v is None:
        return None
    v = int(round(float(v)))
    labels = {3: (0.90, "Severe flood condition"), 2: (0.65, "Moderate flood level")}
    return labels.get(v)


def _check_landslide(v: float | None) -> tuple[float, str] | None:
    if v is None:
        return None
    v = int(round(float(v)))
    labels = {2: (0.88, "Active landslide"), 1: (0.55, "Landslide warning issued")}
    return labels.get(v)


def _check_road_condition(v: float | None) -> tuple[float, str] | None:
    if v is None:
        return None
    v = int(round(float(v)))
    labels = {
        3: (0.75, "Very poor road condition"),
        2: (0.50, "Poor road condition"),
    }
    return labels.get(v)


def _check_incident_severity(v: float | None) -> tuple[float, str] | None:
    if v is None:
        return None
    v = int(round(float(v)))
    labels = {
        3: (0.85, "Critical incident on route"),
        2: (0.60, "Major incident on route"),
    }
    return labels.get(v)


def _check_historical_incidents(v: float | None) -> tuple[float, str] | None:
    if v is None:
        return None
    v = float(v)
    if v >= 7:
        return (0.72, f"High historical incident rate ({v:.0f} in 30 days)")
    if v >= 5:
        return (0.40, f"Elevated historical incidents ({v:.0f} in 30 days)")
    return None


def _check_bridge_condition(v: float | None) -> tuple[float, str] | None:
    if v is None:
        return None
    v = int(round(float(v)))
    if v >= 2:
        return (0.55, "Degraded bridge condition")
    return None


def _check_connectivity(v: float | None) -> tuple[float, str] | None:
    if v is None:
        return None
    v = float(v)
    if v < 0.25:
        return (0.65, f"Very low connectivity (score: {v:.2f})")
    if v < 0.40:
        return (0.40, f"Low connectivity (score: {v:.2f})")
    return None


def _check_terrain(v: float | None) -> tuple[float, str] | None:
    if v is None:
        return None
    v = int(round(float(v)))
    if v >= 2:
        return (0.45, "Mountainous terrain — high natural risk")
    return None


def _check_traffic(v: float | None) -> tuple[float, str] | None:
    if v is None:
        return None
    v = int(round(float(v)))
    labels = {
        4: (0.50, "Gridlock traffic conditions"),
        3: (0.30, "Heavy traffic"),
    }
    return labels.get(v)


# Ordered list of (feature_key, detector_fn)
_DETECTORS = [
    ("rainfall_mm", _check_rainfall),
    ("flood_level", _check_flood),
    ("landslide_indicator", _check_landslide),
    ("incident_severity", _check_incident_severity),
    ("road_condition", _check_road_condition),
    ("historical_incidents", _check_historical_incidents),
    ("connectivity_score", _check_connectivity),
    ("bridge_condition", _check_bridge_condition),
    ("terrain_risk", _check_terrain),
    ("traffic_level", _check_traffic),
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def explain_risk_factors(
    input_data: dict[str, Any],
    probability: float,
    max_factors: int = 5,
) -> list[str]:
    """
    Generate human-readable risk factor explanations.

    Parameters
    ----------
    input_data    : dict of feature values (missing keys are gracefully skipped)
    probability   : predicted risk probability [0, 1]
    max_factors   : maximum number of factors to return (default 5)

    Returns
    -------
    list[str]
        Ordered list of risk factor descriptions (highest weight first).
        Empty list when no factors exceed their thresholds.
    """
    candidates: list[tuple[float, str]] = []

    for feature_key, detector in _DETECTORS:
        raw = input_data.get(feature_key)
        if raw is None:
            continue
        try:
            result = detector(raw)
        except (TypeError, ValueError):
            # Silently skip malformed values — validation happens in risk_engine
            continue
        if result is not None:
            candidates.append(result)

    # Sort by weight descending
    candidates.sort(key=lambda x: x[0], reverse=True)
    factors = [msg for _, msg in candidates[:max_factors]]

    # If probability is very high but no factors triggered, add a catch-all
    if not factors and probability >= 0.50:
        factors = ["Multiple combined route risk factors detected"]

    return factors

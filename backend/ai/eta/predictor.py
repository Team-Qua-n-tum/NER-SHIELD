"""
predictor.py — ETA Predictor for NER-SHIELD.

Two operating modes:
  1. Heuristic (default, always available): uses road condition + weather speed factors.
  2. ML (optional): loads a joblib regression model if ETA_MODEL_PATH is set and the file exists.

The predictor is deterministic for the same inputs and works in DEMO_MODE=true.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

from .features import build_eta_features

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_ETA_MODEL_PATH_ENV = "ETA_MODEL_PATH"
_MODEL_VERSION_HEURISTIC = "heuristic-v1"


# ---------------------------------------------------------------------------
# Predictor
# ---------------------------------------------------------------------------


class ETAPredictor:
    """
    Predicts Estimated Time of Arrival for a NER logistics route.

    Heuristic method is always available.
    ML method activates automatically when ETA_MODEL_PATH points to a valid joblib file.
    """

    def __init__(self, model_path: Optional[str] = None) -> None:
        self._model = None
        self._model_version = _MODEL_VERSION_HEURISTIC

        path_str = model_path or os.getenv(_ETA_MODEL_PATH_ENV)
        if path_str:
            path = Path(path_str)
            if path.exists():
                try:
                    import joblib
                    self._model = joblib.load(path)
                    self._model_version = f"ml-eta-{path.stem}"
                    logger.info("[ETAPredictor] ML model loaded from %s", path)
                except Exception as exc:
                    logger.warning(
                        "[ETAPredictor] Could not load ML model from %s: %s — using heuristic.",
                        path,
                        exc,
                    )

    def predict(
        self,
        distance_km: float,
        road_condition: str = "GOOD",
        weather_condition: str = "CLEAR",
        rainfall_mm: float = 0.0,
        disruption_risk: float = 0.0,
        incident_delay_hrs: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Compute ETA with delay breakdown.

        Parameters
        ----------
        distance_km       : Total route length in km.
        road_condition    : EXCELLENT | GOOD | FAIR | POOR | SEVERE_DAMAGE
        weather_condition : CLEAR | RAIN | HEAVY_RAIN | FOG | THUNDERSTORM
        rainfall_mm       : 24-hour rainfall accumulation.
        disruption_risk   : AI risk score 0–1.
        incident_delay_hrs: Additional delay from active incidents (hrs).

        Returns
        -------
        dict with keys:
          eta_hrs, base_travel_time_hrs, disruption_buffer_hrs,
          incident_delay_hrs, effective_speed_kmh,
          method, model_version
        """
        if distance_km <= 0:
            return self._zero_eta()

        features = build_eta_features(
            distance_km=distance_km,
            road_condition=road_condition,
            weather_condition=weather_condition,
            rainfall_mm=rainfall_mm,
            disruption_risk=disruption_risk,
            incident_delay_hrs=incident_delay_hrs,
        )

        if self._model is not None:
            return self._ml_predict(features, incident_delay_hrs)
        return self._heuristic_predict(features, incident_delay_hrs)

    def _heuristic_predict(
        self,
        features: Dict[str, Any],
        incident_delay_hrs: float,
    ) -> Dict[str, Any]:
        effective_speed = features["effective_speed_kmh"]
        distance = features["distance_km"]
        disruption_buffer = features["disruption_buffer_hrs"]

        base_travel_time = distance / effective_speed
        eta = base_travel_time + disruption_buffer + incident_delay_hrs

        return {
            "eta_hrs": round(eta, 3),
            "base_travel_time_hrs": round(base_travel_time, 3),
            "disruption_buffer_hrs": round(disruption_buffer, 3),
            "incident_delay_hrs": round(incident_delay_hrs, 3),
            "effective_speed_kmh": effective_speed,
            "method": "heuristic",
            "model_version": self._model_version,
        }

    def _ml_predict(
        self,
        features: Dict[str, Any],
        incident_delay_hrs: float,
    ) -> Dict[str, Any]:
        """Use the loaded ML regression model to predict ETA."""
        import numpy as np

        X = np.array([[
            features["distance_km"],
            features["effective_speed_kmh"],
            features["disruption_buffer_hrs"],
            incident_delay_hrs,
        ]])
        try:
            eta = float(self._model.predict(X)[0])
        except Exception as exc:
            logger.warning("[ETAPredictor] ML predict failed: %s — falling back to heuristic.", exc)
            return self._heuristic_predict(features, incident_delay_hrs)

        base_travel_time = features["distance_km"] / features["effective_speed_kmh"]
        return {
            "eta_hrs": round(max(0.0, eta), 3),
            "base_travel_time_hrs": round(base_travel_time, 3),
            "disruption_buffer_hrs": round(features["disruption_buffer_hrs"], 3),
            "incident_delay_hrs": round(incident_delay_hrs, 3),
            "effective_speed_kmh": features["effective_speed_kmh"],
            "method": "ml",
            "model_version": self._model_version,
        }

    @staticmethod
    def _zero_eta() -> Dict[str, Any]:
        return {
            "eta_hrs": 0.0,
            "base_travel_time_hrs": 0.0,
            "disruption_buffer_hrs": 0.0,
            "incident_delay_hrs": 0.0,
            "effective_speed_kmh": 0.0,
            "method": "heuristic",
            "model_version": _MODEL_VERSION_HEURISTIC,
        }


# Singleton
eta_predictor = ETAPredictor()

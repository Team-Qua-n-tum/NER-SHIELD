"""
model.py — Neural network architectures for road-segment future prediction.

Supports:
1. Native Scikit-Learn Multi-Output MLPRegressor (zero extra dependencies).
2. Optional PyTorch GRU/MLP architecture (activated if torch is installed).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from backend.ai.segment.temporal_context import RoadSegmentTemporalContext

logger = logging.getLogger(__name__)

# Feature column definitions
FEATURE_DIM = 15
TARGET_DIM = 4  # [disruption_prob, closure_prob, speed_ratio, delay_minutes]

FEATURE_NAMES = [
    "rainfall_24h_norm",
    "rainfall_1h_norm",
    "weather_severity",
    "wind_speed_norm",
    "slope_norm",
    "soil_risk",
    "gis_penalty",
    "hazard_radius_norm",
    "incident_proximity_norm",
    "road_status_code",
    "traffic_congestion",
    "horizon_factor",
    "rainfall_trend",
    "speed_drop_ratio",
    "incident_delta",
]

# ---------------------------------------------------------------------------
# Optional PyTorch Deep Learning Architecture
# ---------------------------------------------------------------------------

try:
    import torch
    import torch.nn as nn

    class RoadSegmentGRU(nn.Module):
        """
        Lightweight GRU + multi-head MLP for road-segment future forecasting.
        Processes historical sequence (batch, seq_len, feat_dim) and static features.
        """

        def __init__(self, input_dim: int = FEATURE_DIM, hidden_dim: int = 32, num_layers: int = 1):
            super().__init__()
            self.gru = nn.GRU(input_dim, hidden_dim, num_layers=num_layers, batch_first=True)
            self.fc_shared = nn.Sequential(
                nn.Linear(hidden_dim, 32),
                nn.ReLU(),
            )
            # Head 1: Disruption Probability [0, 1]
            self.head_disruption = nn.Sequential(
                nn.Linear(32, 1),
                nn.Sigmoid(),
            )
            # Head 2: Road Closure Probability [0, 1]
            self.head_closure = nn.Sequential(
                nn.Linear(32, 1),
                nn.Sigmoid(),
            )
            # Head 3: Speed Ratio [0, 1] (fraction of speed limit)
            self.head_speed = nn.Sequential(
                nn.Linear(32, 1),
                nn.Sigmoid(),
            )
            # Head 4: Travel-time delay minutes >= 0
            self.head_delay = nn.Sequential(
                nn.Linear(32, 1),
                nn.ReLU(),
            )

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            # x shape: (batch, seq_len, input_dim) or (batch, input_dim)
            if x.dim() == 2:
                x = x.unsqueeze(1)
            out, _ = self.gru(x)
            h = self.fc_shared(out[:, -1, :])
            p_disruption = self.head_disruption(h)
            p_closure = self.head_closure(h)
            speed_ratio = self.head_speed(h)
            delay_min = self.head_delay(h)
            return torch.cat([p_disruption, p_closure, speed_ratio, delay_min], dim=-1)

    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    RoadSegmentGRU = None  # type: ignore


# ---------------------------------------------------------------------------
# Native Scikit-Learn MLP Architecture (Production default)
# ---------------------------------------------------------------------------

class ScikitSegmentMLP:
    """
    Multi-output Neural Network (MLP) for future disruption and delay forecasting.
    Uses scikit-learn MLPRegressor, requiring zero external heavy dependencies.
    """

    def __init__(self, hidden_layer_sizes: Tuple[int, ...] = (64, 32), random_state: int = 42):
        from sklearn.neural_network import MLPRegressor  # noqa: PLC0415
        self.model = MLPRegressor(
            hidden_layer_sizes=hidden_layer_sizes,
            activation="relu",
            solver="adam",
            max_iter=300,
            random_state=random_state,
        )
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> ScikitSegmentMLP:
        self.model.fit(X, y)
        self.is_fitted = True
        return self

    def predict_outputs(self, features: np.ndarray) -> Dict[str, float]:
        """
        Run forward inference on a 1D or 2D feature array.
        Returns dict with:
          disruption_probability: float in [0.0, 1.0]
          closure_probability: float in [0.0, 1.0]
          speed_ratio: float in [0.0, 1.0]
          delay_minutes: float >= 0.0
        """
        if not self.is_fitted:
            raise RuntimeError("ScikitSegmentMLP is not fitted.")

        X = features.reshape(1, -1) if features.ndim == 1 else features
        raw = self.model.predict(X)[0]

        # Enforce bounds
        disruption_prob = float(np.clip(raw[0], 0.0, 1.0))
        closure_prob = float(np.clip(raw[1], 0.0, 1.0))
        speed_ratio = float(np.clip(raw[2], 0.05, 1.0))
        delay_min = float(max(0.0, raw[3]))

        return {
            "disruption_probability": round(disruption_prob, 4),
            "closure_probability": round(closure_prob, 4),
            "speed_ratio": round(speed_ratio, 4),
            "delay_minutes": round(delay_min, 2),
        }


# ---------------------------------------------------------------------------
# Feature Extraction from RoadSegmentTemporalContext
# ---------------------------------------------------------------------------

def extract_segment_features(ctx: RoadSegmentTemporalContext) -> np.ndarray:
    """
    Extract a normalized 1D numpy array of 15 features from RoadSegmentTemporalContext.
    All values are clipped to [0.0, 1.0] or a standardized numeric scale.
    """
    curr = ctx.current_context

    # 1. Weather
    rain_24h = curr.effective_rainfall_mm()
    rain_24h_norm = float(np.clip(rain_24h / 300.0, 0.0, 1.0))

    rain_1h = curr.rainfall_mm_1h if curr.rainfall_mm_1h is not None else rain_24h / 24.0
    rain_1h_norm = float(np.clip(rain_1h / 50.0, 0.0, 1.0))

    wc = curr.effective_weather_condition()
    wc_map = {"CLEAR": 0.0, "FOG": 0.25, "RAIN": 0.50, "HEAVY_RAIN": 0.85, "THUNDERSTORM": 1.0}
    weather_severity = wc_map.get(wc, 0.2)

    wind_norm = float(np.clip((curr.wind_speed_kmh or 15.0) / 100.0, 0.0, 1.0))

    # 2. Terrain
    slope_norm = float(np.clip((curr.slope_degree or 15.0) / 60.0, 0.0, 1.0))
    soil = (curr.soil_type or "LOAM").upper()
    soil_map = {"GRAVEL": 0.2, "LOAM": 0.4, "CLAY": 0.8, "ROCKY": 0.85}
    soil_risk = soil_map.get(soil, 0.4)

    # 3. GIS hazard penalty
    gis_penalty = float(np.clip(curr.suggested_risk_penalty or 0.0, 0.0, 1.0))
    hazard_radius_norm = float(np.clip((curr.hazard_radius_km or 0.0) / 10.0, 0.0, 1.0))
    prox = curr.incident_proximity_meters or 5000.0
    incident_proximity_norm = float(np.clip(1.0 - (prox / 5000.0), 0.0, 1.0))

    # 4. Road state
    rs = (curr.road_status or "OPEN").upper()
    rs_map = {"OPEN": 0.0, "IN_PROGRESS": 0.35, "DISRUPTED": 0.65, "BLOCKED": 1.0, "CLOSED": 1.0}
    road_status_code = rs_map.get(rs, 0.0)

    traffic_congestion = float(np.clip(curr.traffic_congestion_proxy or 0.2, 0.0, 1.0))

    # 5. Prediction horizon factor (scaled up to 240 mins)
    horizon_factor = float(np.clip(ctx.prediction_horizon_minutes / 240.0, 0.05, 1.0))

    # 6. Temporal sequence trends
    rain_trend = float(np.clip((ctx.rainfall_trend_rate() + 20.0) / 40.0, 0.0, 1.0))
    speed_drop = ctx.speed_drop_ratio()
    inc_delta = float(np.clip(ctx.incident_delta() / 5.0, 0.0, 1.0))

    vec = np.array([
        rain_24h_norm,
        rain_1h_norm,
        weather_severity,
        wind_norm,
        slope_norm,
        soil_risk,
        gis_penalty,
        hazard_radius_norm,
        incident_proximity_norm,
        road_status_code,
        traffic_congestion,
        horizon_factor,
        rain_trend,
        speed_drop,
        inc_delta,
    ], dtype=np.float32)

    return vec

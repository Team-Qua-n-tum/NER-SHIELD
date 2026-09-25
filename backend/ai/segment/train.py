"""
train.py — Offline training script for road-segment disruption and delay prediction.

Generates calibrated synthetic scenarios across NER terrain conditions,
trains a ScikitSegmentMLP model, and saves the artifact.

NOTE: This script is run strictly offline and is NEVER invoked during request processing.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Tuple

import joblib
import numpy as np

from backend.ai.segment.model import FEATURE_DIM, ScikitSegmentMLP

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_THIS_DIR = Path(__file__).resolve().parent
_MODELS_DIR = _THIS_DIR.parent / "models"


def generate_synthetic_segment_dataset(n_samples: int = 1200, seed: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic training pairs (X, y) representing diverse road conditions.

    X features (15 dim):
    [rain_24h, rain_1h, weather_sev, wind, slope, soil, gis_pen, hazard_rad,
     inc_prox, road_status, congestion, horizon, rain_trend, speed_drop, inc_delta]

    y targets (4 dim):
    [disruption_prob, closure_prob, speed_ratio, delay_minutes]
    """
    rng = np.random.default_rng(seed)

    X = np.zeros((n_samples, FEATURE_DIM), dtype=np.float32)
    y = np.zeros((n_samples, 4), dtype=np.float32)

    for i in range(n_samples):
        # Sample features
        rain_24h = rng.uniform(0.0, 1.0)
        rain_1h = np.clip(rain_24h * rng.uniform(0.5, 1.5), 0.0, 1.0)
        weather_sev = rng.choice([0.0, 0.25, 0.50, 0.85, 1.0], p=[0.35, 0.2, 0.2, 0.15, 0.1])
        wind = rng.uniform(0.0, 0.8)
        slope = rng.uniform(0.0, 1.0)
        soil = rng.choice([0.2, 0.4, 0.8, 0.85])
        gis_pen = rng.choice([0.0, 0.2, 0.4, 0.7, 1.0], p=[0.45, 0.2, 0.15, 0.1, 0.1])
        hazard_rad = rng.uniform(0.0, 1.0) if gis_pen > 0 else 0.0
        inc_prox = rng.uniform(0.0, 1.0) if gis_pen > 0 else 0.0
        road_status = rng.choice([0.0, 0.35, 0.65, 1.0], p=[0.6, 0.15, 0.15, 0.1])
        congestion = rng.uniform(0.1, 0.9)
        horizon = rng.choice([0.125, 0.25, 0.5, 1.0])  # 30, 60, 120, 240 mins
        rain_trend = rng.uniform(0.2, 0.8)
        speed_drop = rng.uniform(0.0, 0.8) if road_status > 0 or gis_pen > 0 else rng.uniform(0.0, 0.2)
        inc_delta = rng.uniform(0.0, 0.6) if gis_pen > 0 else 0.0

        X[i] = [
            rain_24h, rain_1h, weather_sev, wind, slope, soil, gis_pen,
            hazard_rad, inc_prox, road_status, congestion, horizon,
            rain_trend, speed_drop, inc_delta,
        ]

        # Calculate calibrated targets
        # Blocked road override
        if road_status >= 0.9:
            disruption = rng.uniform(0.92, 0.99)
            closure = rng.uniform(0.90, 0.99)
            speed = rng.uniform(0.05, 0.10)
            delay = rng.uniform(60.0, 180.0)
        else:
            # Multi-factor score
            risk_score = (
                0.25 * rain_24h +
                0.15 * weather_sev +
                0.12 * slope +
                0.28 * gis_pen +
                0.10 * road_status +
                0.10 * congestion
            )
            # Horizon escalation
            risk_score = min(1.0, risk_score * (1.0 + 0.3 * horizon))
            disruption = float(np.clip(risk_score + rng.normal(0, 0.03), 0.01, 0.98))

            # Closure probability is high only when disruption and GIS hazard or severe rain are high
            if disruption > 0.70 and (gis_pen > 0.5 or rain_24h > 0.7 or slope > 0.7):
                closure = float(np.clip((disruption - 0.4) * 1.5 + rng.normal(0, 0.04), 0.0, 0.95))
            else:
                closure = float(np.clip(disruption * 0.2 + rng.normal(0, 0.02), 0.0, 0.30))

            # Speed ratio decays with disruption and congestion
            speed = float(np.clip(1.0 - (0.65 * disruption + 0.25 * congestion), 0.10, 1.0))

            # Delay in minutes scales with distance and severity
            base_delay = 50.0 * disruption * (1.0 + horizon)
            delay = float(max(0.0, base_delay + rng.normal(0, 3.0)))

        y[i] = [disruption, closure, speed, delay]

    return X, y


def train_and_save(save_path: Path = _MODELS_DIR / "segment_dl_model.joblib") -> ScikitSegmentMLP:
    """Train offline MLP model and persist artifact."""
    save_path.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Generating synthetic training data...")
    X, y = generate_synthetic_segment_dataset()

    logger.info("Fitting ScikitSegmentMLP on %d samples...", len(X))
    mlp = ScikitSegmentMLP(hidden_layer_sizes=(64, 32), random_state=42)
    mlp.fit(X, y)

    logger.info("Saving trained artifact to %s...", save_path)
    joblib.dump(mlp, save_path)
    logger.info("Training complete.")
    return mlp


if __name__ == "__main__":
    train_and_save()

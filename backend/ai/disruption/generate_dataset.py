"""
generate_dataset.py
-------------------
Generates a synthetic NER logistics disruption dataset for training and testing
the disruption-risk prediction model.

SYNTHETIC DATA NOTICE
---------------------
All records in this dataset are synthetically generated.
No real government or operational data is included.
Feature distributions are based on published NER monsoon/terrain statistics.
The disruption target is derived from a deterministic weighted rule — not from
real incident records.

This pipeline is designed so that real data can replace this file later
without changing any downstream model or engine code.

Output: data/synthetic/disruption_dataset.csv
"""

from __future__ import annotations

import argparse
import os
import sys

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SEED = 42
N_SAMPLES = 1_000

OUTPUT_DIR = os.path.join(
    os.path.dirname(__file__),  # backend/ai/disruption/
    "..", "..", "..",            # project root
    "data", "synthetic",
)
OUTPUT_FILE = "disruption_dataset.csv"

# ---------------------------------------------------------------------------
# Feature generation
# ---------------------------------------------------------------------------


def _generate_features(rng: np.random.Generator, n: int) -> pd.DataFrame:
    """
    Generate raw feature columns.

    Feature ranges are calibrated to NER monsoon and terrain conditions:
    - Rainfall: IMD data shows NER receives 200-3000 mm annually; per-event
      readings modelled up to 350 mm for a single observation window.
    - Terrain: ~60 % of NER is hilly/mountainous (source: NESAC reports).
    """

    rainfall_mm = rng.uniform(0, 350, n).round(1)

    flood_level = rng.choice([0, 1, 2, 3], n, p=[0.50, 0.25, 0.15, 0.10])

    landslide_indicator = rng.choice([0, 1, 2], n, p=[0.65, 0.25, 0.10])

    road_condition = rng.choice([0, 1, 2, 3], n, p=[0.30, 0.35, 0.25, 0.10])

    traffic_level = rng.choice([0, 1, 2, 3, 4], n, p=[0.25, 0.30, 0.25, 0.15, 0.05])

    historical_incidents = rng.integers(0, 11, n)  # 0–10 incidents

    terrain_risk = rng.choice([0, 1, 2], n, p=[0.25, 0.40, 0.35])

    bridge_condition = rng.choice([0, 1, 2], n, p=[0.50, 0.35, 0.15])

    incident_severity = rng.choice([0, 1, 2, 3], n, p=[0.50, 0.25, 0.15, 0.10])

    connectivity_score = rng.uniform(0, 1, n).round(3)

    return pd.DataFrame(
        {
            "rainfall_mm": rainfall_mm,
            "flood_level": flood_level,
            "landslide_indicator": landslide_indicator,
            "road_condition": road_condition,
            "traffic_level": traffic_level,
            "historical_incidents": historical_incidents,
            "terrain_risk": terrain_risk,
            "bridge_condition": bridge_condition,
            "incident_severity": incident_severity,
            "connectivity_score": connectivity_score,
        }
    )


# ---------------------------------------------------------------------------
# Target generation (deterministic rule — NOT a model)
# ---------------------------------------------------------------------------

def _compute_risk_score(df: pd.DataFrame) -> np.ndarray:
    """
    Compute a continuous risk score [0, 1] from features.

    Weights were chosen so that:
      - Heavy rain + active landslide + poor roads → score ≈ 1.0 (high)
      - Dry weather + good roads + no incidents  → score ≈ 0.0 (low)

    This rule is purely for generating realistic synthetic labels.
    The downstream ML model learns from these labels; it is NOT this rule.
    """
    score = np.zeros(len(df), dtype=float)

    # Rainfall contribution (normalised to [0, 1] at 350 mm max)
    score += 0.20 * (df["rainfall_mm"] / 350.0)

    # Flood level (max = 3)
    score += 0.20 * (df["flood_level"] / 3.0)

    # Landslide indicator (max = 2)
    score += 0.15 * (df["landslide_indicator"] / 2.0)

    # Road condition (max = 3)
    score += 0.15 * (df["road_condition"] / 3.0)

    # Incident severity (max = 3)
    score += 0.10 * (df["incident_severity"] / 3.0)

    # Historical incidents (max = 10)
    score += 0.08 * (df["historical_incidents"] / 10.0)

    # Terrain risk (max = 2)
    score += 0.06 * (df["terrain_risk"] / 2.0)

    # Bridge condition (max = 2)
    score += 0.04 * (df["bridge_condition"] / 2.0)

    # Low connectivity increases risk
    score += 0.02 * (1.0 - df["connectivity_score"])

    return np.clip(score, 0, 1)


def _apply_disruption_label(
    df: pd.DataFrame,
    rng: np.random.Generator,
    threshold: float = 0.45,
    noise_rate: float = 0.04,
) -> pd.Series:
    """
    Convert risk score to binary disruption label.

    A small noise_rate (4 %) flips some labels to simulate real-world
    label uncertainty / measurement error — making the classification
    task non-trivially learnable (avoids 100 % training accuracy).
    """
    score = _compute_risk_score(df)
    labels = (score >= threshold).astype(int)

    # Apply label noise
    flip_mask = rng.random(len(labels)) < noise_rate
    labels[flip_mask] = 1 - labels[flip_mask]

    return pd.Series(labels, name="disruption")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def generate(n: int = N_SAMPLES, seed: int = SEED, output_dir: str = OUTPUT_DIR) -> str:
    """
    Generate and save the synthetic disruption dataset.

    Returns the absolute path to the saved CSV file.
    """
    rng = np.random.default_rng(seed)

    df = _generate_features(rng, n)
    df["disruption"] = _apply_disruption_label(df, rng)

    # Sanity check: target should have reasonable class balance
    positive_rate = df["disruption"].mean()
    if not (0.25 <= positive_rate <= 0.75):
        print(
            f"[WARNING] Disruption positive rate = {positive_rate:.2%}. "
            "Consider adjusting threshold.",
            file=sys.stderr,
        )

    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, OUTPUT_FILE)

    # Write CSV with synthetic-data header comment
    header_comment = (
        "# SYNTHETIC DATA — NER-SHIELD Disruption Dataset\n"
        "# Generated by: backend/ai/disruption/generate_dataset.py\n"
        f"# Seed: {seed} | Samples: {n}\n"
        "# This file contains synthetically generated data only.\n"
        "# Replace with real data by dropping a real CSV at this path.\n"
    )
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(header_comment)

    df.to_csv(output_path, mode="a", index=False, lineterminator="\n")

    print(f"[OK] Dataset saved -> {output_path}")
    print(f"     Rows: {len(df)} | Disruption rate: {positive_rate:.2%}")
    print(f"     Columns: {list(df.columns)}")

    return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate NER disruption dataset")
    parser.add_argument("--n", type=int, default=N_SAMPLES, help="Number of samples")
    parser.add_argument("--seed", type=int, default=SEED, help="Random seed")
    parser.add_argument("--output-dir", default=OUTPUT_DIR, help="Output directory")
    args = parser.parse_args()

    generate(n=args.n, seed=args.seed, output_dir=args.output_dir)

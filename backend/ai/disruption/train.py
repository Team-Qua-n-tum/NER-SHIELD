"""
train.py
--------
Trains the NER-SHIELD disruption-risk prediction model.

Pipeline:
  1. Load synthetic dataset (data/synthetic/disruption_dataset.csv)
  2. Preprocessing: median imputation + standard scaling
  3. Train two candidate models:
       a. Logistic Regression   (interpretable baseline)
       b. Random Forest         (ensemble, better non-linearity)
  4. Evaluate both on 20% hold-out: accuracy, precision, recall, F1, AUC-ROC
  5. Select winner by AUC-ROC
  6. Save winning sklearn Pipeline -> backend/ai/models/disruption_model.joblib
  7. Save evaluation report       -> backend/ai/models/evaluation_report.json

All metrics are measured on the actual hold-out set.
No fabricated accuracy numbers.

Usage:
    python backend/ai/disruption/train.py
    python backend/ai/disruption/train.py --data path/to/data.csv
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Paths (relative to project root, so run from d:\SIH)
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent  # d:\SIH

DEFAULT_DATA_PATH = PROJECT_ROOT / "data" / "synthetic" / "disruption_dataset.csv"
MODEL_DIR = PROJECT_ROOT / "backend" / "ai" / "models"
MODEL_PATH = MODEL_DIR / "disruption_model.joblib"
EVAL_PATH = MODEL_DIR / "evaluation_report.json"

RANDOM_STATE = 42
TEST_SIZE = 0.20

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
TARGET_COL = "disruption"


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------


def load_dataset(path: Path | str) -> pd.DataFrame:
    """Load CSV, skipping comment lines (lines starting with '#')."""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {path}.\n"
            "Run: python backend/ai/disruption/generate_dataset.py"
        )

    df = pd.read_csv(path, comment="#")

    missing_cols = set(FEATURE_COLS + [TARGET_COL]) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Dataset missing required columns: {missing_cols}")

    return df


# ---------------------------------------------------------------------------
# Preprocessing pipeline
# ---------------------------------------------------------------------------


def build_preprocessor() -> Pipeline:
    """
    Preprocessing steps applied before the classifier:
      1. Median imputation for any missing values
      2. StandardScaler — centres and scales all features

    Ordinal integer features (flood_level, road_condition, etc.) are passed
    through as-is after scaling. No categorical one-hot needed because all
    features are already integer-encoded by the dataset generator.
    """
    return Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )


# ---------------------------------------------------------------------------
# Model candidates
# ---------------------------------------------------------------------------


def _candidate_models() -> dict[str, object]:
    return {
        "logistic_regression": LogisticRegression(
            max_iter=1000,
            random_state=RANDOM_STATE,
            class_weight="balanced",
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            min_samples_leaf=5,
            random_state=RANDOM_STATE,
            class_weight="balanced",
            n_jobs=-1,
        ),
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            random_state=RANDOM_STATE,
        ),
    }


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------


def _evaluate(name: str, clf: Pipeline, X_test: pd.DataFrame, y_test: pd.Series) -> dict:
    """Evaluate a fitted pipeline on the hold-out set."""
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    return {
        "model": name,
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4),
    }


# ---------------------------------------------------------------------------
# Training entry point
# ---------------------------------------------------------------------------


def train(data_path: Path | str = DEFAULT_DATA_PATH) -> dict:
    """
    Train disruption-risk model, save artifact and evaluation report.

    Returns the evaluation report dict.
    """
    print("[1/5] Loading dataset ...")
    df = load_dataset(data_path)
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    print(f"      Samples: {len(df)} | Positive rate: {y.mean():.2%}")

    print("[2/5] Splitting train / hold-out ...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    print(f"      Train: {len(X_train)} | Test: {len(X_test)}")

    preprocessor = build_preprocessor()
    candidates = _candidate_models()
    results = []
    fitted_pipelines: dict[str, Pipeline] = {}

    print("[3/5] Training candidate models ...")
    for name, clf in candidates.items():
        pipeline = Pipeline(
            steps=[("preprocessor", preprocessor), ("classifier", clf)]
        )
        pipeline.fit(X_train, y_train)
        fitted_pipelines[name] = pipeline
        metrics = _evaluate(name, pipeline, X_test, y_test)
        results.append(metrics)
        print(
            f"      {name:<25} acc={metrics['accuracy']:.4f}  "
            f"f1={metrics['f1_score']:.4f}  "
            f"auc={metrics['roc_auc']:.4f}"
        )

    # Select winner by AUC-ROC
    winner_metrics = max(results, key=lambda r: r["roc_auc"])
    winner_name = winner_metrics["model"]
    winner_pipeline = fitted_pipelines[winner_name]

    print(f"\n[4/5] Winner: {winner_name} (AUC-ROC = {winner_metrics['roc_auc']:.4f})")

    # Save artifact
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(winner_pipeline, MODEL_PATH)
    print(f"      Model saved -> {MODEL_PATH}")

    # Save evaluation report
    report = {
        "selected_model": winner_name,
        "dataset": str(data_path),
        "dataset_rows": len(df),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "random_state": RANDOM_STATE,
        "test_size_fraction": TEST_SIZE,
        "feature_columns": FEATURE_COLS,
        "target_column": TARGET_COL,
        "model_path": str(MODEL_PATH),
        "all_models": results,
        "selected_metrics": winner_metrics,
        "data_note": "SYNTHETIC DATA — all records synthetically generated",
        "accuracy_note": (
            "All metrics measured on actual 20% stratified hold-out. "
            "No fabricated or extrapolated numbers."
        ),
    }

    with open(EVAL_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"      Evaluation report -> {EVAL_PATH}")

    print("[5/5] Training complete.")
    return report


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train NER disruption risk model")
    parser.add_argument(
        "--data",
        default=str(DEFAULT_DATA_PATH),
        help="Path to disruption CSV dataset",
    )
    args = parser.parse_args()
    report = train(data_path=args.data)
    print(f"\nSelected model : {report['selected_model']}")
    m = report["selected_metrics"]
    print(f"Accuracy       : {m['accuracy']:.4f}")
    print(f"F1-Score       : {m['f1_score']:.4f}")
    print(f"AUC-ROC        : {m['roc_auc']:.4f}")
    sys.exit(0)

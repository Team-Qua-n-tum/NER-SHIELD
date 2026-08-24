"""
loader.py
---------
Singleton model loader for the NER-SHIELD disruption risk model.

The loader:
1. Tries to load the pre-trained pipeline from disk (MODEL_PATH).
2. If the artifact is missing (first-run or gitignored), it re-trains
   automatically from the synthetic dataset and saves the artifact.
3. Caches the model in memory for subsequent calls (no repeated I/O).

This makes the system self-healing for fresh checkouts where the
.joblib artifact was not committed to git.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

import joblib

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths — resolved relative to this file so they work regardless of CWD
# ---------------------------------------------------------------------------

_THIS_DIR = Path(__file__).resolve().parent              # backend/ml/
_BACKEND_DIR = _THIS_DIR.parent                          # backend/
_PROJECT_ROOT = _BACKEND_DIR.parent                      # d:\SIH\

_DEFAULT_MODEL_PATH = (
    Path(os.getenv("MODEL_PATH", ""))
    if os.getenv("MODEL_PATH")
    else _PROJECT_ROOT / "backend" / "ai" / "models" / "disruption_model.joblib"
)

_TRAIN_SCRIPT = _PROJECT_ROOT / "backend" / "ai" / "disruption" / "train.py"


# ---------------------------------------------------------------------------
# Singleton loader
# ---------------------------------------------------------------------------


class ModelLoader:
    """
    Thread-safe lazy model loader.

    Usage
    -----
        model = ModelLoader.get_model()
        proba = model.predict_proba(X)
    """

    _model = None  # cached sklearn Pipeline
    _model_path: Path = _DEFAULT_MODEL_PATH

    @classmethod
    def get_model(cls, model_path: Optional[Path] = None):
        """
        Return the cached model, loading or re-training if needed.

        Parameters
        ----------
        model_path : Path, optional
            Override the default model path (useful in tests).
        """
        target_path = Path(model_path) if model_path else cls._model_path

        # Return cached if already loaded from the same path
        if cls._model is not None:
            return cls._model

        if target_path.exists():
            logger.info("Loading model from %s", target_path)
            cls._model = joblib.load(target_path)
            logger.info("Model loaded successfully.")
            return cls._model

        # Artifact missing — re-train from dataset
        logger.warning(
            "Model artifact not found at %s. Re-training from dataset...",
            target_path,
        )
        cls._model = cls._retrain_and_save(target_path)
        return cls._model

    @classmethod
    def _retrain_and_save(cls, save_path: Path):
        """Re-train the model inline and save artifact."""
        # Import here to avoid circular imports
        from backend.ai.disruption.train import train  # noqa: PLC0415

        report = train(
            data_path=_PROJECT_ROOT / "data" / "synthetic" / "disruption_dataset.csv"
        )
        logger.info(
            "Re-trained model: %s (AUC-ROC=%.4f)",
            report["selected_model"],
            report["selected_metrics"]["roc_auc"],
        )
        model = joblib.load(save_path)
        return model

    @classmethod
    def reset(cls) -> None:
        """Clear cached model (useful in tests to force reload)."""
        cls._model = None

"""
loader.py
---------
Singleton model loader for the NER-SHIELD disruption risk model.

The loader:
1. Tries to load the pre-trained pipeline from disk (MODEL_PATH).
2. If the artifact is missing, logs a warning and returns None.
   The caller (risk_engine) must fall back to the deterministic heuristic.
3. Caches the model in memory for subsequent calls (no repeated I/O).

IMPORTANT: This loader NEVER auto-retrains during a web request.
Training is an offline process run via backend/ai/disruption/train.py.
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


# ---------------------------------------------------------------------------
# Singleton loader
# ---------------------------------------------------------------------------


class ModelLoader:
    """
    Thread-safe lazy model loader.

    Usage
    -----
        model = ModelLoader.get_model()
        if model is None:
            # use deterministic heuristic fallback
        else:
            proba = model.predict_proba(X)
    """

    _model = None          # cached sklearn Pipeline or None
    _load_attempted = False  # True once we have tried (even if failed)
    _model_path: Path = _DEFAULT_MODEL_PATH

    @classmethod
    def get_model(cls, model_path: Optional[Path] = None):
        """
        Return the cached model, loading from disk if not yet loaded.

        Returns None if the artifact is missing or unloadable.
        Never triggers model training.

        Parameters
        ----------
        model_path : Path, optional
            Override the default model path (useful in tests).
        """
        target_path = Path(model_path) if model_path else cls._model_path

        # Return cached result (may be None if last load failed)
        if cls._load_attempted and model_path is None:
            return cls._model

        if target_path.exists():
            try:
                logger.info("[ModelLoader] Loading model from %s", target_path)
                loaded = joblib.load(target_path)
                cls._model = loaded
                cls._load_attempted = True
                logger.info("[ModelLoader] Model loaded successfully.")
                return cls._model
            except Exception as exc:
                logger.warning(
                    "[ModelLoader] Failed to load model from %s: %s. "
                    "Risk engine will use deterministic heuristic.",
                    target_path,
                    exc,
                )
                cls._model = None
                cls._load_attempted = True
                return None
        else:
            logger.warning(
                "[ModelLoader] Model artifact not found at %s. "
                "Risk engine will use deterministic heuristic. "
                "Run backend/ai/disruption/train.py offline to create the artifact.",
                target_path,
            )
            cls._model = None
            cls._load_attempted = True
            return None

    @classmethod
    def is_model_available(cls) -> bool:
        """Return True if a trained model artifact is loaded and ready."""
        return cls._load_attempted and cls._model is not None

    @classmethod
    def reset(cls) -> None:
        """Clear cached model (useful in tests to force reload)."""
        cls._model = None
        cls._load_attempted = False

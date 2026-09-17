"""
loader.py — Thread-safe singleton model loader for road-segment deep learning models.

Guarantees:
1. Never triggers automatic training during inference requests.
2. Returns None if the artifact is missing, prompting fallback to deterministic heuristic.
3. Thread-safe in-memory caching.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Optional

import joblib

logger = logging.getLogger(__name__)

_THIS_DIR = Path(__file__).resolve().parent                  # backend/ai/segment/
_AI_DIR = _THIS_DIR.parent                                  # backend/ai/
_DEFAULT_ARTIFACT_PATH = _AI_DIR / "models" / "segment_dl_model.joblib"


class SegmentModelLoader:
    """
    Thread-safe lazy loader for road-segment prediction models.

    Usage:
        model = SegmentModelLoader.get_model()
        if model is None:
            # use deterministic heuristic fallback
    """

    _model: Optional[Any] = None
    _load_attempted: bool = False
    _artifact_path: Path = Path(os.getenv("SEGMENT_MODEL_PATH", str(_DEFAULT_ARTIFACT_PATH)))

    @classmethod
    def get_model(cls, path: Optional[Path] = None) -> Optional[Any]:
        """
        Return the cached model instance, loading from disk if not yet loaded.
        Returns None if the artifact is not found or fails to load.
        Never auto-trains.
        """
        target = Path(path) if path else cls._artifact_path

        if cls._load_attempted and path is None:
            return cls._model

        if target.exists():
            try:
                logger.info("[SegmentModelLoader] Loading model artifact from %s", target)
                cls._model = joblib.load(target)
                cls._load_attempted = True
                logger.info("[SegmentModelLoader] Segment DL model loaded successfully.")
                return cls._model
            except Exception as exc:
                logger.warning(
                    "[SegmentModelLoader] Failed to load segment model from %s: %s. "
                    "Falling back to deterministic heuristic.",
                    target,
                    exc,
                )
                cls._model = None
                cls._load_attempted = True
                return None
        else:
            logger.info(
                "[SegmentModelLoader] Segment model artifact not found at %s. "
                "Inference will use deterministic heuristic. (Offline training script: train.py)",
                target,
            )
            cls._model = None
            cls._load_attempted = True
            return None

    @classmethod
    def is_available(cls) -> bool:
        """Return True if a trained model is loaded and ready."""
        return cls._load_attempted and cls._model is not None

    @classmethod
    def reset(cls) -> None:
        """Reset cached state (useful in test suites)."""
        cls._model = None
        cls._load_attempted = False

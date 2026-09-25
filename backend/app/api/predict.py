"""
predict.py
----------
FastAPI router for the AI disruption-risk prediction endpoint.

Endpoint
--------
POST /api/v1/predict/disruption

    Request  body : DisruptionPredictionRequest  (all fields optional)
    Response body : DisruptionPredictionResponse

GET  /api/v1/predict/health
    Sanity check that the model is loaded and can produce a prediction.

Integration
-----------
Mount this router in your main FastAPI application:

    from backend.app.api.predict import router as predict_router
    app.include_router(predict_router, prefix="/api/v1")
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.prediction import (
    DisruptionPredictionRequest,
    DisruptionPredictionResponse,
)
from backend.ai.risk.risk_engine import predict_disruption

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/predict",
    tags=["AI Prediction"],
)


# ---------------------------------------------------------------------------
# POST /predict/disruption
# ---------------------------------------------------------------------------


@router.post(
    "/disruption",
    response_model=DisruptionPredictionResponse,
    summary="Predict logistics route disruption risk",
    description=(
        "Accepts route and environmental feature values and returns a "
        "disruption risk probability, risk level (LOW/MODERATE/HIGH/CRITICAL), "
        "and human-readable risk factor explanations. "
        "All input fields are optional; missing values are filled with neutral defaults."
    ),
    status_code=status.HTTP_200_OK,
)
async def predict_disruption_endpoint(
    body: DisruptionPredictionRequest,
) -> DisruptionPredictionResponse:
    """
    Predict the probability and severity of logistics route disruption.

    Returns a risk assessment including:
    - **risk_probability**: model confidence that disruption will occur (0–1)
    - **risk_level**: LOW | MODERATE | HIGH | CRITICAL
    - **risk_factors**: ordered list of human-readable contributing factors
    - **model_version**: version tag for traceability
    """
    input_data = body.model_dump(exclude_none=False)

    try:
        result = predict_disruption(input_data)
    except (ValueError, TypeError) as exc:
        logger.warning("Invalid prediction input: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        logger.error("Model runtime error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model is currently unavailable. Please try again shortly.",
        ) from exc

    return DisruptionPredictionResponse(**result)


# ---------------------------------------------------------------------------
# GET /predict/health
# ---------------------------------------------------------------------------


@router.get(
    "/health",
    summary="AI prediction system health check",
    status_code=status.HTTP_200_OK,
)
async def prediction_health() -> dict:
    """
    Verify the disruption prediction model is loaded and functional.

    Runs a zero-input prediction (all defaults) and confirms the response
    structure is valid. Returns 200 if the model is healthy.
    """
    try:
        result = predict_disruption({})
        return {
            "status": "ok",
            "model_version": result["model_version"],
            "test_prediction": {
                "risk_level": result["risk_level"],
                "risk_probability": result["risk_probability"],
            },
        }
    except Exception as exc:
        logger.error("Health check failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model health check failed: {exc}",
        ) from exc

"""
prediction.py
-------------
Pydantic v2 request and response schemas for the disruption prediction endpoint.

POST /api/v1/predict/disruption
    Request  : DisruptionPredictionRequest
    Response : DisruptionPredictionResponse
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------


class DisruptionPredictionRequest(BaseModel):
    """
    Input features for route disruption risk prediction.

    All fields are optional — missing values are filled with neutral defaults
    by the risk engine so that partial input is always accepted.
    """

    rainfall_mm: Annotated[
        float | None,
        Field(default=None, ge=0, le=2000, description="Rainfall in millimetres"),
    ] = None

    flood_level: Annotated[
        int | None,
        Field(default=None, ge=0, le=3, description="Flood severity: 0=none 1=minor 2=moderate 3=severe"),
    ] = None

    landslide_indicator: Annotated[
        int | None,
        Field(default=None, ge=0, le=2, description="Landslide status: 0=none 1=warning 2=active"),
    ] = None

    road_condition: Annotated[
        int | None,
        Field(default=None, ge=0, le=3, description="Road condition: 0=good 1=fair 2=poor 3=very poor"),
    ] = None

    traffic_level: Annotated[
        int | None,
        Field(default=None, ge=0, le=4, description="Traffic: 0=free 1=light 2=moderate 3=heavy 4=gridlock"),
    ] = None

    historical_incidents: Annotated[
        int | None,
        Field(default=None, ge=0, le=100, description="Incidents on this route in past 30 days"),
    ] = None

    terrain_risk: Annotated[
        int | None,
        Field(default=None, ge=0, le=2, description="Terrain: 0=flat 1=hilly 2=mountainous"),
    ] = None

    bridge_condition: Annotated[
        int | None,
        Field(default=None, ge=0, le=2, description="Bridge condition: 0=good 1=fair 2=poor"),
    ] = None

    incident_severity: Annotated[
        int | None,
        Field(default=None, ge=0, le=3, description="Current incident severity: 0=none 1=minor 2=major 3=critical"),
    ] = None

    connectivity_score: Annotated[
        float | None,
        Field(default=None, ge=0.0, le=1.0, description="Network connectivity score (1=fully connected, 0=isolated)"),
    ] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "rainfall_mm": 180,
                "flood_level": 2,
                "landslide_indicator": 1,
                "road_condition": 2,
                "traffic_level": 3,
                "historical_incidents": 6,
                "terrain_risk": 2,
                "bridge_condition": 1,
                "incident_severity": 2,
                "connectivity_score": 0.3,
            }
        }
    }


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

RiskLevel = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]


class DisruptionPredictionResponse(BaseModel):
    """Disruption risk prediction result."""

    risk_probability: Annotated[
        float,
        Field(ge=0.0, le=1.0, description="Model probability of disruption [0, 1]"),
    ]

    risk_level: Annotated[
        RiskLevel,
        Field(description="Classified risk level"),
    ]

    risk_factors: Annotated[
        list[str],
        Field(description="Human-readable explanation of top risk contributors"),
    ]

    model_version: Annotated[
        str,
        Field(description="Model version tag"),
    ]

    model_config = {
        "json_schema_extra": {
            "example": {
                "risk_probability": 0.82,
                "risk_level": "HIGH",
                "risk_factors": [
                    "Heavy rainfall (180mm - extreme risk threshold)",
                    "Moderate flood level",
                    "Landslide warning issued",
                    "Poor road condition",
                    "Major incident on route",
                ],
                "model_version": "prototype-v1",
            }
        }
    }

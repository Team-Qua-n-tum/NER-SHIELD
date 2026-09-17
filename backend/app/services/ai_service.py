"""
ai_service.py — AI service facade for NER-SHIELD.

Routes risk and ETA requests through the GIS-aware inference pipeline.
Backward-compatible with the original RiskPredictionRequest/Response contract.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from backend.ai.risk.gis_risk_engine import calculate_risk
from backend.ai.eta.gis_eta_engine import calculate_eta
from backend.app.core.config import settings
from backend.app.schemas.risk import (
    ETADelayBreakdown,
    ETAResponse,
    RiskPredictionRequest,
    RiskPredictionResponse,
    RiskRoadResponse,
)

logger = logging.getLogger(__name__)


class AIService:
    """
    Facade over the GIS-aware risk and ETA inference pipeline.

    Provides:
    - predict_risk()        — backward-compatible legacy endpoint handler
    - predict_risk_for_road() — full GIS-aware per-road assessment
    - predict_eta()         — ETA with delay breakdown
    """

    @staticmethod
    def predict_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
        """
        Legacy risk prediction endpoint (backward-compatible).

        Uses GIS-aware inference when road_id is provided.
        Falls back to heuristic with request fields when no road context.
        """
        from backend.app.services.risk_context_service import assemble_risk_context  # noqa: PLC0415
        from backend.ai.risk.risk_context import RiskFeatureContext  # noqa: PLC0415

        # Try GIS-aware assembly if road_id is present
        if request.road_id:
            ctx = assemble_risk_context(
                road_id=request.road_id,
                district_id=request.district_id,
            )
        else:
            # Build a minimal context from request fields (no GIS needed)
            ctx = RiskFeatureContext(
                road_id=None,
                district_id=request.district_id,
                data_mode="demo" if settings.DEMO_MODE else "live",
                rainfall_mm_24h=request.rainfall_mm,
                weather_condition=request.weather_condition,
                slope_degree=request.slope_degree,
                soil_type=request.soil_type,
                active_incident_count=request.active_incidents_count,
                source_status="demo_synthetic_data" if settings.DEMO_MODE else "live_provider_data",
            )

        result = calculate_risk(ctx)

        # Map to legacy response format, adding new optional fields
        return RiskPredictionResponse(
            risk_probability=result.get("risk_score") or 0.0,
            risk_level=result.get("risk_level", "LOW"),
            risk_factors=result.get("reasons", []),
            confidence_score=result.get("confidence", 0.72),
            recommendation=result.get("recommendation", ""),
            model_version=result.get("model_version", "heuristic-v2"),
            calculated_at=datetime.utcnow(),
            # New enriched fields
            method=result.get("method"),
            data_mode=result.get("data_mode"),
            source_status=result.get("source_status"),
            stale=result.get("stale"),
            input_freshness_seconds=result.get("input_freshness_seconds"),
            data_sources=result.get("data_sources"),
            road_id=result.get("road_id"),
            routing_recommendation=result.get("routing_recommendation"),
            suggested_status=result.get("suggested_status"),
            route_eligible=result.get("route_eligible"),
            risk_penalty=result.get("risk_penalty"),
            affected_by_incident_ids=result.get("affected_by_incident_ids"),
            incident_count=result.get("incident_count"),
            highest_incident_severity=result.get("highest_incident_severity"),
        )

    @staticmethod
    def predict_risk_for_road(
        road_id: str,
        district_id: Optional[str] = None,
        lat: float = 26.1445,
        lon: float = 91.7362,
    ) -> RiskRoadResponse:
        """
        Full GIS-aware risk assessment for a specific road segment.
        Suitable for GET /api/v1/risk/road/{road_id}.
        """
        from backend.app.services.risk_context_service import assemble_risk_context  # noqa: PLC0415

        ctx = assemble_risk_context(road_id=road_id, district_id=district_id, lat=lat, lon=lon)
        result = calculate_risk(ctx)

        return RiskRoadResponse(
            road_id=road_id,
            district_id=district_id,
            risk_score=result.get("risk_score") or 0.0,
            risk_level=result.get("risk_level", "LOW"),
            confidence=result.get("confidence", 0.72),
            reasons=result.get("reasons", []),
            recommendation=result.get("recommendation", ""),
            method=result.get("method", "deterministic_heuristic"),
            model_version=result.get("model_version", "heuristic-v2"),
            calculated_at=result.get("calculated_at", datetime.utcnow().isoformat()),
            input_freshness_seconds=result.get("input_freshness_seconds"),
            data_sources=result.get("data_sources", []),
            stale=result.get("stale", False),
            data_mode=result.get("data_mode", "demo"),
            source_status=result.get("source_status", "demo_synthetic_data"),
            routing_recommendation=result.get("routing_recommendation", "normal"),
            suggested_status=result.get("suggested_status"),
            route_eligible=result.get("route_eligible", True),
            risk_penalty=result.get("risk_penalty", 0.0),
            affected_by_incident_ids=result.get("affected_by_incident_ids", []),
            incident_count=result.get("incident_count", 0),
            highest_incident_severity=result.get("highest_incident_severity"),
        )

    @staticmethod
    def predict_eta(
        road_id: str,
        distance_km: float,
        district_id: Optional[str] = None,
        lat: float = 26.1445,
        lon: float = 91.7362,
    ) -> ETAResponse:
        """
        Compute ETA with delay breakdown for a route segment.
        """
        from backend.app.services.risk_context_service import assemble_risk_context  # noqa: PLC0415

        ctx = assemble_risk_context(road_id=road_id, district_id=district_id, lat=lat, lon=lon)
        risk_result = calculate_risk(ctx)
        risk_score = risk_result.get("risk_score") or 0.0

        eta_result = calculate_eta(ctx=ctx, distance_km=distance_km, risk_score=risk_score)

        breakdown_raw = eta_result.get("delay_breakdown")
        breakdown: Optional[ETADelayBreakdown] = None
        if breakdown_raw:
            try:
                breakdown = ETADelayBreakdown(**breakdown_raw)
            except Exception:
                pass

        return ETAResponse(
            road_id=road_id,
            eta_minutes=eta_result.get("eta_minutes"),
            base_eta_minutes=eta_result.get("base_eta_minutes"),
            delay_minutes=eta_result.get("delay_minutes"),
            delay_breakdown=breakdown,
            method=eta_result.get("method", "deterministic_heuristic"),
            model_version=eta_result.get("model_version", "eta-heuristic-v2"),
            calculated_at=eta_result.get("calculated_at", datetime.utcnow().isoformat()),
            input_freshness_seconds=eta_result.get("input_freshness_seconds"),
            stale=eta_result.get("stale", False),
            data_mode=eta_result.get("data_mode", "demo"),
            source_status=eta_result.get("source_status", "demo_synthetic_data"),
            route_eligible=eta_result.get("route_eligible", True),
            reason=eta_result.get("reason"),
        )

    @staticmethod
    def predict_segment_future(
        road_id: str,
        horizon_minutes: int = 60,
        district_id: Optional[str] = None,
        lat: float = 26.1445,
        lon: float = 91.7362,
        historical_points: Optional[list] = None,
        distance_km: Optional[float] = None,
    ):
        """
        Predict future disruption probability, closure probability, speed, and delay
        over a specified time horizon using deep learning with heuristic fallback.
        """
        from backend.ai.segment.predictor import predict_segment_future, to_routing_edge_cost  # noqa: PLC0415
        from backend.ai.segment.temporal_context import RoadSegmentTemporalContext, SegmentTimePoint  # noqa: PLC0415
        from backend.app.schemas.segment_prediction import (  # noqa: PLC0415
            RoadSegmentPredictionResponse,
            RoutingEdgeImpact,
        )
        from backend.app.services.risk_context_service import assemble_risk_context  # noqa: PLC0415

        ctx = assemble_risk_context(road_id=road_id, district_id=district_id, lat=lat, lon=lon)

        # Convert historical point dicts or schemas to SegmentTimePoint
        history_objs = []
        if historical_points:
            for pt in historical_points:
                if isinstance(pt, SegmentTimePoint):
                    history_objs.append(pt)
                elif hasattr(pt, "model_dump"):
                    history_objs.append(SegmentTimePoint(**pt.model_dump()))
                elif isinstance(pt, dict):
                    history_objs.append(SegmentTimePoint(**pt))

        temporal_ctx = RoadSegmentTemporalContext(
            road_id=road_id,
            district_id=district_id,
            current_context=ctx,
            prediction_horizon_minutes=horizon_minutes,
            historical_points=history_objs,
        )

        pred = predict_segment_future(temporal_ctx)

        edge_impact = None
        if distance_km is not None and distance_km > 0.0:
            edge_calc = to_routing_edge_cost(
                prediction=pred,
                base_distance_km=distance_km,
                speed_limit_kmh=None,
                current_status=ctx.road_status or "OPEN",
            )
            edge_impact = RoutingEdgeImpact(**edge_calc)

        return RoadSegmentPredictionResponse(
            road_id=pred["road_id"],
            predicted_disruption_probability=pred["predicted_disruption_probability"],
            closure_probability=pred["closure_probability"],
            predicted_delay_minutes=pred["predicted_delay_minutes"],
            predicted_speed_kmh=pred["predicted_speed_kmh"],
            eta_multiplier=pred["eta_multiplier"],
            prediction_confidence=pred["prediction_confidence"],
            prediction_horizon_minutes=pred["prediction_horizon_minutes"],
            method=pred["method"],
            model_version=pred["model_version"],
            calculated_at=pred["calculated_at"],
            stale=pred["stale"],
            data_mode=pred["data_mode"],
            routing_edge_impact=edge_impact,
        )


ai_service = AIService()

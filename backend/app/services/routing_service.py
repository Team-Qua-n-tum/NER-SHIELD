"""
Application routing service — selects advanced/simple engines and maps responses.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from backend.app.schemas.route import RouteOption, RouteRequest, RouteResponse
from backend.routing.engine_selector import plan_with_engine_selection

logger = logging.getLogger(__name__)


def _to_route_option(data: Optional[Dict[str, Any]]) -> Optional[RouteOption]:
    if not data:
        return None
    # Drop unknown keys gently — Pydantic v2 ignores extras by default? Use model_validate
    try:
        return RouteOption.model_validate(data)
    except Exception:
        # Minimal legacy fallback
        return RouteOption(
            route_name=data.get("route_name", "Route"),
            waypoints=data.get("waypoints") or [],
            total_distance_km=float(data.get("total_distance_km") or data.get("distance_km") or 0),
            eta_hours=float(data.get("eta_hours") or 0),
            risk_score=float(data.get("risk_score") or 0),
            risk_level=data.get("risk_level") or "LOW",
            reason=data.get("reason") or data.get("reasoning") or "",
            road_ids=list(data.get("road_ids") or []),
        )


class RoutingService:
    @staticmethod
    def recommend_route(request: RouteRequest, *, force_rebuild: bool = False) -> RouteResponse:
        raw = plan_with_engine_selection(
            source_id=request.source_district,
            destination_id=request.destination_district,
            commodity=request.commodity,
            avoid_high_risk=request.constraints.avoid_high_risk,
            vehicle_type=request.constraints.vehicle_type or "TRUCK",
            force_rebuild=force_rebuild,
        )

        # Optional live persistence — never corrupt a valid route result
        persistence_status = raw.get("persistence_status") or "not_persisted"
        status = raw.get("status") or "success"
        if status == "success" and raw.get("recommended_route"):
            persistence_status = RoutingService._maybe_persist(request, raw)

        raw["persistence_status"] = persistence_status

        # Invalid district references from simple engine raise ValueError upstream;
        # advanced returns structured status. Map invalid_* to HTTP via caller.
        if status in ("invalid_origin", "invalid_destination") and not raw.get("source"):
            which = "source" if status == "invalid_origin" else "destination"
            raise ValueError(
                f"Invalid district reference: {which} "
                f"'{request.source_district if which == 'source' else request.destination_district}' not found."
            )

        rec = _to_route_option(raw.get("recommended_route") or raw.get("selected_route"))
        alt = _to_route_option(raw.get("alternate_route"))
        selected = _to_route_option(raw.get("selected_route") or raw.get("recommended_route"))
        routes = [_to_route_option(r) for r in (raw.get("routes") or []) if r]
        alternatives = [_to_route_option(r) for r in (raw.get("alternatives") or []) if r]

        return RouteResponse(
            source=raw.get("source"),
            destination=raw.get("destination"),
            commodity=raw.get("commodity") or request.commodity,
            recommended_route=rec,
            alternate_route=alt,
            is_direct_route_blocked=bool(raw.get("is_direct_route_blocked", False)),
            request_id=raw.get("request_id"),
            status=status,
            message=raw.get("message"),
            reason_code=raw.get("reason_code"),
            selected_route=selected,
            routes=[r for r in routes if r],
            alternatives=[r for r in alternatives if r],
            alternative_status=raw.get("alternative_status"),
            routing_engine=raw.get("routing_engine"),
            routing_engine_version=raw.get("routing_engine_version"),
            fallback_used=raw.get("fallback_used"),
            fallback_reason=raw.get("fallback_reason"),
            graph_status=raw.get("graph_status"),
            origin_snap=raw.get("origin_snap"),
            destination_snap=raw.get("destination_snap"),
            road_state_updated_at=raw.get("road_state_updated_at"),
            risk_calculated_at=raw.get("risk_calculated_at"),
            data_mode=raw.get("data_mode"),
            source_status=raw.get("source_status"),
            stale=raw.get("stale"),
            active_alerts=raw.get("active_alerts") or [],
            generated_at=raw.get("generated_at"),
            persistence_status=persistence_status,
            reasoning=raw.get("reasoning"),
        )

    @staticmethod
    def recalculate_route(request: RouteRequest) -> RouteResponse:
        """Force graph rebuild then plan — used after disruption updates."""
        from backend.routing.graph_builder import invalidate_network_cache

        invalidate_network_cache(reason="recalculate")
        return RoutingService.recommend_route(request, force_rebuild=True)

    @staticmethod
    def _maybe_persist(request: RouteRequest, raw: Dict[str, Any]) -> str:
        try:
            from backend.app.core.config import settings

            if settings.DEMO_MODE:
                return "skipped_demo_mode"
            # Live mode: persist only successful routes; swallow failures
            try:
                from backend.app.db.database import get_session_factory
                from backend.app.models.route import RouteRecord
                import json

                factory = get_session_factory()
                if factory is None:
                    return "skipped_no_session"
                rec = raw.get("recommended_route") or {}
                session = factory()
                try:
                    record = RouteRecord(
                        origin_district_id=request.source_district,
                        destination_district_id=request.destination_district,
                        commodity=request.commodity,
                        vehicle_type=request.constraints.vehicle_type or "TRUCK",
                        total_distance_km=float(rec.get("total_distance_km") or 0),
                        eta_hours=float(rec.get("eta_hours") or 0),
                        risk_score=float(rec.get("risk_score") or 0),
                        risk_level=rec.get("risk_level") or "LOW",
                        road_ids=json.dumps(rec.get("road_ids") or []),
                        reason=rec.get("reason") or raw.get("reasoning"),
                        is_direct_blocked=bool(raw.get("is_direct_route_blocked", False)),
                    )
                    session.add(record)
                    session.commit()
                    return "persisted"
                finally:
                    session.close()
            except Exception as exc:
                logger.warning("Route persistence failed (non-fatal): %s", exc)
                return "persistence_error"
        except Exception:
            return "not_persisted"


routing_service = RoutingService()

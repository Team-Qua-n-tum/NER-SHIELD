"""
Routing engine selector: ROUTING_ENGINE=auto|advanced|simple.

auto     — prefer advanced graph routing; fall back to simple with metadata
advanced — graph-only; structured failure if graph cannot route
simple   — legacy NERRoutingEngine behaviour
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.routing.config import (
    ROUTING_ENGINE_VERSION,
    get_routing_engine_mode,
)
from backend.routing.models import CommodityPriority

logger = logging.getLogger(__name__)

_COMMODITY_MAP = {
    "MEDICINE": CommodityPriority.MEDICINE,
    "MEDICINES": CommodityPriority.MEDICINE,
    "FOOD": CommodityPriority.FOOD,
    "AGRICULTURAL": CommodityPriority.AGRICULTURAL,
    "CONSTRUCTION": CommodityPriority.CONSTRUCTION,
    "GENERAL": CommodityPriority.GENERAL,
}


def _parse_commodity(raw: str) -> CommodityPriority:
    return _COMMODITY_MAP.get((raw or "GENERAL").upper(), CommodityPriority.GENERAL)


def _map_api_risk_level(level: str) -> str:
    mapping = {
        "SEVERE": "CRITICAL",
        "MODERATE": "MEDIUM",
        "CRITICAL": "CRITICAL",
        "HIGH": "HIGH",
        "MEDIUM": "MEDIUM",
        "LOW": "LOW",
        "UNKNOWN": "HIGH",
    }
    return mapping.get((level or "LOW").upper(), "LOW")


def _active_alerts_for_roads(road_ids: List[str]) -> List[Dict[str, Any]]:
    try:
        from backend.app.db.store import db_store
    except Exception:
        return []

    alerts: List[Dict[str, Any]] = []
    road_set = set(road_ids)
    for alert in db_store.alerts.values():
        a = alert.model_dump() if hasattr(alert, "model_dump") else dict(alert)
        # Prefer road-linked incidents without exposing tokens/secrets
        rid = a.get("road_id")
        if rid and rid in road_set:
            alerts.append(
                {
                    "id": a.get("id"),
                    "title": a.get("title") or a.get("message"),
                    "severity": a.get("severity") or a.get("level"),
                    "road_id": rid,
                    "status": a.get("status"),
                }
            )
    for inc in db_store.incidents.values():
        i = inc.model_dump() if hasattr(inc, "model_dump") else dict(inc)
        rid = i.get("road_id")
        if rid and rid in road_set and i.get("status") == "ACTIVE":
            alerts.append(
                {
                    "id": i.get("id"),
                    "title": i.get("title"),
                    "severity": i.get("severity"),
                    "road_id": rid,
                    "incident_type": i.get("incident_type"),
                    "status": i.get("status"),
                }
            )
    # Deduplicate by id
    seen = set()
    unique = []
    for a in alerts:
        aid = a.get("id")
        if aid in seen:
            continue
        seen.add(aid)
        unique.append(a)
    return unique


def _geometry_from_edges(edges, network, path_nodes: List[str]) -> Dict[str, Any]:
    coords: List[List[float]] = []
    for e in edges:
        geom = e.geometry
        if geom and isinstance(geom.get("coordinates"), list):
            pts = geom["coordinates"]
            if coords and pts and coords[-1] == pts[0]:
                coords.extend(pts[1:])
            else:
                coords.extend(pts)
    if len(coords) < 2:
        # Fallback from node positions
        for nid in path_nodes:
            node = network.get_node(nid)
            if node:
                coords.append([node.lon, node.lat])
    if len(coords) < 2 and coords:
        coords = coords + coords  # zero-distance same point
    return {"type": "LineString", "coordinates": coords}


def _delay_breakdown_from_route(route, eta_details: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    pred_delay = sum(
        (e.predicted_delay_minutes or 0.0) for e in route.path_edges
    )
    base_min = route.base_travel_time_hrs * 60.0
    eta_min = route.eta_hrs * 60.0
    breakdown = {
        "base_eta_minutes": round(base_min, 1),
        "surface_delay_minutes": round((eta_details or {}).get("surface_delay_hrs", 0) * 60.0, 1),
        "traffic_delay_minutes": round((eta_details or {}).get("traffic_delay_hrs", 0) * 60.0, 1),
        "disruption_risk_buffer_minutes": round(
            (eta_details or {}).get("disruption_risk_buffer_hrs", 0) * 60.0, 1
        ),
        "predicted_delay_minutes": round(pred_delay, 1),
        "total_delay_minutes": round(max(0.0, eta_min - base_min), 1),
    }
    return breakdown


def _route_option_from_result(
    route,
    network,
    *,
    route_name: str,
    reason: str,
    selected: bool,
    rank: int,
    data_mode: str,
    source_status: str,
    stale: bool,
    eta_details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    road_ids = []
    edge_ids = []
    for e in route.path_edges:
        eid = e.id[:-4] if e.id.endswith("_rev") else e.id
        rid = e.road_id or eid
        edge_ids.append(eid)
        if rid not in road_ids:
            road_ids.append(rid)

    waypoints = []
    for nid in route.path_nodes:
        node = network.get_node(nid)
        if not node:
            continue
        waypoints.append(
            {
                "district_id": node.id,
                "district_name": node.name,
                "lat": node.lat,
                "lng": node.lon,
            }
        )

    geometry = _geometry_from_edges(route.path_edges, network, route.path_nodes)
    risk_penalties = [e.risk_penalty for e in route.path_edges if e.risk_penalty is not None]
    risk_penalty = max(risk_penalties) if risk_penalties else round(route.average_risk * 0.85, 3)
    route_eligible = all(e.route_eligible is not False for e in route.path_edges)
    delay_breakdown = _delay_breakdown_from_route(route, eta_details)
    alerts = _active_alerts_for_roads(road_ids)

    eta_hours = round(route.eta_hrs, 2)
    eta_minutes = round(route.eta_hrs * 60.0, 1)
    base_eta_minutes = round(route.base_travel_time_hrs * 60.0, 1)

    summary = (
        f"{route_name}: {route.total_distance_km:.1f} km, "
        f"ETA {eta_hours:.1f}h, risk {route.risk_level}"
    )

    return {
        "route_id": f"route-{rank}-{'-'.join(road_ids[:3]) or 'empty'}",
        "route_name": route_name,
        "waypoints": waypoints,
        "geometry": geometry,
        "road_ids": road_ids,
        "edge_ids": edge_ids,
        "total_distance_km": round(route.total_distance_km, 2),
        "distance_km": round(route.total_distance_km, 2),
        "eta_hours": eta_hours,
        "base_eta_minutes": base_eta_minutes,
        "eta_minutes": eta_minutes,
        "delay_minutes": delay_breakdown["total_delay_minutes"],
        "delay_breakdown": delay_breakdown,
        "risk_score": round(route.average_risk, 3),
        "risk_level": _map_api_risk_level(route.risk_level),
        "risk_penalty": risk_penalty,
        "route_eligible": route_eligible,
        "route_rank": rank,
        "selected_route": selected,
        "summary": summary,
        "reason": reason,
        "reasoning": reason,
        "active_alerts": alerts,
        "data_mode": data_mode,
        "source_status": source_status,
        "stale": stale,
    }


def _provenance(network=None, data_mode: Optional[str] = None) -> Dict[str, Any]:
    try:
        from backend.app.core.config import settings
        demo = settings.DEMO_MODE
    except Exception:
        demo = True
    mode = data_mode or ("demo" if demo else "live")
    return {
        "data_mode": mode,
        "source_status": (
            getattr(network, "source_status", None)
            or ("demo_synthetic_data" if mode == "demo" else "operational_store")
        ),
        "stale": bool(getattr(network, "stale", False)) if network else False,
        "road_state_updated_at": getattr(network, "road_state_updated_at", None),
        "risk_calculated_at": getattr(network, "risk_calculated_at", None),
        "graph_status": getattr(network, "graph_status", "unavailable"),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def _run_advanced(
    source_id: str,
    destination_id: str,
    commodity: str,
    avoid_high_risk: bool,
    vehicle_type: str,
    *,
    force_rebuild: bool = False,
) -> Dict[str, Any]:
    from backend.routing.graph_builder import get_or_build_network
    from backend.routing.models import RouteRequest
    from backend.routing.service import RoutingService
    from backend.routing.snap import resolve_endpoint

    network = get_or_build_network(force_rebuild=force_rebuild, enrich_ai=True)
    prov = _provenance(network)

    if network.graph_status not in ("ready", "invalidated") or not network.edges:
        return {
            "status": "graph_unavailable",
            "message": "Advanced routing graph is unavailable.",
            "reason_code": "graph_unavailable",
            "selected_route": None,
            "recommended_route": None,
            "alternate_route": None,
            "routes": [],
            "alternatives": [],
            "alternative_status": "graph_unavailable",
            **prov,
            "error": "graph_unavailable",
        }

    origin_snap = resolve_endpoint(network, district_id=source_id)
    dest_snap = resolve_endpoint(network, district_id=destination_id)

    if origin_snap.get("status") != "ok":
        return {
            "status": "invalid_origin",
            "message": origin_snap.get("message") or "Invalid origin.",
            "reason_code": "invalid_origin",
            "selected_route": None,
            "recommended_route": None,
            "alternate_route": None,
            "routes": [],
            "alternatives": [],
            "origin_snap": origin_snap,
            "destination_snap": dest_snap,
            **prov,
            "error": "invalid_origin",
        }

    if dest_snap.get("status") != "ok":
        return {
            "status": "invalid_destination",
            "message": dest_snap.get("message") or "Invalid destination.",
            "reason_code": "invalid_destination",
            "selected_route": None,
            "recommended_route": None,
            "alternate_route": None,
            "routes": [],
            "alternatives": [],
            "origin_snap": origin_snap,
            "destination_snap": dest_snap,
            **prov,
            "error": "invalid_destination",
        }

    svc = RoutingService(network=network)
    req = RouteRequest(
        source_id=origin_snap["node_id"],
        destination_id=dest_snap["node_id"],
        commodity=_parse_commodity(commodity),
        max_risk_tolerance=0.5 if avoid_high_risk else 1.0,
    )
    response = svc.plan_route(req)

    if response.recommended is None:
        reason_code = "all_connecting_roads_blocked"
        return {
            "status": "no_route",
            "message": "No safe route is currently available.",
            "reason_code": reason_code,
            "selected_route": None,
            "recommended_route": None,
            "alternate_route": None,
            "routes": [],
            "alternatives": [],
            "alternative_status": "no_route",
            "active_alerts": _active_alerts_for_roads(
                [e.road_id or e.id for e in network.edges.values() if not e.id.endswith("_rev")]
            ),
            "origin_snap": origin_snap,
            "destination_snap": dest_snap,
            "source": network.nodes[origin_snap["node_id"]].name,
            "destination": network.nodes[dest_snap["node_id"]].name,
            "commodity": commodity,
            "is_direct_route_blocked": True,
            "reasoning": response.reason,
            **prov,
        }

    # ETA details already applied on route by service
    selected = _route_option_from_result(
        response.recommended,
        network,
        route_name=f"Primary Corridor ({source_id} -> {destination_id})",
        reason=response.reason,
        selected=True,
        rank=1,
        data_mode=prov["data_mode"],
        source_status=prov["source_status"],
        stale=prov["stale"],
    )

    alternates_raw = getattr(response, "_alternates", None) or (
        [response.alternate] if response.alternate else []
    )
    alternatives = []
    for i, alt in enumerate(alternates_raw, start=2):
        if alt is None:
            continue
        alternatives.append(
            _route_option_from_result(
                alt,
                network,
                route_name=f"Alternate Corridor #{i - 1}",
                reason=(
                    f"This option adds {(alt.eta_hrs - response.recommended.eta_hrs) * 60:.0f} minutes "
                    f"but offers a distinct road sequence "
                    f"(risk {alt.risk_level})."
                ),
                selected=False,
                rank=i,
                data_mode=prov["data_mode"],
                source_status=prov["source_status"],
                stale=prov["stale"],
            )
        )

    # Filter any alternate that shares identical road sequence (belt-and-suspenders)
    alternatives = [
        a for a in alternatives if a["road_ids"] != selected["road_ids"]
    ]

    if alternatives:
        alt_status = "ok"
    else:
        alt_status = "no_distinct_safe_alternative"

    # Direct-road blocked flag
    direct_blocked = False
    for e in network.edges.values():
        if e.id.endswith("_rev"):
            continue
        endpoints = {e.source, e.target}
        if endpoints == {origin_snap["node_id"], dest_snap["node_id"]}:
            if e.traversable is False or e.status.value == "BLOCKED":
                direct_blocked = True

    routes = [selected] + alternatives
    return {
        "status": "success",
        "message": "Route planned successfully.",
        "reason_code": None,
        "source": network.nodes[origin_snap["node_id"]].name,
        "destination": network.nodes[dest_snap["node_id"]].name,
        "commodity": commodity,
        "recommended_route": selected,
        "alternate_route": alternatives[0] if alternatives else None,
        "selected_route": selected,
        "routes": routes,
        "alternatives": alternatives,
        "alternative_status": alt_status,
        "is_direct_route_blocked": direct_blocked,
        "origin_snap": {
            "origin_snapped": origin_snap.get("snapped"),
            "origin_snap_distance_meters": origin_snap.get("snap_distance_meters"),
            "origin_node_id": origin_snap.get("node_id"),
            **origin_snap,
        },
        "destination_snap": {
            "destination_snapped": dest_snap.get("snapped"),
            "destination_snap_distance_meters": dest_snap.get("snap_distance_meters"),
            "destination_node_id": dest_snap.get("node_id"),
            **dest_snap,
        },
        "active_alerts": selected.get("active_alerts") or [],
        "reasoning": response.reason,
        **prov,
    }


def _run_simple(
    source_id: str,
    destination_id: str,
    commodity: str,
    avoid_high_risk: bool,
    vehicle_type: str,
) -> Dict[str, Any]:
    from backend.routing.engine import routing_engine

    raw = routing_engine.find_route(
        source_id=source_id,
        destination_id=destination_id,
        commodity=commodity,
        avoid_high_risk=avoid_high_risk,
        vehicle_type=vehicle_type,
    )
    prov = _provenance()
    rec = raw.get("recommended_route") or {}
    # Enrich legacy option lightly
    if rec and "geometry" not in rec:
        coords = []
        for wp in rec.get("waypoints") or []:
            coords.append([wp["lng"], wp["lat"]])
        if len(coords) >= 2:
            rec["geometry"] = {"type": "LineString", "coordinates": coords}
        rec.setdefault("route_id", "route-simple-primary")
        rec.setdefault("edge_ids", list(rec.get("road_ids") or []))
        rec.setdefault("distance_km", rec.get("total_distance_km"))
        rec.setdefault("eta_minutes", round((rec.get("eta_hours") or 0) * 60, 1))
        rec.setdefault("base_eta_minutes", rec.get("eta_minutes"))
        rec.setdefault("delay_minutes", 0.0)
        rec.setdefault("delay_breakdown", {})
        rec.setdefault("risk_penalty", round((rec.get("risk_score") or 0) * 0.85, 3))
        rec.setdefault("route_eligible", True)
        rec.setdefault("route_rank", 1)
        rec.setdefault("selected_route", True)
        rec.setdefault("summary", rec.get("reason"))
        rec.setdefault("reasoning", rec.get("reason"))
        rec.setdefault("active_alerts", [])
        rec.setdefault("data_mode", prov["data_mode"])
        rec.setdefault("source_status", prov["source_status"])
        rec.setdefault("stale", prov["stale"])

    alt = raw.get("alternate_route")
    alternatives = []
    if alt:
        alt.setdefault("route_id", "route-simple-alt")
        alt.setdefault("selected_route", False)
        alt.setdefault("route_rank", 2)
        alternatives = [alt]

    return {
        "status": "success",
        "message": "Route planned with simple heuristic engine.",
        "reason_code": None,
        "source": raw.get("source"),
        "destination": raw.get("destination"),
        "commodity": raw.get("commodity", commodity),
        "recommended_route": rec,
        "alternate_route": alt,
        "selected_route": rec,
        "routes": [rec] + alternatives if rec else [],
        "alternatives": alternatives,
        "alternative_status": "ok" if alternatives else "no_distinct_safe_alternative",
        "is_direct_route_blocked": raw.get("is_direct_route_blocked", False),
        "active_alerts": [],
        **prov,
        "graph_status": "unused",
    }


def plan_with_engine_selection(
    source_id: str,
    destination_id: str,
    commodity: str = "MEDICINES",
    avoid_high_risk: bool = True,
    vehicle_type: str = "TRUCK",
    *,
    engine_mode: Optional[str] = None,
    force_rebuild: bool = False,
) -> Dict[str, Any]:
    """
    Public selector entry used by app RoutingService.
    """
    mode = (engine_mode or get_routing_engine_mode()).lower()
    request_id = str(uuid.uuid4())

    def _finalize(payload: Dict[str, Any], *, engine: str, fallback_used: bool, fallback_reason: Optional[str]) -> Dict[str, Any]:
        payload = dict(payload)
        payload["request_id"] = request_id
        payload["routing_engine"] = engine
        payload["routing_engine_version"] = ROUTING_ENGINE_VERSION
        payload["fallback_used"] = fallback_used
        payload["fallback_reason"] = fallback_reason
        payload.setdefault("persistence_status", "not_persisted")
        payload.setdefault("generated_at", datetime.now(timezone.utc).isoformat())
        return payload

    if mode == "simple":
        return _finalize(
            _run_simple(source_id, destination_id, commodity, avoid_high_risk, vehicle_type),
            engine="simple",
            fallback_used=False,
            fallback_reason=None,
        )

    if mode == "advanced":
        result = _run_advanced(
            source_id, destination_id, commodity, avoid_high_risk, vehicle_type,
            force_rebuild=force_rebuild,
        )
        # Do not silently fall back
        if result.get("error") == "graph_unavailable":
            return _finalize(result, engine="advanced", fallback_used=False, fallback_reason=None)
        return _finalize(result, engine="advanced", fallback_used=False, fallback_reason=None)

    # auto
    try:
        result = _run_advanced(
            source_id, destination_id, commodity, avoid_high_risk, vehicle_type,
            force_rebuild=force_rebuild,
        )
        if result.get("error") == "graph_unavailable":
            simple = _run_simple(source_id, destination_id, commodity, avoid_high_risk, vehicle_type)
            return _finalize(
                simple,
                engine="simple",
                fallback_used=True,
                fallback_reason="advanced_graph_unavailable",
            )
        # invalid origin/destination / no_route are valid advanced outcomes — do not fall back
        return _finalize(result, engine="advanced", fallback_used=False, fallback_reason=None)
    except Exception as exc:
        logger.warning("Advanced routing failed; falling back to simple: %s", exc)
        simple = _run_simple(source_id, destination_id, commodity, avoid_high_risk, vehicle_type)
        return _finalize(
            simple,
            engine="simple",
            fallback_used=True,
            fallback_reason=f"advanced_exception:{type(exc).__name__}",
        )

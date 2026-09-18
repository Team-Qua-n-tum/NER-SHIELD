"""
Build a RoadNetwork from operational store data enriched with GIS/AI outputs.

Does not recalculate nearest-road geometry, hazard buffers, or risk models —
those are consumed via existing AIService / GIS field contracts.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from backend.routing.config import DEFAULT_SAFETY_POLICY
from backend.routing.eligibility import apply_eligibility_to_edge
from backend.routing.graph import RoadNetwork
from backend.routing.models import Edge, Node, RoadCondition, RoadStatus

logger = logging.getLogger(__name__)

_STATUS_MAP = {
    "OPEN": RoadStatus.OPEN,
    "DISRUPTED": RoadStatus.RESTRICTED,
    "RESTRICTED": RoadStatus.RESTRICTED,
    "HIGH_RISK_WARNING": RoadStatus.HIGH_RISK_WARNING,
    "BLOCKED": RoadStatus.BLOCKED,
    "CLOSED": RoadStatus.BLOCKED,
}


def _map_status(raw: Optional[str]) -> RoadStatus:
    if not raw:
        return RoadStatus.OPEN
    return _STATUS_MAP.get(str(raw).upper(), RoadStatus.OPEN)


def _road_as_dict(road: Any) -> Dict[str, Any]:
    if hasattr(road, "model_dump"):
        return road.model_dump()
    if isinstance(road, dict):
        return road
    return dict(getattr(road, "__dict__", {}))


def _district_as_dict(district: Any) -> Dict[str, Any]:
    if hasattr(district, "model_dump"):
        return district.model_dump()
    if isinstance(district, dict):
        return district
    return dict(getattr(district, "__dict__", {}))


def _path_to_geojson(path_coordinates: Any) -> Optional[Dict[str, Any]]:
    """Convert [{lat,lng}, ...] to GeoJSON LineString [lon, lat]."""
    if not path_coordinates or not isinstance(path_coordinates, list):
        return None
    points: List[Any] = []
    for pt in path_coordinates:
        if isinstance(pt, dict):
            lat = pt.get("lat")
            lng = pt.get("lng", pt.get("lon"))
            if lat is None or lng is None:
                continue
            points.append({"lat": float(lat), "lng": float(lng)})
        elif hasattr(pt, "lat"):
            points.append({"lat": float(pt.lat), "lng": float(getattr(pt, "lng", getattr(pt, "lon", 0.0)))})
    if len(points) < 2:
        return None
    try:
        from backend.geospatial.geojson_utils import path_to_geojson_linestring, validate_geojson

        geom = path_to_geojson_linestring(points)
        if validate_geojson(geom):
            return geom
    except Exception as exc:
        logger.debug("geometry conversion failed: %s", exc)
        coords = [[p["lng"], p["lat"]] for p in points]
        return {"type": "LineString", "coordinates": coords}
    return None


def _enrich_edge_from_ai(edge: Edge, road_id: str, district_id: Optional[str], lat: float, lon: float) -> None:
    """Reuse AI risk / ETA / future prediction without rebuilding models."""
    try:
        from backend.app.services.ai_service import AIService
        from backend.ai.segment.predictor import to_routing_edge_cost
    except Exception as exc:
        logger.debug("AI services unavailable for edge enrichment: %s", exc)
        return

    try:
        risk = AIService.predict_risk_for_road(
            road_id=road_id, district_id=district_id, lat=lat, lon=lon
        )
        risk_data = risk.model_dump() if hasattr(risk, "model_dump") else dict(risk)
        edge.risk_score = risk_data.get("risk_score", edge.risk_score)
        edge.risk_level = risk_data.get("risk_level", edge.risk_level)
        edge.risk_penalty = risk_data.get("risk_penalty")
        edge.route_eligible = risk_data.get("route_eligible")
        edge.routing_recommendation = risk_data.get("routing_recommendation")
        edge.suggested_status = risk_data.get("suggested_status") or edge.suggested_status
        edge.incident_ids = list(risk_data.get("affected_by_incident_ids") or [])
        edge.stale = bool(risk_data.get("stale", False))
        edge.data_mode = risk_data.get("data_mode")
        edge.source = risk_data.get("source_status") or edge.source
        edge.freshness_seconds = risk_data.get("input_freshness_seconds")
        if edge.risk_score is not None:
            edge.disruption_risk = float(edge.risk_score)

        # GIS suggested_risk_penalty is already preferred inside AI risk_penalty
        # when present; mark supplement only if AI omitted and GIS had a value.
        # Assembler puts suggested_risk_penalty into risk_penalty — avoid double count.
        edge.gis_penalty_applied = False
        if edge.risk_penalty is None and risk_data.get("suggested_status"):
            edge.gis_penalty_applied = True
    except Exception as exc:
        logger.debug("risk enrichment failed for %s: %s", road_id, exc)

    try:
        future = AIService.predict_segment_future(
            road_id=road_id,
            horizon_minutes=120,
            district_id=district_id,
            lat=lat,
            lon=lon,
            distance_km=edge.distance_km,
        )
        fut = future.model_dump() if hasattr(future, "model_dump") else dict(future)
        edge.closure_probability = fut.get("closure_probability")
        edge.predicted_delay_minutes = fut.get("predicted_delay_minutes")
        edge.predicted_speed_kmh = fut.get("predicted_speed_kmh")
        edge.eta_multiplier = fut.get("eta_multiplier")
        edge.prediction_confidence = fut.get("prediction_confidence")
        edge.prediction_horizon_minutes = fut.get("prediction_horizon_minutes")
        edge.stale = edge.stale or bool(fut.get("stale", False))

        impact = fut.get("routing_edge_impact")
        if impact:
            if hasattr(impact, "model_dump"):
                impact = impact.model_dump()
            edge.edge_cost_multiplier = impact.get("edge_cost_multiplier")
            if impact.get("suggested_status"):
                # Prefer stronger status
                sug = str(impact["suggested_status"]).lower()
                cur = (edge.suggested_status or "").lower()
                if sug == "blocked" or cur != "blocked":
                    edge.suggested_status = impact["suggested_status"]
            if impact.get("traversable") is False:
                edge.traversable = False
            if impact.get("disruption_risk") is not None:
                edge.disruption_risk = max(edge.disruption_risk, float(impact["disruption_risk"]))
        else:
            bridge = to_routing_edge_cost(
                prediction=fut,
                base_distance_km=edge.distance_km,
                speed_limit_kmh=edge.speed_limit_kmh,
                current_status=edge.road_status or edge.status.value,
            )
            edge.edge_cost_multiplier = bridge.get("edge_cost_multiplier")
            if bridge.get("traversable") is False:
                edge.traversable = False
            if bridge.get("suggested_status"):
                edge.suggested_status = bridge["suggested_status"]
    except Exception as exc:
        logger.debug("future prediction enrichment failed for %s: %s", road_id, exc)

    apply_eligibility_to_edge(edge, DEFAULT_SAFETY_POLICY)


def build_network_from_store(
    *,
    enrich_ai: bool = True,
    districts: Optional[Dict[str, Any]] = None,
    roads: Optional[Dict[str, Any]] = None,
) -> RoadNetwork:
    """
    Construct a deterministic RoadNetwork from demo/live operational collections.
    """
    from backend.app.core.config import settings
    from backend.app.db.store import db_store

    districts = districts if districts is not None else db_store.districts
    roads = roads if roads is not None else db_store.roads

    network = RoadNetwork()
    network.data_mode = "demo" if settings.DEMO_MODE else "live"
    network.source_status = "demo_synthetic_data" if settings.DEMO_MODE else "operational_store"
    network.stale = False
    now = datetime.now(timezone.utc).isoformat()
    network.road_state_updated_at = now
    network.risk_calculated_at = now

    # Nodes from districts
    for did, dist in sorted(districts.items(), key=lambda x: x[0]):
        d = _district_as_dict(dist)
        coords = d.get("coordinates") or {}
        if hasattr(coords, "lat"):
            lat, lon = float(coords.lat), float(coords.lng)
        else:
            lat = float(coords.get("lat", 0.0))
            lon = float(coords.get("lng", coords.get("lon", 0.0)))
        network.add_node(
            Node(
                id=did,
                name=d.get("name", did),
                lat=lat,
                lon=lon,
                district=d.get("name", did),
                state=d.get("state", "NER"),
            )
        )

    # Edges from roads (deterministic order)
    for rid, road in sorted(roads.items(), key=lambda x: x[0]):
        r = _road_as_dict(road)
        src = r.get("start_district")
        tgt = r.get("end_district")
        if not src or not tgt or src not in network.nodes or tgt not in network.nodes:
            network.diagnostics.append(
                {"type": "skip_edge", "edge_id": rid, "reason": "missing_district_endpoints"}
            )
            continue

        geom = _path_to_geojson(r.get("path_coordinates"))
        status = _map_status(r.get("status"))
        length_km = float(r.get("length_km") or 1.0)
        risk = float(r.get("risk_score") or 0.0)

        edge = Edge(
            id=rid,
            source=src,
            target=tgt,
            distance_km=length_km,
            speed_limit_kmh=40.0,
            disruption_risk=risk,
            status=status,
            road_condition=RoadCondition.GOOD,
            name=r.get("name") or r.get("code") or rid,
            is_bidirectional=True,
            road_id=rid,
            road_class=r.get("code"),
            geometry=geom,
            length_meters=length_km * 1000.0,
            road_status=str(r.get("status") or "OPEN").upper(),
            risk_score=risk,
            risk_level=r.get("risk_level"),
            data_mode=network.data_mode,
            source=network.source_status,
        )

        if enrich_ai:
            src_node = network.nodes[src]
            _enrich_edge_from_ai(edge, rid, src, src_node.lat, src_node.lon)

        network.add_edge(edge)

    network.graph_status = "ready" if network.edges else "empty"
    network.state_revision = 1
    return network


# Module-level cache keyed by state fingerprint
_NETWORK_CACHE: Dict[str, Any] = {
    "network": None,
    "fingerprint": None,
}


def _state_fingerprint(roads: Dict[str, Any], incidents: Optional[Dict[str, Any]] = None) -> str:
    parts: List[str] = []
    for rid, road in sorted(roads.items(), key=lambda x: x[0]):
        r = _road_as_dict(road)
        parts.append(f"{rid}:{r.get('status')}:{r.get('risk_score')}:{r.get('last_checked')}")
    if incidents:
        for iid, inc in sorted(incidents.items(), key=lambda x: x[0]):
            i = inc.model_dump() if hasattr(inc, "model_dump") else (inc if isinstance(inc, dict) else {})
            parts.append(f"inc:{iid}:{i.get('status')}:{i.get('road_id')}:{i.get('severity')}")
    return "|".join(parts)


def get_or_build_network(*, force_rebuild: bool = False, enrich_ai: bool = True) -> RoadNetwork:
    """Return cached network, rebuilding when road/incident state changes."""
    from backend.app.db.store import db_store

    fp = _state_fingerprint(db_store.roads, db_store.incidents)
    cached = _NETWORK_CACHE.get("network")
    if (
        not force_rebuild
        and cached is not None
        and _NETWORK_CACHE.get("fingerprint") == fp
        and cached.graph_status == "ready"
    ):
        return cached

    network = build_network_from_store(enrich_ai=enrich_ai)
    _NETWORK_CACHE["network"] = network
    _NETWORK_CACHE["fingerprint"] = fp
    return network


def invalidate_network_cache(reason: str = "manual_invalidate") -> None:
    """Deterministic test-friendly invalidation of the graph cache."""
    cached = _NETWORK_CACHE.get("network")
    if cached is not None:
        cached.invalidate(reason)
    _NETWORK_CACHE["network"] = None
    _NETWORK_CACHE["fingerprint"] = None


def simulate_road_closure(
    road_id: str,
    *,
    status: str = "BLOCKED",
    severity: str = "CRITICAL",
    title: str = "Critical landslide closure",
    incident_type: str = "LANDSLIDE",
) -> Dict[str, Any]:
    """
    Deterministic demo disruption helper: update store road + incident, invalidate graph.
    Reuses GIS-facing road_id / status fields already present on the road record.
    """
    from backend.app.db.store import db_store
    from backend.app.schemas.incident import IncidentResponse

    road = db_store.roads.get(road_id)
    if not road:
        raise ValueError(f"Unknown road_id: {road_id}")

    # Mutate road status in place (Pydantic model)
    updated = road.model_copy(
        update={
            "status": status,
            "risk_score": 0.95,
            "risk_level": "CRITICAL",
            "disruption_cause": title,
            "last_checked": datetime.utcnow().isoformat(),
        }
    )
    db_store.roads[road_id] = updated

    path = road.path_coordinates or []
    mid = path[len(path) // 2] if path else None
    lat = float(mid.lat) if mid and hasattr(mid, "lat") else 26.5
    lng = float(mid.lng) if mid and hasattr(mid, "lng") else 92.5

    inc_id = f"inc-showcase-{road_id}"
    incident = IncidentResponse(
        id=inc_id,
        title=title,
        incident_type=incident_type,
        severity=severity,
        district_id=road.start_district,
        road_id=road_id,
        lat=lat,
        lng=lng,
        description=f"Showcase disruption on {road_id}: {title}",
        reported_by="NER-SHIELD Routing Showcase",
        photo_url=None,
        status="ACTIVE",
        reported_at=datetime.utcnow(),
    )
    db_store.incidents[inc_id] = incident
    invalidate_network_cache(reason=f"closure:{road_id}")

    return {
        "road_id": road_id,
        "status": status,
        "incident_id": inc_id,
        "affected_road_ids": [road_id],
    }

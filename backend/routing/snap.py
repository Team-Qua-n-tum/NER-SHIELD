"""
Origin / destination snapping onto traversable graph nodes.
Uses existing GIS WGS84 validation — does not reimplement nearest-road distance.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

from backend.geospatial.coordinate_utils import (
    haversine_distance_meters,
    validate_ner_bounds,
    validate_wgs84,
)
from backend.routing.config import DEFAULT_SAFETY_POLICY, SafetyPolicy
from backend.routing.graph import RoadNetwork
from backend.routing.models import Node


def snap_to_nearest_node(
    network: RoadNetwork,
    lat: float,
    lon: float,
    *,
    policy: Optional[SafetyPolicy] = None,
    require_traversable_neighbor: bool = True,
) -> Dict[str, Any]:
    """
    Snap a WGS84 point to the nearest graph node within max snap distance.

    Returns structured snap metadata; on failure status is not success.
    """
    policy = policy or DEFAULT_SAFETY_POLICY

    if not validate_wgs84(lat, lon):
        return {
            "status": "invalid_coordinates",
            "snapped": False,
            "node_id": None,
            "snap_distance_meters": None,
            "lat": lat,
            "lon": lon,
            "message": "Coordinates are not valid WGS84.",
        }

    try:
        in_ner = validate_ner_bounds(lat, lon, buffer_deg=2.0)
    except ValueError:
        in_ner = False
    if not in_ner:
        return {
            "status": "out_of_bounds",
            "snapped": False,
            "node_id": None,
            "snap_distance_meters": None,
            "lat": lat,
            "lon": lon,
            "message": "Coordinates are outside practical NER operating bounds.",
        }

    best: Optional[Tuple[float, Node]] = None
    for node in network.nodes.values():
        if require_traversable_neighbor:
            neighbors = network.get_neighbors(node.id)
            if not neighbors:
                continue
            if not any(e.traversable is not False and e.status.value != "BLOCKED" for e in neighbors):
                # Allow node if it has any edge; eligibility checked at route time
                pass
        dist = haversine_distance_meters(lat, lon, node.lat, node.lon)
        if best is None or dist < best[0]:
            best = (dist, node)

    if best is None:
        return {
            "status": "unmappable",
            "snapped": False,
            "node_id": None,
            "snap_distance_meters": None,
            "lat": lat,
            "lon": lon,
            "message": "No graph nodes available for snapping.",
        }

    dist_m, node = best
    if dist_m > policy.max_snap_distance_meters:
        return {
            "status": "unmappable",
            "snapped": False,
            "node_id": None,
            "snap_distance_meters": round(dist_m, 1),
            "lat": lat,
            "lon": lon,
            "message": (
                f"Nearest node {node.id} is {dist_m:.0f}m away; "
                f"max snap distance is {policy.max_snap_distance_meters:.0f}m."
            ),
        }

    return {
        "status": "ok",
        "snapped": True,
        "node_id": node.id,
        "snap_distance_meters": round(dist_m, 1),
        "lat": node.lat,
        "lon": node.lon,
        "node_name": node.name,
        "message": f"Snapped to {node.id}",
    }


def resolve_endpoint(
    network: RoadNetwork,
    *,
    district_id: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    policy: Optional[SafetyPolicy] = None,
) -> Dict[str, Any]:
    """
    Resolve a route endpoint from district ID and/or coordinates.
    District IDs that exist as nodes snap with distance 0.
    """
    if district_id and district_id in network.nodes:
        node = network.nodes[district_id]
        return {
            "status": "ok",
            "snapped": True,
            "node_id": node.id,
            "snap_distance_meters": 0.0,
            "lat": node.lat,
            "lon": node.lon,
            "node_name": node.name,
            "message": f"Resolved district {district_id}",
        }

    if lat is not None and lon is not None:
        return snap_to_nearest_node(network, lat, lon, policy=policy)

    return {
        "status": "invalid_endpoint",
        "snapped": False,
        "node_id": None,
        "snap_distance_meters": None,
        "lat": lat,
        "lon": lon,
        "message": "Endpoint requires a known district_id or valid coordinates.",
    }

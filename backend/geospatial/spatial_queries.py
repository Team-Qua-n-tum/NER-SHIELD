"""
spatial_queries.py — Common spatial filter operations for the NER-SHIELD API.

These functions accept plain Python dicts (from DataStore) and return
filtered subsets — no PostGIS or ORM required.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .coordinate_utils import haversine_distance

# ---------------------------------------------------------------------------
# Road queries
# ---------------------------------------------------------------------------


def roads_in_bounds(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    roads: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Return roads whose midpoint is within the axis-aligned bounding box.

    Parameters
    ----------
    min_lat, max_lat, min_lon, max_lon : Bounding box in WGS-84 degrees.
    roads : List of road dicts.
    """
    results = []
    for road in roads:
        try:
            lat = (road["start_lat"] + road["end_lat"]) / 2
            lon = (road["start_lng"] + road["end_lng"]) / 2
        except KeyError:
            lat = road.get("lat")
            lon = road.get("lng")
            if lat is None or lon is None:
                continue
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            results.append(road)
    return results


def roads_by_status(
    roads: List[Dict[str, Any]],
    status: str,
) -> List[Dict[str, Any]]:
    """Return roads matching the given status string."""
    return [r for r in roads if r.get("status") == status]


def high_risk_roads(
    roads: List[Dict[str, Any]],
    threshold: float = 0.6,
) -> List[Dict[str, Any]]:
    """Return roads with disruption_risk >= threshold."""
    return [r for r in roads if float(r.get("disruption_risk", 0.0)) >= threshold]


# ---------------------------------------------------------------------------
# Incident queries
# ---------------------------------------------------------------------------


def incidents_within_radius(
    lat: float,
    lon: float,
    radius_km: float,
    incidents: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Return incidents whose (lat, lng) is within *radius_km* of the query point.

    Parameters
    ----------
    lat, lon   : Query centre (WGS-84).
    radius_km  : Search radius in km.
    incidents  : List of incident dicts.
    """
    results = []
    for inc in incidents:
        inc_lat = inc.get("lat")
        inc_lon = inc.get("lng")
        if inc_lat is None or inc_lon is None:
            continue
        dist = haversine_distance(lat, lon, float(inc_lat), float(inc_lon))
        if dist <= radius_km:
            results.append({**inc, "_distance_km": round(dist, 3)})
    results.sort(key=lambda i: i["_distance_km"])
    return results


def incidents_by_district(
    incidents: List[Dict[str, Any]],
    district_id: str,
) -> List[Dict[str, Any]]:
    """Return incidents for a specific district."""
    return [i for i in incidents if i.get("district_id") == district_id]


def active_incidents(
    incidents: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Return incidents with status ACTIVE or IN_PROGRESS."""
    return [i for i in incidents if i.get("status") in ("ACTIVE", "IN_PROGRESS")]


# ---------------------------------------------------------------------------
# Vehicle queries
# ---------------------------------------------------------------------------


def vehicles_in_bounds(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    vehicles: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Return vehicles whose last known position is within the bounding box."""
    results = []
    for v in vehicles:
        lat = v.get("lat")
        lon = v.get("lng")
        if lat is None or lon is None:
            continue
        if min_lat <= float(lat) <= max_lat and min_lon <= float(lon) <= max_lon:
            results.append(v)
    return results


def vehicles_near_incident(
    incident: Dict[str, Any],
    vehicles: List[Dict[str, Any]],
    radius_km: float = 50.0,
) -> List[Dict[str, Any]]:
    """Return vehicles within *radius_km* of a given incident."""
    lat = incident.get("lat")
    lon = incident.get("lng")
    if lat is None or lon is None:
        return []
    return [
        v for v in vehicles
        if v.get("lat") is not None
        and haversine_distance(float(lat), float(lon), float(v["lat"]), float(v.get("lng", 0))) <= radius_km
    ]

"""
road_matching.py — Nearest road / incident association utilities.

Uses Haversine distance to find the closest road to a given coordinate.
Pure Python — no PostGIS required (works in DEMO_MODE=true).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from .coordinate_utils import haversine_distance

# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------


@dataclass
class RoadProximityResult:
    """Result of a road-proximity search."""
    road_id: str
    road_name: str
    distance_km: float
    nearest_point_lat: float
    nearest_point_lon: float


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _road_centroid(road: Dict[str, Any]) -> Optional[Tuple[float, float]]:
    """
    Return the approximate centroid (lat, lon) of a road dict.

    Accepts roads with:
      - ``start_lat`` / ``start_lng`` and ``end_lat`` / ``end_lng``
      - OR ``lat`` / ``lng`` directly (e.g. legacy in-memory format)
    """
    # Try start/end format
    try:
        lat = (road["start_lat"] + road["end_lat"]) / 2
        lon = (road["start_lng"] + road["end_lng"]) / 2
        return lat, lon
    except KeyError:
        pass
    # Try single lat/lng
    try:
        return road["lat"], road["lng"]
    except KeyError:
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def find_nearest_road(
    lat: float,
    lon: float,
    roads: List[Dict[str, Any]],
    max_distance_km: float = 50.0,
) -> Optional[RoadProximityResult]:
    """
    Find the road segment nearest to ``(lat, lon)`` from a list of road dicts.

    Parameters
    ----------
    lat, lon        : Query coordinate (WGS-84).
    roads           : List of road dicts (from DataStore or ORM query).
    max_distance_km : Maximum search radius. Returns None if no road within this range.

    Returns
    -------
    RoadProximityResult or None if no road is within ``max_distance_km``.
    """
    best: Optional[RoadProximityResult] = None
    best_dist = float("inf")

    for road in roads:
        centroid = _road_centroid(road)
        if centroid is None:
            continue
        rlat, rlon = centroid
        dist = haversine_distance(lat, lon, rlat, rlon)
        if dist < best_dist:
            best_dist = dist
            best = RoadProximityResult(
                road_id=road.get("id", ""),
                road_name=road.get("name", ""),
                distance_km=round(dist, 3),
                nearest_point_lat=rlat,
                nearest_point_lon=rlon,
            )

    if best is None or best.distance_km > max_distance_km:
        return None
    return best


def associate_incident_road(
    lat: float,
    lon: float,
    roads: List[Dict[str, Any]],
    max_distance_km: float = 20.0,
) -> Optional[str]:
    """
    Return the road_id of the nearest road to an incident coordinate.

    Returns None if no road is within ``max_distance_km``.
    """
    result = find_nearest_road(lat, lon, roads, max_distance_km=max_distance_km)
    return result.road_id if result else None


def roads_sorted_by_proximity(
    lat: float,
    lon: float,
    roads: List[Dict[str, Any]],
) -> List[RoadProximityResult]:
    """
    Return all roads sorted by ascending distance from ``(lat, lon)``.
    Excludes any road dicts without parseable centroid coordinates.
    """
    results = []
    for road in roads:
        centroid = _road_centroid(road)
        if centroid is None:
            continue
        rlat, rlon = centroid
        dist = haversine_distance(lat, lon, rlat, rlon)
        results.append(
            RoadProximityResult(
                road_id=road.get("id", ""),
                road_name=road.get("name", ""),
                distance_km=round(dist, 3),
                nearest_point_lat=rlat,
                nearest_point_lon=rlon,
            )
        )
    results.sort(key=lambda r: r.distance_km)
    return results

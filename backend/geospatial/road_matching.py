"""
road_matching.py — Incident-to-road proximity and deterministic association utilities.

Supports both segment-level Haversine distance calculations and backward-compatible
centroid/vertex matching without requiring PostGIS or external C libraries.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from .coordinate_utils import assert_wgs84, haversine_distance_meters, validate_wgs84

# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------


@dataclass
class RoadProximityResult:
    """Result of a road-proximity search (backward-compatible)."""
    road_id: str
    road_name: str
    distance_km: float
    nearest_point_lat: float
    nearest_point_lon: float


# ---------------------------------------------------------------------------
# Geometric Distance Helpers
# ---------------------------------------------------------------------------


def _point_to_segment_distance_meters(
    p_lat: float, p_lon: float,
    a_lat: float, a_lon: float,
    b_lat: float, b_lon: float,
) -> Tuple[float, float, float]:
    """
    Calculate minimum distance from point P to segment AB in meters.
    Returns (distance_meters, nearest_lat, nearest_lon).
    """
    # Degenerate segment: A == B
    if abs(a_lat - b_lat) < 1e-9 and abs(a_lon - b_lon) < 1e-9:
        d = haversine_distance_meters(p_lat, p_lon, a_lat, a_lon)
        return d, a_lat, a_lon

    # Local equirectangular projection centered at query point
    mid_lat_rad = math.radians((a_lat + b_lat + p_lat) / 3.0)
    cos_lat = math.cos(mid_lat_rad)

    # Coordinates in degree space scaled for longitude convergence
    ax, ay = (a_lon - p_lon) * cos_lat, a_lat - p_lat
    bx, by = (b_lon - p_lon) * cos_lat, b_lat - p_lat

    dx, dy = bx - ax, by - ay
    seg_len_sq = dx * dx + dy * dy

    if seg_len_sq <= 0:
        d = haversine_distance_meters(p_lat, p_lon, a_lat, a_lon)
        return d, a_lat, a_lon

    # Projection parameter t of (0,0) onto segment AB
    t = -(ax * dx + ay * dy) / seg_len_sq
    t_clamped = max(0.0, min(1.0, t))

    # Nearest point on segment in geographic coordinates
    nearest_lat = a_lat + t_clamped * (b_lat - a_lat)
    nearest_lon = a_lon + t_clamped * (b_lon - a_lon)

    d = haversine_distance_meters(p_lat, p_lon, nearest_lat, nearest_lon)
    return d, nearest_lat, nearest_lon


def _extract_road_coordinates(road: Dict[str, Any]) -> List[Tuple[float, float]]:
    """Extract list of (lat, lon) coordinates from a road dictionary."""
    points: List[Tuple[float, float]] = []

    # 1. Check path_coordinates
    raw_coords = road.get("path_coordinates")
    if isinstance(raw_coords, list) and raw_coords:
        for p in raw_coords:
            if isinstance(p, dict):
                lat = p.get("lat", p.get("latitude"))
                lon = p.get("lng", p.get("lon", p.get("longitude")))
            elif isinstance(p, (list, tuple)) and len(p) >= 2:
                lat, lon = p[0], p[1]
            else:
                continue
            if lat is not None and lon is not None:
                try:
                    f_lat, f_lon = float(lat), float(lon)
                    if validate_wgs84(f_lat, f_lon):
                        points.append((f_lat, f_lon))
                except (TypeError, ValueError):
                    pass

    # 2. Check start_lat/start_lng and end_lat/end_lng
    if len(points) < 2 and "start_lat" in road and "end_lat" in road:
        try:
            s_lat = float(road["start_lat"])
            s_lon = float(road.get("start_lng", road.get("start_lon", 0.0)))
            e_lat = float(road["end_lat"])
            e_lon = float(road.get("end_lng", road.get("end_lon", 0.0)))
            if validate_wgs84(s_lat, s_lon) and validate_wgs84(e_lat, e_lon):
                points = [(s_lat, s_lon), (e_lat, e_lon)]
        except (TypeError, ValueError, KeyError):
            pass

    # 3. Single lat/lng point fallback
    if not points and "lat" in road and ("lng" in road or "lon" in road):
        try:
            lat = float(road["lat"])
            lon = float(road.get("lng", road.get("lon", 0.0)))
            if validate_wgs84(lat, lon):
                points = [(lat, lon)]
        except (TypeError, ValueError):
            pass

    return points


def _distance_to_road(
    lat: float, lon: float, road: Dict[str, Any]
) -> Tuple[float, float, float, str]:
    """
    Calculate minimum distance from (lat, lon) to a road.
    Returns (distance_meters, nearest_lat, nearest_lon, method_used).
    """
    points = _extract_road_coordinates(road)
    if not points:
        return float("inf"), lat, lon, "no_valid_geometry"

    if len(points) == 1:
        d = haversine_distance_meters(lat, lon, points[0][0], points[0][1])
        return d, points[0][0], points[0][1], "nearest_vertex_haversine"

    min_dist = float("inf")
    best_lat, best_lon = points[0]

    for i in range(len(points) - 1):
        a_lat, a_lon = points[i]
        b_lat, b_lon = points[i + 1]
        dist, n_lat, n_lon = _point_to_segment_distance_meters(
            lat, lon, a_lat, a_lon, b_lat, b_lon
        )
        if dist < min_dist:
            min_dist = dist
            best_lat, best_lon = n_lat, n_lon

    return min_dist, best_lat, best_lon, "nearest_segment_haversine"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def find_nearest_road(
    latitude: float,
    longitude: float,
    roads: List[Dict[str, Any]],
    max_distance_meters: Optional[float] = None,
    explicit_road_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Find the nearest road segment to (latitude, longitude) among roads.

    Parameters
    ----------
    latitude, longitude : WGS-84 coordinate of incident / query point.
    roads               : List of road dicts.
    max_distance_meters : Maximum allowable distance in meters (None for unlimited).
    explicit_road_id    : If provided and matches a known road, prioritizes this road.

    Returns
    -------
    dict matching the WORK ITEM 4 contract:
      {
        "road_id": "road-002",
        "distance_meters": 125.4,
        "match_method": "nearest_segment_haversine",
        "matched_at": "2026-09-17T07:00:00Z",
        "matched": True
      }
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    no_match_response = {
        "road_id": None,
        "distance_meters": None,
        "match_method": "no_match_within_threshold",
        "matched_at": now_iso,
        "matched": False,
    }

    if not roads or not validate_wgs84(latitude, longitude):
        return no_match_response

    # 1. Explicit road_id provided and valid
    if explicit_road_id:
        target_road = next((r for r in roads if r.get("id") == explicit_road_id), None)
        if target_road:
            dist_m, _, _, method = _distance_to_road(latitude, longitude, target_road)
            if max_distance_meters is None or dist_m <= max_distance_meters:
                return {
                    "road_id": explicit_road_id,
                    "distance_meters": round(dist_m, 1),
                    "match_method": f"explicit_assignment_{method}",
                    "matched_at": now_iso,
                    "matched": True,
                }

    # 2. Spatial segment-level matching
    best_road_id: Optional[str] = None
    best_dist = float("inf")
    best_method = "nearest_segment_haversine"

    for road in roads:
        dist_m, _, _, method = _distance_to_road(latitude, longitude, road)
        if dist_m < best_dist:
            best_dist = dist_m
            best_road_id = road.get("id")
            best_method = method

    if best_road_id is None or (max_distance_meters is not None and best_dist > max_distance_meters):
        return no_match_response

    return {
        "road_id": best_road_id,
        "distance_meters": round(best_dist, 1),
        "match_method": best_method,
        "matched_at": now_iso,
        "matched": True,
    }


# ---------------------------------------------------------------------------
# Backward-compatible API for existing tests and services
# ---------------------------------------------------------------------------


def associate_incident_road(
    lat: float,
    lon: float,
    roads: List[Dict[str, Any]],
    max_distance_km: float = 50.0,
) -> Optional[str]:
    """
    Return road_id of the nearest road to an incident coordinate, or None.
    Default search radius increased to 50 km to accommodate regional scale.
    """
    max_meters = max_distance_km * 1000.0 if max_distance_km is not None else None
    result = find_nearest_road(lat, lon, roads, max_distance_meters=max_meters)
    return result["road_id"] if result.get("matched") else None


def roads_sorted_by_proximity(
    lat: float,
    lon: float,
    roads: List[Dict[str, Any]],
) -> List[RoadProximityResult]:
    """
    Return all roads sorted by ascending distance from (lat, lon).
    Uses segment-accurate distances.
    """
    results: List[RoadProximityResult] = []
    for road in roads:
        dist_m, n_lat, n_lon, _ = _distance_to_road(lat, lon, road)
        if math.isinf(dist_m):
            continue
        results.append(
            RoadProximityResult(
                road_id=str(road.get("id", "")),
                road_name=str(road.get("name", "")),
                distance_km=round(dist_m / 1000.0, 3),
                nearest_point_lat=round(n_lat, 6),
                nearest_point_lon=round(n_lon, 6),
            )
        )
    results.sort(key=lambda r: r.distance_km)
    return results

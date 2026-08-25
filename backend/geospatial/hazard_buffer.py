"""
hazard_buffer.py — Bounding-box and radius buffer operations for hazard zones.

Provides lightweight spatial proximity checks without PostGIS.
All coordinates are WGS-84 (SRID 4326).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

from .coordinate_utils import EARTH_RADIUS_KM, haversine_distance
import math

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------


@dataclass
class BoundingBox:
    """Axis-aligned bounding box in WGS-84 degrees."""
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float

    def contains(self, lat: float, lon: float) -> bool:
        return (
            self.min_lat <= lat <= self.max_lat
            and self.min_lon <= lon <= self.max_lon
        )


# ---------------------------------------------------------------------------
# Buffer construction
# ---------------------------------------------------------------------------


def create_buffer_km(lat: float, lon: float, radius_km: float) -> BoundingBox:
    """
    Return an approximate axis-aligned bounding box around (lat, lon) with
    the given radius in kilometres.

    Uses the flat-Earth approximation which is accurate to <0.3% for
    the distances relevant to NER logistics (5–200 km).
    """
    if radius_km <= 0:
        raise ValueError(f"radius_km must be positive, got {radius_km}")

    # 1° of latitude ≈ 111 km everywhere
    delta_lat = math.degrees(radius_km / EARTH_RADIUS_KM)
    # 1° of longitude ≈ 111 km * cos(lat)
    delta_lon = math.degrees(radius_km / (EARTH_RADIUS_KM * math.cos(math.radians(lat))))

    return BoundingBox(
        min_lat=lat - delta_lat,
        max_lat=lat + delta_lat,
        min_lon=lon - delta_lon,
        max_lon=lon + delta_lon,
    )


# ---------------------------------------------------------------------------
# Spatial filtering helpers
# ---------------------------------------------------------------------------


def roads_in_buffer(
    lat: float,
    lon: float,
    radius_km: float,
    roads: List[Dict[str, Any]],
) -> List[str]:
    """
    Return road IDs whose centroid falls within *radius_km* of (lat, lon).

    Parameters
    ----------
    lat, lon   : Hazard epicentre.
    radius_km  : Search radius in km.
    roads      : List of road dicts (id, start_lat, start_lng, end_lat, end_lng).

    Returns
    -------
    List of road ID strings.
    """
    affected: List[str] = []
    for road in roads:
        try:
            centroid_lat = (road["start_lat"] + road["end_lat"]) / 2
            centroid_lon = (road["start_lng"] + road["end_lng"]) / 2
        except KeyError:
            try:
                centroid_lat = road["lat"]
                centroid_lon = road["lng"]
            except KeyError:
                continue
        dist = haversine_distance(lat, lon, centroid_lat, centroid_lon)
        if dist <= radius_km:
            road_id = road.get("id")
            if road_id:
                affected.append(road_id)
    return affected


def incidents_in_buffer(
    lat: float,
    lon: float,
    radius_km: float,
    incidents: List[Dict[str, Any]],
) -> List[str]:
    """
    Return incident IDs within *radius_km* of (lat, lon).
    """
    affected: List[str] = []
    for inc in incidents:
        inc_lat = inc.get("lat")
        inc_lon = inc.get("lng")
        if inc_lat is None or inc_lon is None:
            continue
        dist = haversine_distance(lat, lon, float(inc_lat), float(inc_lon))
        if dist <= radius_km:
            inc_id = inc.get("id")
            if inc_id:
                affected.append(inc_id)
    return affected

"""
coordinate_utils.py — WGS-84 coordinate validation and distance calculation.

All coordinates in NER-SHIELD use SRID 4326 (WGS-84 geographic CRS).
Latitude range:  -90.0 to +90.0
Longitude range: -180.0 to +180.0

The North Eastern Region (NER) of India occupies approximately:
  Latitude:  21.0° N – 30.5° N
  Longitude: 87.0° E – 98.5° E
"""

from __future__ import annotations

import math
from typing import Optional, Tuple

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EARTH_RADIUS_KM = 6371.0
EARTH_RADIUS_METERS = 6371000.0

# Approximate bounding box for the NER (with ~1° operational buffer)
NER_LAT_MIN = 21.0
NER_LAT_MAX = 30.5
NER_LON_MIN = 87.0
NER_LON_MAX = 98.5


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def validate_wgs84(lat: float, lon: float) -> bool:
    """
    Return True if (lat, lon) are valid WGS-84 geographic coordinates.

    Parameters
    ----------
    lat : float — latitude in decimal degrees (-90 to +90)
    lon : float — longitude in decimal degrees (-180 to +180)
    """
    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return False
    return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0


def assert_wgs84(lat: float, lon: float) -> None:
    """Raise ValueError if coordinates are out of WGS-84 range."""
    if not validate_wgs84(lat, lon):
        raise ValueError(
            f"Invalid WGS-84 coordinates: lat={lat}, lon={lon}. "
            f"Expected lat in [-90, 90] and lon in [-180, 180]."
        )


def validate_ner_bounds(lat: float, lon: float, buffer_deg: float = 1.0) -> bool:
    """
    Validate whether (lat, lon) falls within the practical operational NER bounds,
    allowing an optional buffer for viewport panning/zooming.

    Raises
    ------
    ValueError
        If coordinates fail WGS-84 range checks, or fall outside the practical
        NER operational region including the allowable buffer tolerance.
    """
    assert_wgs84(lat, lon)
    min_lat = NER_LAT_MIN - buffer_deg
    max_lat = NER_LAT_MAX + buffer_deg
    min_lon = NER_LON_MIN - buffer_deg
    max_lon = NER_LON_MAX + buffer_deg

    if not (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon):
        raise ValueError(
            f"Coordinate ({lat}, {lon}) is outside the practical NER operational envelope "
            f"[lat: {min_lat:.1f} to {max_lat:.1f}, lon: {min_lon:.1f} to {max_lon:.1f}]."
        )
    return True


def is_within_ner(lat: float, lon: float) -> bool:
    """Return True if the coordinate falls within the standard NER bounding box."""
    return (
        NER_LAT_MIN <= lat <= NER_LAT_MAX
        and NER_LON_MIN <= lon <= NER_LON_MAX
    )


def validate_bbox(min_lon: float, min_lat: float, max_lon: float, max_lat: float) -> bool:
    """
    Validate that bounding box coordinates are numeric, within WGS-84 ranges,
    and min < max.
    """
    try:
        min_lon = float(min_lon)
        min_lat = float(min_lat)
        max_lon = float(max_lon)
        max_lat = float(max_lat)
    except (TypeError, ValueError):
        return False

    if not (-180.0 <= min_lon <= 180.0 and -180.0 <= max_lon <= 180.0):
        return False
    if not (-90.0 <= min_lat <= 90.0 and -90.0 <= max_lat <= 90.0):
        return False
    if min_lon >= max_lon or min_lat >= max_lat:
        return False
    return True


def parse_bbox(value: Optional[str]) -> Optional[Tuple[float, float, float, float]]:
    """
    Parse a comma-separated bounding box string in 'minLon,minLat,maxLon,maxLat' format.

    Returns (min_lon, min_lat, max_lon, max_lat) tuple or None if value is empty/None.
    Raises ValueError with explanatory message on invalid format or coordinates.
    """
    if value is None:
        return None
    val = value.strip()
    if not val:
        return None

    parts = [p.strip() for p in val.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox must contain exactly 4 comma-separated values: minLon,minLat,maxLon,maxLat")

    try:
        min_lon, min_lat, max_lon, max_lat = [float(p) for p in parts]
    except ValueError as exc:
        raise ValueError(f"bbox components must be valid float numbers: {val}") from exc

    if not validate_bbox(min_lon, min_lat, max_lon, max_lat):
        raise ValueError(
            f"Invalid bbox bounds: minLon={min_lon}, minLat={min_lat}, maxLon={max_lon}, maxLat={max_lat}. "
            "Ensure -180 <= minLon < maxLon <= 180 and -90 <= minLat < maxLat <= 90."
        )

    return min_lon, min_lat, max_lon, max_lat


# ---------------------------------------------------------------------------
# Distance & Geometry Helpers
# ---------------------------------------------------------------------------


def haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Calculate the great-circle distance between two WGS-84 points (Haversine formula).

    Returns
    -------
    float : Distance in kilometres.
    """
    assert_wgs84(lat1, lon1)
    assert_wgs84(lat2, lon2)

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    # Numerical safeguard for identical / near-identical coordinates
    a = min(1.0, max(0.0, a))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def haversine_distance_meters(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Calculate great-circle distance between two WGS-84 points in meters.
    """
    return haversine_distance(lat1, lon1, lat2, lon2) * 1000.0


def bearing_degrees(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Calculate initial bearing from point 1 to point 2 (0°–360°, clockwise from North).
    """
    assert_wgs84(lat1, lon1)
    assert_wgs84(lat2, lon2)

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dlambda = math.radians(lon2 - lon1)

    x = math.sin(dlambda) * math.cos(phi2)
    y = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
    theta = math.atan2(x, y)
    return (math.degrees(theta) + 360) % 360


def midpoint(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> Tuple[float, float]:
    """Return the geographic midpoint of two WGS-84 points as (lat, lon)."""
    assert_wgs84(lat1, lon1)
    assert_wgs84(lat2, lon2)

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    lam1, lam2 = math.radians(lon1), math.radians(lon2)

    bx = math.cos(phi2) * math.cos(lam2 - lam1)
    by = math.cos(phi2) * math.sin(lam2 - lam1)

    phi_m = math.atan2(
        math.sin(phi1) + math.sin(phi2),
        math.sqrt((math.cos(phi1) + bx) ** 2 + by**2),
    )
    lam_m = lam1 + math.atan2(by, math.cos(phi1) + bx)

    return math.degrees(phi_m), math.degrees(lam_m)

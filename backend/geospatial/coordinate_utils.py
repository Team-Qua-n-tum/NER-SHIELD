"""
coordinate_utils.py — WGS-84 coordinate validation and distance calculation.

All coordinates in NER-SHIELD use SRID 4326 (WGS-84 geographic CRS).
Latitude range:  -90.0 to +90.0
Longitude range: -180.0 to +180.0

The North Eastern Region of India occupies approximately:
  Latitude:  22.0° N – 29.5° N
  Longitude: 88.0° E – 97.5° E
"""

from __future__ import annotations

import math
from typing import Tuple

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EARTH_RADIUS_KM = 6371.0

# Approximate bounding box for the NER (with ~1° buffer)
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
    return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0


def assert_wgs84(lat: float, lon: float) -> None:
    """Raise ValueError if coordinates are out of WGS-84 range."""
    if not validate_wgs84(lat, lon):
        raise ValueError(
            f"Invalid WGS-84 coordinates: lat={lat}, lon={lon}. "
            f"Expected lat ∈ [-90, 90] and lon ∈ [-180, 180]."
        )


def is_within_ner(lat: float, lon: float) -> bool:
    """Return True if the coordinate falls within the NER bounding box."""
    return (
        NER_LAT_MIN <= lat <= NER_LAT_MAX
        and NER_LON_MIN <= lon <= NER_LON_MAX
    )


# ---------------------------------------------------------------------------
# Distance
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
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def bearing_degrees(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Calculate the initial bearing from point 1 to point 2 (0°–360°, clockwise from North).
    """
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

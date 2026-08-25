"""
geojson_utils.py — GeoJSON validation and construction helpers.

All geometries use SRID 4326 (WGS-84).
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from .coordinate_utils import assert_wgs84, validate_wgs84

# ---------------------------------------------------------------------------
# Type aliases
# ---------------------------------------------------------------------------

Coordinate = Tuple[float, float]  # (longitude, latitude) — GeoJSON order
GeoJSONGeometry = Dict[str, Any]
GeoJSONFeature = Dict[str, Any]


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

_VALID_TYPES = {
    "Point", "MultiPoint",
    "LineString", "MultiLineString",
    "Polygon", "MultiPolygon",
    "GeometryCollection", "Feature", "FeatureCollection",
}


def validate_geojson(obj: Any) -> bool:
    """
    Return True if *obj* is a structurally valid GeoJSON geometry or feature.

    Checks:
    - ``type`` key is present and a recognised GeoJSON type.
    - ``coordinates`` (or ``geometries`` / ``features``) key is present.
    - All coordinate pairs are within WGS-84 bounds.
    """
    if not isinstance(obj, dict):
        return False

    geo_type = obj.get("type")
    if geo_type not in _VALID_TYPES:
        return False

    if geo_type == "Feature":
        return isinstance(obj.get("geometry"), dict) and validate_geojson(obj["geometry"])

    if geo_type == "FeatureCollection":
        features = obj.get("features")
        return isinstance(features, list) and all(validate_geojson(f) for f in features)

    if geo_type == "GeometryCollection":
        geometries = obj.get("geometries")
        return isinstance(geometries, list) and all(validate_geojson(g) for g in geometries)

    coords = obj.get("coordinates")
    if coords is None:
        return False

    return _validate_coordinates(geo_type, coords)


def _validate_coordinates(geo_type: str, coords: Any) -> bool:
    """Recursively check that coordinate values are within WGS-84 range."""
    if geo_type == "Point":
        return _is_valid_pair(coords)
    if geo_type in ("LineString", "MultiPoint"):
        return isinstance(coords, list) and all(_is_valid_pair(c) for c in coords)
    if geo_type in ("Polygon", "MultiLineString"):
        return isinstance(coords, list) and all(
            isinstance(ring, list) and all(_is_valid_pair(c) for c in ring)
            for ring in coords
        )
    if geo_type == "MultiPolygon":
        return isinstance(coords, list) and all(
            isinstance(poly, list) and all(
                isinstance(ring, list) and all(_is_valid_pair(c) for c in ring)
                for ring in poly
            )
            for poly in coords
        )
    return True


def _is_valid_pair(coord: Any) -> bool:
    """GeoJSON coord is [lon, lat] or [lon, lat, elevation]."""
    if not isinstance(coord, (list, tuple)) or len(coord) < 2:
        return False
    try:
        lon, lat = float(coord[0]), float(coord[1])
        return validate_wgs84(lat, lon)
    except (TypeError, ValueError):
        return False


# ---------------------------------------------------------------------------
# Construction helpers
# ---------------------------------------------------------------------------


def coords_to_geojson_point(lat: float, lon: float) -> GeoJSONGeometry:
    """
    Build a GeoJSON Point geometry from (lat, lon).
    Note: GeoJSON ordering is [longitude, latitude].
    """
    assert_wgs84(lat, lon)
    return {"type": "Point", "coordinates": [lon, lat]}


def path_to_geojson_linestring(
    points: List[Tuple[float, float]],
) -> GeoJSONGeometry:
    """
    Convert a list of (lat, lon) tuples to a GeoJSON LineString.

    Parameters
    ----------
    points : list of (lat, lon) tuples
    """
    for lat, lon in points:
        assert_wgs84(lat, lon)
    return {
        "type": "LineString",
        "coordinates": [[lon, lat] for lat, lon in points],
    }


def geojson_point_to_latlon(point: GeoJSONGeometry) -> Tuple[float, float]:
    """
    Extract (lat, lon) from a GeoJSON Point geometry.
    Raises ValueError if the geometry is not a Point.
    """
    if point.get("type") != "Point":
        raise ValueError(f"Expected GeoJSON Point, got {point.get('type')!r}.")
    lon, lat = point["coordinates"][0], point["coordinates"][1]
    return float(lat), float(lon)


def validate_coordinate_ranges(
    coords: List[Tuple[float, float]],
) -> List[Tuple[float, float]]:
    """
    Validate a list of (lat, lon) tuples and return them unchanged.
    Raises ValueError on the first invalid coordinate.
    """
    for lat, lon in coords:
        assert_wgs84(lat, lon)
    return coords

"""
geojson_utils.py — GeoJSON validation, conversion, and construction helpers.

All coordinates in GeoJSON use SRID 4326 (WGS-84) with [longitude, latitude] ordering.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union

from .coordinate_utils import assert_wgs84, validate_wgs84

# ---------------------------------------------------------------------------
# Type aliases
# ---------------------------------------------------------------------------

Coordinate = Tuple[float, float]  # (longitude, latitude) — GeoJSON order
GeoJSONGeometry = Dict[str, Any]
GeoJSONFeature = Dict[str, Any]
GeoJSONFeatureCollection = Dict[str, Any]

_VALID_TYPES = {
    "Point",
    "MultiPoint",
    "LineString",
    "MultiLineString",
    "Polygon",
    "MultiPolygon",
    "GeometryCollection",
    "Feature",
    "FeatureCollection",
}


# ---------------------------------------------------------------------------
# Timestamp formatting helper
# ---------------------------------------------------------------------------


def _format_iso(dt: Any) -> Optional[str]:
    """Safely format datetime into UTC ISO 8601 string without inventing timestamps."""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    return None


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def validate_geojson(obj: Any) -> bool:
    """
    Return True if *obj* is a structurally valid GeoJSON geometry, Feature, or FeatureCollection.
    """
    if not isinstance(obj, dict):
        return False

    geo_type = obj.get("type")
    if geo_type not in _VALID_TYPES:
        return False

    if geo_type == "Feature":
        geom = obj.get("geometry")
        return isinstance(geom, dict) and validate_geojson(geom)

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
        return isinstance(coords, list) and len(coords) >= (2 if geo_type == "LineString" else 1) and all(_is_valid_pair(c) for c in coords)
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
    """GeoJSON coordinate is [lon, lat] or [lon, lat, elevation]."""
    if not isinstance(coord, (list, tuple)) or len(coord) < 2:
        return False
    try:
        lon, lat = float(coord[0]), float(coord[1])
        return validate_wgs84(lat, lon)
    except (TypeError, ValueError):
        return False


# ---------------------------------------------------------------------------
# Low-level Construction Helpers
# ---------------------------------------------------------------------------


def coords_to_geojson_point(lat: float, lon: float) -> GeoJSONGeometry:
    """
    Build a GeoJSON Point geometry from (lat, lon).
    GeoJSON order: [longitude, latitude].
    """
    assert_wgs84(lat, lon)
    return {"type": "Point", "coordinates": [float(lon), float(lat)]}


def path_to_geojson_linestring(
    points: List[Union[Tuple[float, float], Dict[str, float]]],
) -> GeoJSONGeometry:
    """
    Convert a sequence of coordinates to a GeoJSON LineString geometry.
    Accepts list of (lat, lon) tuples or [{'lat': ..., 'lng': ...}] dicts.
    """
    coords: List[List[float]] = []
    for p in points:
        if isinstance(p, dict):
            lat = float(p.get("lat", p.get("latitude", 0.0)))
            lon = float(p.get("lng", p.get("lon", p.get("longitude", 0.0))))
        else:
            lat, lon = float(p[0]), float(p[1])
        assert_wgs84(lat, lon)
        coords.append([lon, lat])

    if len(coords) < 2:
        raise ValueError("LineString must contain at least 2 distinct points")

    return {"type": "LineString", "coordinates": coords}


def geojson_point_to_latlon(point: GeoJSONGeometry) -> Tuple[float, float]:
    """
    Extract (lat, lon) from a GeoJSON Point geometry.
    Raises ValueError if geometry is not a valid Point.
    """
    if point.get("type") != "Point":
        raise ValueError(f"Expected GeoJSON Point, got {point.get('type')!r}.")
    coords = point.get("coordinates")
    if not coords or len(coords) < 2:
        raise ValueError("Malformed Point coordinates")
    lon, lat = float(coords[0]), float(coords[1])
    assert_wgs84(lat, lon)
    return lat, lon


def validate_coordinate_ranges(
    coords: List[Tuple[float, float]],
) -> List[Tuple[float, float]]:
    """Validate a list of (lat, lon) tuples and return them unchanged."""
    for lat, lon in coords:
        assert_wgs84(lat, lon)
    return coords


# ---------------------------------------------------------------------------
# Map-Ready Entity GeoJSON Serializers
# ---------------------------------------------------------------------------


def road_to_geojson(road: Dict[str, Any]) -> GeoJSONFeature:
    """
    Convert a road record into a map-ready GeoJSON Feature with LineString geometry.
    """
    # Extract path coordinates
    path_coords = road.get("path_coordinates") or []
    coords: List[List[float]] = []
    geometry_method = "exact_linestring"

    if isinstance(path_coords, list) and len(path_coords) >= 2:
        for p in path_coords:
            if isinstance(p, dict):
                lat = float(p.get("lat", p.get("latitude", 0.0)))
                lon = float(p.get("lng", p.get("lon", p.get("longitude", 0.0))))
            elif isinstance(p, (list, tuple)) and len(p) >= 2:
                lat, lon = float(p[0]), float(p[1])
            else:
                continue
            if validate_wgs84(lat, lon):
                coords.append([lon, lat])
    elif "start_lat" in road and "end_lat" in road:
        # Fallback to start/end point line
        s_lat, s_lon = float(road["start_lat"]), float(road.get("start_lng", road.get("start_lon", 0.0)))
        e_lat, e_lon = float(road["end_lat"]), float(road.get("end_lng", road.get("end_lon", 0.0)))
        if validate_wgs84(s_lat, s_lon) and validate_wgs84(e_lat, e_lon):
            coords = [[s_lon, s_lat], [e_lon, e_lat]]
            geometry_method = "start_end_fallback"

    geometry_valid = len(coords) >= 2
    geometry = {"type": "LineString", "coordinates": coords} if geometry_valid else None

    # Road properties preserving operational metadata
    properties = {
        "id": str(road.get("id", "")),
        "external_id": road.get("external_id") or road.get("code"),
        "code": road.get("code") or road.get("id"),
        "name": road.get("name", "Unnamed Corridor"),
        "road_class": road.get("road_class", "National Highway" if str(road.get("code", "")).startswith("NH") else "State Highway"),
        "status": road.get("status", "OPEN"),
        "road_condition": road.get("road_condition", "GOOD" if road.get("status") == "OPEN" else "DEGRADED"),
        "risk_score": float(road.get("risk_score", 0.0)),
        "risk_level": road.get("risk_level", "LOW"),
        "length_km": road.get("length_km"),
        "disruption_cause": road.get("disruption_cause"),
        "district_id": road.get("district_id") or road.get("start_district"),
        "start_district": road.get("start_district"),
        "end_district": road.get("end_district"),
        "source": road.get("source", "mock" if road.get("data_mode") == "demo" else "database"),
        "source_updated_at": _format_iso(road.get("source_updated_at") or road.get("last_checked")),
        "fetched_at": _format_iso(road.get("fetched_at")),
        "freshness_seconds": road.get("freshness_seconds", 0.0),
        "stale": bool(road.get("stale", False)),
        "data_mode": road.get("data_mode", "demo"),
        "geometry_valid": geometry_valid,
        "geometry_method": geometry_method,
    }

    return {
        "type": "Feature",
        "id": properties["id"],
        "geometry": geometry,
        "properties": properties,
    }


def incident_to_geojson(incident: Dict[str, Any]) -> GeoJSONFeature:
    """
    Convert an incident record into a map-ready GeoJSON Feature with Point geometry.
    """
    lat = incident.get("lat", incident.get("latitude"))
    lon = incident.get("lng", incident.get("lon", incident.get("longitude")))

    geometry_valid = False
    geometry = None
    if lat is not None and lon is not None:
        try:
            f_lat, f_lon = float(lat), float(lon)
            if validate_wgs84(f_lat, f_lon):
                geometry = {"type": "Point", "coordinates": [f_lon, f_lat]}
                geometry_valid = True
        except (TypeError, ValueError):
            pass

    properties = {
        "id": str(incident.get("id", "")),
        "title": incident.get("title", ""),
        "incident_type": str(incident.get("incident_type", "INCIDENT")).upper(),
        "type": incident.get("type") or str(incident.get("incident_type", "Incident")).capitalize(),
        "severity": str(incident.get("severity", "MEDIUM")).capitalize(),
        "status": incident.get("status", "ACTIVE"),
        "description": incident.get("description", ""),
        "district_id": incident.get("district_id"),
        "road_id": incident.get("road_id"),
        "affected_road_ids": incident.get("affected_road_ids", []),
        "source": incident.get("source", "field_report"),
        "observed_at": _format_iso(incident.get("observed_at") or incident.get("reported_at")),
        "source_updated_at": _format_iso(incident.get("source_updated_at") or incident.get("reported_at")),
        "fetched_at": _format_iso(incident.get("fetched_at")),
        "stale": bool(incident.get("stale", False)),
        "data_mode": incident.get("data_mode", "demo"),
        "match_method": incident.get("match_method", "unmatched" if not incident.get("road_id") else "explicit_assignment"),
        "road_match_distance_meters": incident.get("road_match_distance_meters"),
        "geometry_valid": geometry_valid,
    }

    return {
        "type": "Feature",
        "id": properties["id"],
        "geometry": geometry,
        "properties": properties,
    }


def vehicle_to_geojson(vehicle: Dict[str, Any]) -> GeoJSONFeature:
    """
    Convert a vehicle telemetry record into a map-ready GeoJSON Feature with Point geometry.
    """
    lat = vehicle.get("lat", vehicle.get("latitude"))
    lon = vehicle.get("lng", vehicle.get("lon", vehicle.get("longitude")))

    geometry_valid = False
    geometry = None
    if lat is not None and lon is not None:
        try:
            f_lat, f_lon = float(lat), float(lon)
            if validate_wgs84(f_lat, f_lon):
                geometry = {"type": "Point", "coordinates": [f_lon, f_lat]}
                geometry_valid = True
        except (TypeError, ValueError):
            pass

    properties = {
        "id": str(vehicle.get("id", "")),
        "registration_number": vehicle.get("registration_number", ""),
        "vehicle_type": vehicle.get("vehicle_type", "TRUCK"),
        "status": vehicle.get("delivery_status") or vehicle.get("status", "IN_TRANSIT"),
        "speed_kmh": float(vehicle.get("speed_kmh", 0.0)),
        "heading": vehicle.get("heading"),
        "commodity": vehicle.get("commodity"),
        "driver_name": vehicle.get("driver_name"),
        "eta_hours": vehicle.get("eta_hours"),
        "origin_district": vehicle.get("origin_district"),
        "destination_district": vehicle.get("destination_district"),
        "updated_at": _format_iso(vehicle.get("updated_at") or vehicle.get("last_ping")),
        "source": vehicle.get("source", "telemetry"),
        "freshness_seconds": vehicle.get("freshness_seconds", 0.0),
        "stale": bool(vehicle.get("stale", False)),
        "data_mode": vehicle.get("data_mode", "demo"),
        "geometry_valid": geometry_valid,
    }

    return {
        "type": "Feature",
        "id": properties["id"],
        "geometry": geometry,
        "properties": properties,
    }


def hazard_to_geojson(hazard: Dict[str, Any]) -> GeoJSONFeature:
    """
    Convert a hazard/risk zone record into a map-ready GeoJSON Feature with Polygon geometry.
    """
    polygon_coords = hazard.get("coordinates")
    geometry_method = hazard.get("geometry_method", "approximate_bbox")

    geometry = None
    geometry_valid = False

    if polygon_coords and isinstance(polygon_coords, list):
        geometry = {"type": "Polygon", "coordinates": polygon_coords}
        geometry_valid = validate_geojson(geometry)

    properties = {
        "id": str(hazard.get("id") or f"hazard-{hazard.get('incident_id', 'zone')}"),
        "incident_id": hazard.get("incident_id"),
        "hazard_type": hazard.get("hazard_type", "general_hazard"),
        "severity": hazard.get("severity", "HIGH"),
        "affected_road_ids": hazard.get("affected_road_ids", []),
        "calculated_at": _format_iso(hazard.get("calculated_at")),
        "radius_km": hazard.get("radius_km"),
        "geometry_method": geometry_method,
        "geometry_valid": geometry_valid,
    }

    return {
        "type": "Feature",
        "id": properties["id"],
        "geometry": geometry,
        "properties": properties,
    }


def to_geojson_feature(item_type: str, item: Dict[str, Any]) -> GeoJSONFeature:
    """
    Dispatcher converting any domain dictionary into a standardized GeoJSON Feature.
    """
    itype = item_type.lower()
    if itype.startswith("road"):
        return road_to_geojson(item)
    elif itype.startswith("incident"):
        return incident_to_geojson(item)
    elif itype.startswith("vehicle"):
        return vehicle_to_geojson(item)
    elif itype.startswith("hazard") or itype.startswith("risk"):
        return hazard_to_geojson(item)
    else:
        # Generic fallback
        lat = item.get("lat", item.get("latitude"))
        lon = item.get("lng", item.get("lon", item.get("longitude")))
        geom = coords_to_geojson_point(float(lat), float(lon)) if lat is not None and lon is not None else None
        return {
            "type": "Feature",
            "id": str(item.get("id", "")),
            "geometry": geom,
            "properties": item,
        }


def to_geojson_feature_collection(
    items: List[Dict[str, Any]],
    item_type: Optional[str] = None,
) -> GeoJSONFeatureCollection:
    """
    Wrap a list of domain objects or features into a standard GeoJSON FeatureCollection.
    """
    features: List[GeoJSONFeature] = []
    for it in items:
        if isinstance(it, dict) and it.get("type") == "Feature":
            features.append(it)
        elif item_type:
            features.append(to_geojson_feature(item_type, it))
        else:
            # Infer item type by attributes
            if "path_coordinates" in it or "start_district" in it:
                features.append(road_to_geojson(it))
            elif "incident_type" in it or "reported_by" in it:
                features.append(incident_to_geojson(it))
            elif "vehicle_type" in it or "registration_number" in it:
                features.append(vehicle_to_geojson(it))
            elif "radius_km" in it or "hazard_type" in it:
                features.append(hazard_to_geojson(it))
            else:
                features.append(to_geojson_feature("generic", it))

    return {
        "type": "FeatureCollection",
        "features": features,
    }

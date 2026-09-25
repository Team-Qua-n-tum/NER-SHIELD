"""
spatial_queries.py — Viewport-based spatial queries and operational dataset filters.

Operates deterministically over in-memory Python structures (from DataStore)
while providing standardized spatial predicate interfaces compatible with both
in-memory demo mode and future PostGIS repositories.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

from .coordinate_utils import haversine_distance, parse_bbox, validate_bbox, validate_wgs84
from .road_matching import _extract_road_coordinates

BBoxType = Union[Tuple[float, float, float, float], str]


def _normalize_bbox(bbox: Optional[BBoxType]) -> Optional[Tuple[float, float, float, float]]:
    """Ensure bbox is a validated (min_lon, min_lat, max_lon, max_lat) tuple."""
    if bbox is None:
        return None
    if isinstance(bbox, str):
        return parse_bbox(bbox)
    if isinstance(bbox, (tuple, list)) and len(bbox) == 4:
        min_lon, min_lat, max_lon, max_lat = float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])
        if validate_bbox(min_lon, min_lat, max_lon, max_lat):
            return min_lon, min_lat, max_lon, max_lat
        raise ValueError(f"Invalid bbox tuple: {bbox}")
    raise ValueError(f"Unrecognized bbox parameter type: {type(bbox)}")


def _point_in_bbox(lat: float, lon: float, bbox: Tuple[float, float, float, float]) -> bool:
    min_lon, min_lat, max_lon, max_lat = bbox
    return min_lon <= lon <= max_lon and min_lat <= lat <= max_lat


def _segment_intersects_bbox(
    lat1: float, lon1: float, lat2: float, lon2: float, bbox: Tuple[float, float, float, float]
) -> bool:
    """Check if line segment (lat1, lon1)-(lat2, lon2) intersects or is contained in bbox."""
    min_lon, min_lat, max_lon, max_lat = bbox

    # 1. Endpoint inside bbox
    if _point_in_bbox(lat1, lon1, bbox) or _point_in_bbox(lat2, lon2, bbox):
        return True

    # 2. Bounding box of segment doesn't overlap bbox
    seg_min_lat, seg_max_lat = min(lat1, lat2), max(lat1, lat2)
    seg_min_lon, seg_max_lon = min(lon1, lon2), max(lon1, lon2)
    if seg_max_lat < min_lat or seg_min_lat > max_lat or seg_max_lon < min_lon or seg_min_lon > max_lon:
        return False

    # 3. Simple axis projection intersection test
    # Line equation: (lat - lat1) * (lon2 - lon1) = (lon - lon1) * (lat2 - lat1)
    # Check if segment crosses any of the 4 bbox boundary segments
    d_lat = lat2 - lat1
    d_lon = lon2 - lon1

    if abs(d_lon) > 1e-9:
        # Crosses left edge (lon = min_lon)
        t_left = (min_lon - lon1) / d_lon
        if 0.0 <= t_left <= 1.0 and min_lat <= (lat1 + t_left * d_lat) <= max_lat:
            return True
        # Crosses right edge (lon = max_lon)
        t_right = (max_lon - lon1) / d_lon
        if 0.0 <= t_right <= 1.0 and min_lat <= (lat1 + t_right * d_lat) <= max_lat:
            return True

    if abs(d_lat) > 1e-9:
        # Crosses bottom edge (lat = min_lat)
        t_bottom = (min_lat - lat1) / d_lat
        if 0.0 <= t_bottom <= 1.0 and min_lon <= (lon1 + t_bottom * d_lon) <= max_lon:
            return True
        # Crosses top edge (lat = max_lat)
        t_top = (max_lat - lat1) / d_lat
        if 0.0 <= t_top <= 1.0 and min_lon <= (lon1 + t_top * d_lon) <= max_lon:
            return True

    return False


# ---------------------------------------------------------------------------
# Viewport Queries
# ---------------------------------------------------------------------------


def roads_in_bounds(*args, **kwargs) -> List[Dict[str, Any]]:
    """
    Filter roads whose geometry intersects or falls within the bounding box.

    Supports two calling conventions:
      1. roads_in_bounds(roads, bbox)
      2. roads_in_bounds(min_lat, max_lat, min_lon, max_lon, roads)  [legacy]
    """
    if len(args) >= 5 or "min_lat" in kwargs:
        # Legacy positional signature: (min_lat, max_lat, min_lon, max_lon, roads)
        min_lat = float(args[0] if len(args) > 0 else kwargs["min_lat"])
        max_lat = float(args[1] if len(args) > 1 else kwargs["max_lat"])
        min_lon = float(args[2] if len(args) > 2 else kwargs["min_lon"])
        max_lon = float(args[3] if len(args) > 3 else kwargs["max_lon"])
        roads = args[4] if len(args) > 4 else kwargs["roads"]
        bbox = (min_lon, min_lat, max_lon, max_lat)
    else:
        # Modern signature: roads_in_bounds(roads, bbox)
        roads = args[0] if len(args) > 0 else kwargs.get("roads", [])
        raw_bbox = args[1] if len(args) > 1 else kwargs.get("bbox")
        bbox = _normalize_bbox(raw_bbox)

    if bbox is None:
        return list(roads)

    results: List[Dict[str, Any]] = []
    for road in roads:
        points = _extract_road_coordinates(road)
        if not points:
            continue

        if len(points) == 1:
            if _point_in_bbox(points[0][0], points[0][1], bbox):
                results.append(road)
        else:
            # Check if any point or segment intersects bbox
            matched = False
            for i in range(len(points) - 1):
                p1 = points[i]
                p2 = points[i + 1]
                if _segment_intersects_bbox(p1[0], p1[1], p2[0], p2[1], bbox):
                    matched = True
                    break
            if matched:
                results.append(road)

    return results


def incidents_in_bounds(
    incidents: List[Dict[str, Any]],
    bbox: Optional[BBoxType] = None,
) -> List[Dict[str, Any]]:
    """Filter incidents whose coordinates fall within bbox."""
    norm_bbox = _normalize_bbox(bbox)
    if norm_bbox is None:
        return list(incidents)

    results = []
    for inc in incidents:
        lat = inc.get("lat", inc.get("latitude"))
        lon = inc.get("lng", inc.get("lon", inc.get("longitude")))
        if lat is None or lon is None:
            continue
        try:
            f_lat, f_lon = float(lat), float(lon)
            if _point_in_bbox(f_lat, f_lon, norm_bbox):
                results.append(inc)
        except (TypeError, ValueError):
            continue
    return results


def vehicles_in_bounds(*args, **kwargs) -> List[Dict[str, Any]]:
    """
    Filter vehicles whose location falls within bbox.

    Supports:
      1. vehicles_in_bounds(vehicles, bbox)
      2. vehicles_in_bounds(min_lat, max_lat, min_lon, max_lon, vehicles) [legacy]
    """
    if len(args) >= 5 or "min_lat" in kwargs:
        min_lat = float(args[0] if len(args) > 0 else kwargs["min_lat"])
        max_lat = float(args[1] if len(args) > 1 else kwargs["max_lat"])
        min_lon = float(args[2] if len(args) > 2 else kwargs["min_lon"])
        max_lon = float(args[3] if len(args) > 3 else kwargs["max_lon"])
        vehicles = args[4] if len(args) > 4 else kwargs["vehicles"]
        bbox = (min_lon, min_lat, max_lon, max_lat)
    else:
        vehicles = args[0] if len(args) > 0 else kwargs.get("vehicles", [])
        raw_bbox = args[1] if len(args) > 1 else kwargs.get("bbox")
        bbox = _normalize_bbox(raw_bbox)

    if bbox is None:
        return list(vehicles)

    results = []
    for v in vehicles:
        lat = v.get("lat", v.get("latitude"))
        lon = v.get("lng", v.get("lon", v.get("longitude")))
        if lat is None or lon is None:
            continue
        try:
            f_lat, f_lon = float(lat), float(lon)
            if _point_in_bbox(f_lat, f_lon, bbox):
                results.append(v)
        except (TypeError, ValueError):
            continue
    return results


def hazards_in_bounds(
    hazards: List[Dict[str, Any]],
    bbox: Optional[BBoxType] = None,
) -> List[Dict[str, Any]]:
    """Filter hazard zones whose bounding area overlaps the viewport."""
    norm_bbox = _normalize_bbox(bbox)
    if norm_bbox is None:
        return list(hazards)

    results = []
    for h in hazards:
        lat = h.get("lat", h.get("latitude"))
        lon = h.get("lng", h.get("lon", h.get("longitude")))
        if lat is not None and lon is not None:
            if _point_in_bbox(float(lat), float(lon), norm_bbox):
                results.append(h)
    return results


# ---------------------------------------------------------------------------
# Attribute Filters
# ---------------------------------------------------------------------------


def filter_by_since(
    records: List[Dict[str, Any]],
    since_timestamp: Optional[Union[datetime, str]],
    timestamp_fields: Sequence[str] = (
        "reported_at", "observed_at", "source_updated_at", "updated_at", "created_at", "last_checked", "last_ping"
    ),
) -> List[Dict[str, Any]]:
    """Filter records updated at or after since_timestamp."""
    if not since_timestamp:
        return list(records)

    target_dt: Optional[datetime] = None
    if isinstance(since_timestamp, str):
        try:
            target_dt = datetime.fromisoformat(since_timestamp.replace("Z", "+00:00"))
        except ValueError:
            return list(records)
    elif isinstance(since_timestamp, datetime):
        target_dt = since_timestamp

    if target_dt is None:
        return list(records)

    if target_dt.tzinfo is None:
        target_dt = target_dt.replace(tzinfo=timezone.utc)

    results = []
    for r in records:
        ts_val = None
        for f in timestamp_fields:
            if f in r and r[f] is not None:
                ts_val = r[f]
                break

        if ts_val is None:
            results.append(r)
            continue

        item_dt: Optional[datetime] = None
        if isinstance(ts_val, datetime):
            item_dt = ts_val
        elif isinstance(ts_val, str):
            try:
                item_dt = datetime.fromisoformat(ts_val.replace("Z", "+00:00"))
            except ValueError:
                results.append(r)
                continue

        if item_dt is not None:
            if item_dt.tzinfo is None:
                item_dt = item_dt.replace(tzinfo=timezone.utc)
            if item_dt >= target_dt:
                results.append(r)

    return results


def filter_by_status(
    records: List[Dict[str, Any]],
    statuses: Union[str, Sequence[str]],
    status_field: str = "status",
) -> List[Dict[str, Any]]:
    """Filter records where status_field matches one of the target statuses."""
    if isinstance(statuses, str):
        target = {statuses.upper()}
    else:
        target = {s.upper() for s in statuses}

    return [r for r in records if str(r.get(status_field, "")).upper() in target]


def filter_by_risk(
    records: List[Dict[str, Any]],
    minimum_risk: float = 0.0,
    risk_field: str = "risk_score",
) -> List[Dict[str, Any]]:
    """Filter records having risk_score (or equivalent) >= minimum_risk."""
    results = []
    for r in records:
        val = r.get(risk_field, r.get("disruption_risk", 0.0))
        try:
            if float(val) >= minimum_risk:
                results.append(r)
        except (TypeError, ValueError):
            continue
    return results


# ---------------------------------------------------------------------------
# Backward-compatible convenience functions
# ---------------------------------------------------------------------------


def roads_by_status(roads: List[Dict[str, Any]], status: str) -> List[Dict[str, Any]]:
    return filter_by_status(roads, status, "status")


def high_risk_roads(roads: List[Dict[str, Any]], threshold: float = 0.6) -> List[Dict[str, Any]]:
    return filter_by_risk(roads, threshold, "risk_score")


def incidents_within_radius(
    lat: float,
    lon: float,
    radius_km: float,
    incidents: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    results = []
    for inc in incidents:
        inc_lat = inc.get("lat")
        inc_lon = inc.get("lng")
        if inc_lat is None or inc_lon is None:
            continue
        try:
            dist = haversine_distance(lat, lon, float(inc_lat), float(inc_lon))
            if dist <= radius_km:
                results.append({**inc, "_distance_km": round(dist, 3)})
        except (TypeError, ValueError):
            continue
    results.sort(key=lambda i: i["_distance_km"])
    return results


def incidents_by_district(incidents: List[Dict[str, Any]], district_id: str) -> List[Dict[str, Any]]:
    return [i for i in incidents if i.get("district_id") == district_id]


def active_incidents(incidents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return filter_by_status(incidents, ["ACTIVE", "IN_PROGRESS"], "status")


def vehicles_near_incident(
    incident: Dict[str, Any],
    vehicles: List[Dict[str, Any]],
    radius_km: float = 50.0,
) -> List[Dict[str, Any]]:
    lat = incident.get("lat")
    lon = incident.get("lng")
    if lat is None or lon is None:
        return []
    return [
        v for v in vehicles
        if v.get("lat") is not None
        and haversine_distance(float(lat), float(lon), float(v["lat"]), float(v.get("lng", 0))) <= radius_km
    ]

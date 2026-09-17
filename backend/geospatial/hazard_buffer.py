"""
hazard_buffer.py — Hazard impact buffers, affected roads calculation, and risk zone modeling.

Provides incident-to-infrastructure impact assessments for routing cost penalties
and dynamic road status adjustments without requiring PostGIS.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from .coordinate_utils import EARTH_RADIUS_KM, haversine_distance_meters, validate_wgs84
from .road_matching import _distance_to_road

# ---------------------------------------------------------------------------
# Centralized Hazard Buffers and Penalty Constants
# ---------------------------------------------------------------------------

DEFAULT_SEVERITY_RADII_KM: Dict[str, float] = {
    "low": 0.25,
    "minor": 0.25,
    "medium": 0.75,
    "moderate": 0.75,
    "high": 1.5,
    "severe": 1.5,
    "critical": 3.0,
}

INCIDENT_TYPE_MODIFIERS: Dict[str, float] = {
    "landslide": 1.2,
    "flood": 1.5,
    "bridge_damage": 1.0,
    "road_block": 0.8,
    "accident": 0.5,
    "heavy_rainfall": 1.3,
}

SEVERITY_STATUS_RULES: Dict[str, Tuple[str, float]] = {
    # (suggested_status, suggested_risk_penalty)
    "critical": ("blocked", 1.0),
    "high": ("restricted", 0.75),
    "severe": ("restricted", 0.75),
    "medium": ("restricted", 0.50),
    "moderate": ("restricted", 0.40),
    "low": ("warning", 0.20),
    "minor": ("warning", 0.15),
}


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
# Buffer & Polygon Construction
# ---------------------------------------------------------------------------


def create_buffer_km(lat: float, lon: float, radius_km: float) -> BoundingBox:
    """
    Return an approximate axis-aligned bounding box around (lat, lon) with the given radius.
    """
    if radius_km <= 0:
        raise ValueError(f"radius_km must be positive, got {radius_km}")

    delta_lat = math.degrees(radius_km / EARTH_RADIUS_KM)
    cos_lat = math.cos(math.radians(lat))
    # Safeguard against extreme latitudes
    delta_lon = math.degrees(radius_km / (EARTH_RADIUS_KM * max(0.01, cos_lat)))

    return BoundingBox(
        min_lat=lat - delta_lat,
        max_lat=lat + delta_lat,
        min_lon=lon - delta_lon,
        max_lon=lon + delta_lon,
    )


def create_hazard_polygon(
    lat: float, lon: float, radius_km: float, num_points: int = 16
) -> List[List[List[float]]]:
    """
    Generate GeoJSON Polygon coordinates approximating a circular hazard zone.
    Returns [[[lon1, lat1], [lon2, lat2], ..., [lon1, lat1]]] in GeoJSON coordinate order.
    """
    if radius_km <= 0:
        raise ValueError(f"radius_km must be positive, got {radius_km}")

    ring: List[List[float]] = []
    delta_lat = math.degrees(radius_km / EARTH_RADIUS_KM)
    cos_lat = math.cos(math.radians(lat))
    delta_lon = math.degrees(radius_km / (EARTH_RADIUS_KM * max(0.01, cos_lat)))

    for i in range(num_points):
        angle = 2.0 * math.pi * i / num_points
        p_lat = lat + delta_lat * math.sin(angle)
        p_lon = lon + delta_lon * math.cos(angle)
        ring.append([round(p_lon, 6), round(p_lat, 6)])

    # Close the ring
    ring.append(ring[0])
    return [ring]


# ---------------------------------------------------------------------------
# Impact Assessment
# ---------------------------------------------------------------------------


def get_default_radius_km(severity: Optional[str], incident_type: Optional[str]) -> float:
    """Determine operational impact radius based on severity and incident type."""
    sev_key = (severity or "medium").lower()
    base_radius = DEFAULT_SEVERITY_RADII_KM.get(sev_key, 0.75)

    type_key = (incident_type or "general").lower()
    modifier = INCIDENT_TYPE_MODIFIERS.get(type_key, 1.0)

    return round(base_radius * modifier, 2)


def identify_affected_roads(
    incident: Dict[str, Any],
    roads: List[Dict[str, Any]],
    severity: Optional[str] = None,
    incident_type: Optional[str] = None,
    radius_km: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Calculate affected roads and suggested operational routing adjustments for an incident.

    Parameters
    ----------
    incident      : Dict containing incident details (lat, lng, severity, incident_type, road_id, etc.)
    roads         : List of road dicts to evaluate.
    severity      : Optional override of incident severity.
    incident_type : Optional override of incident type.
    radius_km     : Optional override of impact radius in km.

    Returns
    -------
    dict following WORK ITEM 5 structure:
      {
        "incident_id": "incident-004",
        "impact_method": "radius_approximation",
        "radius_km": 1.5,
        "affected_roads": [
          {
            "road_id": "road-002",
            "distance_meters": 0.0,
            "impact_level": "critical",
            "suggested_status": "blocked",
            "suggested_risk_penalty": 1.0,
            "reason": "High-severity landslide reported on matched road"
          }, ...
        ]
      }
    """
    inc_id = str(incident.get("id", "incident-unknown"))
    eff_severity = str(severity or incident.get("severity", "medium")).lower()
    eff_type = str(incident_type or incident.get("incident_type", "general")).lower()

    if radius_km is None:
        radius_km = get_default_radius_km(eff_severity, eff_type)

    radius_meters = radius_km * 1000.0

    raw_lat = incident.get("lat", incident.get("latitude"))
    raw_lon = incident.get("lng", incident.get("lon", incident.get("longitude")))
    matched_road_id = incident.get("road_id")

    affected: List[Dict[str, Any]] = []
    seen_road_ids = set()

    # 1. Include directly matched road with priority
    if matched_road_id:
        direct_road = next((r for r in roads if r.get("id") == matched_road_id), None)
        s_status, s_penalty = SEVERITY_STATUS_RULES.get(eff_severity, ("restricted", 0.5))

        # Directly matched road gets severe or blocked status if high/critical
        if eff_severity in ("critical", "high", "severe"):
            s_status = "blocked"
            s_penalty = 1.0 if eff_severity == "critical" else 0.85

        dist_m = 0.0
        if raw_lat is not None and raw_lon is not None and direct_road:
            d_calc, _, _, _ = _distance_to_road(float(raw_lat), float(raw_lon), direct_road)
            if not math.isinf(d_calc):
                dist_m = round(d_calc, 1)

        affected.append({
            "road_id": matched_road_id,
            "distance_meters": dist_m,
            "impact_level": "critical" if eff_severity in ("critical", "high", "severe") else "high",
            "suggested_status": s_status,
            "suggested_risk_penalty": s_penalty,
            "reason": f"{eff_severity.capitalize()}-severity {eff_type} reported on matched road",
        })
        seen_road_ids.add(matched_road_id)

    # 2. Check nearby roads within radius if coordinates are valid
    if raw_lat is not None and raw_lon is not None:
        try:
            lat, lon = float(raw_lat), float(raw_lon)
            if validate_wgs84(lat, lon):
                for road in roads:
                    rid = road.get("id")
                    if not rid or rid in seen_road_ids:
                        continue

                    dist_m, _, _, _ = _distance_to_road(lat, lon, road)
                    if dist_m <= radius_meters:
                        # Gradient penalty based on distance ratio
                        ratio = max(0.0, min(1.0, 1.0 - (dist_m / radius_meters)))
                        base_status, base_penalty = SEVERITY_STATUS_RULES.get(eff_severity, ("restricted", 0.5))

                        # Impact classification
                        if ratio > 0.6:
                            imp_level = "high"
                            status = base_status
                            penalty = round(base_penalty * 0.9, 2)
                        elif ratio > 0.3:
                            imp_level = "medium"
                            status = "restricted" if base_status == "blocked" else base_status
                            penalty = round(base_penalty * 0.7, 2)
                        else:
                            imp_level = "low"
                            status = "warning"
                            penalty = round(base_penalty * 0.4, 2)

                        affected.append({
                            "road_id": str(rid),
                            "distance_meters": round(dist_m, 1),
                            "impact_level": imp_level,
                            "suggested_status": status,
                            "suggested_risk_penalty": max(0.1, penalty),
                            "reason": f"Within {eff_severity} {eff_type} influence radius ({round(dist_m)}m away)",
                        })
                        seen_road_ids.add(rid)
        except (TypeError, ValueError):
            pass

    # Sort affected roads by distance ascending
    affected.sort(key=lambda x: x["distance_meters"])

    return {
        "incident_id": inc_id,
        "impact_method": "radius_approximation",
        "radius_km": radius_km,
        "affected_roads": affected,
    }


# ---------------------------------------------------------------------------
# Backward-compatible buffer helpers
# ---------------------------------------------------------------------------


def roads_in_buffer(
    lat: float,
    lon: float,
    radius_km: float,
    roads: List[Dict[str, Any]],
) -> List[str]:
    """
    Return road IDs whose segment falls within radius_km of (lat, lon).
    """
    if radius_km <= 0:
        raise ValueError(f"radius_km must be positive, got {radius_km}")

    affected: List[str] = []
    radius_m = radius_km * 1000.0

    for road in roads:
        dist_m, _, _, _ = _distance_to_road(lat, lon, road)
        if dist_m <= radius_m:
            rid = road.get("id")
            if rid:
                affected.append(str(rid))
    return affected


def incidents_in_buffer(
    lat: float,
    lon: float,
    radius_km: float,
    incidents: List[Dict[str, Any]],
) -> List[str]:
    """
    Return incident IDs within radius_km of (lat, lon).
    """
    if radius_km <= 0:
        raise ValueError(f"radius_km must be positive, got {radius_km}")

    affected: List[str] = []
    radius_m = radius_km * 1000.0

    for inc in incidents:
        inc_lat = inc.get("lat")
        inc_lon = inc.get("lng")
        if inc_lat is None or inc_lon is None:
            continue
        try:
            d_m = haversine_distance_meters(lat, lon, float(inc_lat), float(inc_lon))
            if d_m <= radius_m:
                iid = inc.get("id")
                if iid:
                    affected.append(str(iid))
        except (TypeError, ValueError):
            continue
    return affected

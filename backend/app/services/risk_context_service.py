"""
risk_context_service.py — Data assembly for AI risk inference.

Assembles a RiskFeatureContext from:
  1. Weather data via the existing weather provider boundary (operational_service).
  2. Road/incident state from db_store (DEMO_MODE) or database (live mode).
  3. GIS incident-road matching and hazard impact via geospatial layer.

Rules
-----
- Never calls Open-Meteo or any weather API directly.
- Never silently substitutes demo data after a live provider failure.
- Uses only GIS helpers already in backend/geospatial/ for spatial work.
- DEMO_MODE=true: reads from db_store, no DB session created.
- DEMO_MODE=false: uses database-backed data when available.
- Provider failure → explicit source_status classification, not silent fallback.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.ai.risk.risk_context import AffectedRoadContext, RiskFeatureContext
from backend.app.core.config import settings
from backend.app.db.store import db_store
from backend.app.providers.weather_base import WeatherReading
from backend.geospatial.hazard_buffer import identify_affected_roads
from backend.geospatial.road_matching import find_nearest_road

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Freshness thresholds
# ---------------------------------------------------------------------------

_WEATHER_STALE_SECONDS = 3600.0     # 60 minutes
_ROAD_STALE_SECONDS = 900.0         # 15 minutes
_INCIDENT_STALE_SECONDS = 1800.0    # 30 minutes


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _age_seconds(ts: Optional[datetime]) -> Optional[float]:
    if ts is None:
        return None
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return max(0.0, (_utc_now() - ts).total_seconds())


# ---------------------------------------------------------------------------
# Source status classification helper
# ---------------------------------------------------------------------------

def _classify_source_status(
    data_mode: str,
    weather_available: bool,
    weather_stale: bool,
    road_stale: bool,
    incident_stale: bool,
    provider_failed: bool,
) -> str:
    """
    Classify the overall source status of the assembled context.

    Returns one of the canonical source status values:
        live_provider_data | mixed_live_and_fallback | stale_live_data |
        heuristic_fallback | demo_synthetic_data | data_unavailable
    """
    if data_mode == "demo":
        return "demo_synthetic_data"

    if provider_failed:
        return "heuristic_fallback"

    if not weather_available:
        return "data_unavailable"

    any_stale = weather_stale or road_stale or incident_stale

    if any_stale:
        # If some are stale and some fresh it's mixed; if all stale it's stale_live_data
        all_stale = weather_stale and road_stale
        if all_stale:
            return "stale_live_data"
        return "mixed_live_and_fallback"

    return "live_provider_data"


# ---------------------------------------------------------------------------
# Road and incident data helpers
# ---------------------------------------------------------------------------

def _get_roads_list() -> List[Dict[str, Any]]:
    """Return all roads as list of dicts from db_store (demo) or DB (live)."""
    if settings.DEMO_MODE:
        roads = []
        for road in db_store.roads.values():
            r = road.model_dump() if hasattr(road, "model_dump") else road.dict()
            roads.append(r)
        return roads
    # Live mode: for now return empty (database layer not yet wired for live)
    return []


def _get_incidents_list() -> List[Dict[str, Any]]:
    """Return all incidents as list of dicts from db_store (demo) or DB (live)."""
    if settings.DEMO_MODE:
        incidents = []
        for inc in db_store.incidents.values():
            i = inc.model_dump() if hasattr(inc, "model_dump") else inc.dict()
            incidents.append(i)
        return incidents
    return []


def _get_road_dict(road_id: str) -> Optional[Dict[str, Any]]:
    """Return a single road dict by ID."""
    if settings.DEMO_MODE:
        road = db_store.roads.get(road_id)
        if road:
            return road.model_dump() if hasattr(road, "model_dump") else road.dict()
    return None


def _incidents_for_road(road_id: str, incidents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter incidents directly matched to a road_id."""
    return [
        inc for inc in incidents
        if inc.get("road_id") == road_id or inc.get("district_id") is not None
    ]


def _normalize_severity(severity: Optional[str]) -> Optional[str]:
    """Normalize varied severity strings to canonical lowercase."""
    if not severity:
        return None
    return severity.lower().replace("_", "")


# ---------------------------------------------------------------------------
# Weather assembly
# ---------------------------------------------------------------------------

def _assemble_weather(
    lat: float = 26.1445,
    lon: float = 91.7362,
) -> tuple[Optional[WeatherReading], bool, bool]:
    """
    Fetch weather via the operational service's provider.
    Returns (reading, available, provider_failed).
    Never calls Open-Meteo directly.
    """
    try:
        from backend.app.services.operational_service import operational_service  # noqa: PLC0415
        forecast = operational_service.weather_forecast()

        # Re-construct a WeatherReading-like object from the forecast response
        reading = WeatherReading(
            lat=forecast.latitude,
            lon=forecast.longitude,
            rainfall_mm=forecast.rainfall_mm,
            temperature_c=forecast.temperature_c,
            humidity_pct=forecast.humidity_pct,
            visibility_km=None,
            wind_speed_kmh=None,
            wind_direction=None,
            condition=forecast.condition,
            warning_level=forecast.warning_level,
            source=forecast.source,
            observed_at=forecast.source_updated_at.replace(tzinfo=None)
            if forecast.source_updated_at else _utc_now().replace(tzinfo=None),
        )
        provider_failed = forecast.stale
        return reading, True, provider_failed

    except Exception as exc:
        logger.warning("[RiskContextService] Weather provider failed: %s", exc)
        return None, False, True


# ---------------------------------------------------------------------------
# GIS assembly helpers
# ---------------------------------------------------------------------------

def _assemble_gis_for_road(
    road_id: str,
    road_dict: Optional[Dict[str, Any]],
    incidents: List[Dict[str, Any]],
    roads: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Use GIS layer to compute incident-road matches and hazard impacts.
    Returns a dict of GIS fields to merge into RiskFeatureContext.
    """
    gis: Dict[str, Any] = {
        "active_incident_count": 0,
        "incident_type": None,
        "incident_severity": None,
        "incident_proximity_meters": None,
        "road_match_distance_meters": None,
        "match_method": None,
        "affected_road_ids": [],
        "affected_road_count": 0,
        "affected_roads": [],
        "impact_level": None,
        "suggested_status": None,
        "suggested_risk_penalty": None,
        "hazard_radius_km": None,
        "impact_method": None,
        "affected_by_incident_ids": [],
        "highest_incident_severity": None,
    }

    if not incidents:
        return gis

    # Find incidents that directly reference this road or are in the area
    direct_incidents = [
        inc for inc in incidents
        if str(inc.get("road_id", "")) == road_id
        and inc.get("status", "").upper() not in ("RESOLVED", "CLOSED")
    ]
    nearby_incidents = [
        inc for inc in incidents
        if str(inc.get("road_id", "")) != road_id
        and inc.get("lat") is not None
        and inc.get("lng") is not None
    ]

    active_count = len(direct_incidents) + len(nearby_incidents)
    gis["active_incident_count"] = min(active_count, len(incidents))

    # Process the most severe direct incident
    severity_order = ["critical", "severe", "high", "moderate", "medium", "low", "minor"]

    def _sev_rank(inc: Dict) -> int:
        sev = str(inc.get("severity", "")).lower()
        try:
            return severity_order.index(sev)
        except ValueError:
            return len(severity_order)

    all_active = [
        inc for inc in incidents
        if inc.get("status", "").upper() not in ("RESOLVED", "CLOSED")
    ]
    gis["active_incident_count"] = len(all_active)
    gis["affected_by_incident_ids"] = [str(inc.get("id")) for inc in all_active if inc.get("id")]

    if not all_active:
        return gis

    # Sort by severity
    all_active_sorted = sorted(all_active, key=_sev_rank)
    primary = all_active_sorted[0]

    # GIS: identify affected roads from the primary incident
    if primary:
        try:
            gis_result = identify_affected_roads(
                incident=primary,
                roads=roads,
                severity=primary.get("severity"),
                incident_type=primary.get("incident_type"),
            )
            radius = gis_result.get("radius_km", 0.0)
            impact_method = gis_result.get("impact_method", "radius_approximation")
            affected = gis_result.get("affected_roads", [])

            # Find the entry for this specific road
            road_impact = next(
                (r for r in affected if r.get("road_id") == road_id), None
            )

            all_affected_ids = [r.get("road_id") for r in affected if r.get("road_id")]
            gis["affected_road_ids"] = all_affected_ids
            gis["affected_road_count"] = len(affected)
            gis["hazard_radius_km"] = radius
            gis["impact_method"] = impact_method
            gis["incident_type"] = str(primary.get("incident_type", "")).lower()
            gis["incident_severity"] = str(primary.get("severity", "")).lower()
            gis["highest_incident_severity"] = gis["incident_severity"]

            # Convert affected roads to AffectedRoadContext list
            arc_list = []
            for ar in affected:
                try:
                    arc_list.append(AffectedRoadContext(**ar))
                except Exception:
                    pass
            gis["affected_roads"] = arc_list

            if road_impact:
                gis["road_match_distance_meters"] = road_impact.get("distance_meters")
                gis["impact_level"] = road_impact.get("impact_level")
                gis["suggested_status"] = road_impact.get("suggested_status")
                gis["suggested_risk_penalty"] = road_impact.get("suggested_risk_penalty")
            else:
                # Road not directly in affected set — check via find_nearest_road on incident coords
                inc_lat = primary.get("lat")
                inc_lng = primary.get("lng", primary.get("lon"))
                if inc_lat is not None and inc_lng is not None and roads:
                    match = find_nearest_road(
                        latitude=float(inc_lat),
                        longitude=float(inc_lng),
                        roads=roads,
                        explicit_road_id=road_id,
                    )
                    if match.get("matched"):
                        gis["road_match_distance_meters"] = match.get("distance_meters")
                        gis["match_method"] = match.get("match_method")

        except Exception as exc:
            logger.warning(
                "[RiskContextService] GIS impact assessment failed for road=%s: %s",
                road_id,
                exc,
            )

    return gis


# ---------------------------------------------------------------------------
# Public assembly API
# ---------------------------------------------------------------------------

def assemble_risk_context(
    road_id: Optional[str] = None,
    district_id: Optional[str] = None,
    lat: float = 26.1445,
    lon: float = 91.7362,
) -> RiskFeatureContext:
    """
    Assemble a complete RiskFeatureContext for the given road/location.

    Parameters
    ----------
    road_id    : Road segment ID to assess. If None, returns a location-level assessment.
    district_id: District context.
    lat, lon   : Geographic coordinates for weather lookup (defaults to Guwahati).

    Returns
    -------
    RiskFeatureContext populated from all available sources.
    """
    data_mode = "demo" if settings.DEMO_MODE else "live"
    assembled_at = _utc_now()

    # ------------------------------------------------------------------
    # 1. Weather
    # ------------------------------------------------------------------
    weather_reading, weather_available, provider_failed = _assemble_weather(lat, lon)

    weather_freshness: Optional[float] = None
    weather_stale = False

    if weather_reading is not None:
        obs_ts = weather_reading.observed_at
        if obs_ts:
            if obs_ts.tzinfo is None:
                obs_ts = obs_ts.replace(tzinfo=timezone.utc)
            weather_freshness = _age_seconds(obs_ts)
            weather_stale = (
                weather_freshness is not None
                and weather_freshness > _WEATHER_STALE_SECONDS
            )

    # ------------------------------------------------------------------
    # 2. Road state
    # ------------------------------------------------------------------
    roads_list = _get_roads_list()
    road_dict: Optional[Dict[str, Any]] = None
    road_status: Optional[str] = None
    road_condition: Optional[str] = None
    road_class: Optional[str] = None
    current_risk_score: Optional[float] = None
    road_length_km: Optional[float] = None
    road_state_stale = False

    if road_id:
        road_dict = _get_road_dict(road_id)
        if road_dict:
            road_status = road_dict.get("status")
            # Road condition not in schema yet — treat status as proxy
            status_up = (road_status or "").upper()
            if status_up == "OPEN":
                road_condition = "GOOD"
            elif status_up in ("DISRUPTED", "IN_PROGRESS"):
                road_condition = "POOR"
            elif status_up in ("BLOCKED", "CLOSED"):
                road_condition = "SEVERE_DAMAGE"
            else:
                road_condition = "FAIR"

            road_class = road_dict.get("code", "")[:2] if road_dict.get("code") else None
            current_risk_score = road_dict.get("risk_score")
            road_length_km = road_dict.get("length_km")
        else:
            logger.debug("[RiskContextService] Road %s not found in store", road_id)

    # ------------------------------------------------------------------
    # 3. Incidents and GIS
    # ------------------------------------------------------------------
    incidents_list = _get_incidents_list()
    incident_freshness: Optional[float] = None
    incident_stale = False

    gis_data: Dict[str, Any] = {}
    if road_id:
        gis_data = _assemble_gis_for_road(road_id, road_dict, incidents_list, roads_list)

    # Estimate incident freshness from most recent reported_at
    if incidents_list:
        latest_ts = None
        for inc in incidents_list:
            rts = inc.get("reported_at")
            if rts and isinstance(rts, datetime):
                if rts.tzinfo is None:
                    rts = rts.replace(tzinfo=timezone.utc)
                if latest_ts is None or rts > latest_ts:
                    latest_ts = rts
        if latest_ts:
            incident_freshness = _age_seconds(latest_ts)
            incident_stale = (
                incident_freshness is not None
                and incident_freshness > _INCIDENT_STALE_SECONDS
            )

    # ------------------------------------------------------------------
    # 4. Source status
    # ------------------------------------------------------------------
    source_status = _classify_source_status(
        data_mode=data_mode,
        weather_available=weather_available,
        weather_stale=weather_stale,
        road_stale=road_state_stale,
        incident_stale=incident_stale,
        provider_failed=provider_failed,
    )

    # ------------------------------------------------------------------
    # 5. Build context
    # ------------------------------------------------------------------
    ctx_kwargs: Dict[str, Any] = {
        "road_id": road_id,
        "district_id": district_id,
        "data_mode": data_mode,
        "source_status": source_status,
        "assembled_at": assembled_at,
        # Road state
        "road_status": road_status,
        "road_condition": road_condition,
        "road_class": road_class,
        "current_risk_score": current_risk_score,
        "road_length_km": road_length_km,
        # Freshness
        "weather_freshness_seconds": weather_freshness,
        "road_state_freshness_seconds": None,
        "incident_freshness_seconds": incident_freshness,
        "weather_stale": weather_stale,
        "road_state_stale": road_state_stale,
        "incident_stale": incident_stale,
        # GIS (merged from gis_data dict)
        **gis_data,
    }

    # Weather fields (only if available)
    if weather_reading is not None:
        visibility_m = (
            float(weather_reading.visibility_km) * 1000.0
            if weather_reading.visibility_km is not None
            else None
        )
        ctx_kwargs.update({
            "rainfall_mm_24h": weather_reading.rainfall_mm,
            "weather_condition": weather_reading.condition,
            "wind_speed_kmh": weather_reading.wind_speed_kmh,
            "visibility_m": visibility_m,
            "temperature_c": weather_reading.temperature_c,
            "weather_warning_level": weather_reading.warning_level,
            "weather_source": weather_reading.source,
            "observed_at": assembled_at,
            "observation_age_minutes": (
                (weather_freshness / 60.0) if weather_freshness is not None else None
            ),
        })

    try:
        return RiskFeatureContext(**ctx_kwargs)
    except Exception as exc:
        logger.error("[RiskContextService] Failed to build RiskFeatureContext: %s", exc)
        # Return minimal safe context
        return RiskFeatureContext(
            road_id=road_id,
            district_id=district_id,
            data_mode=data_mode,
            source_status="data_unavailable",
            assembled_at=assembled_at,
        )

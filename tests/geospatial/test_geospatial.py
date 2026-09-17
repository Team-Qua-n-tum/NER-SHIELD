"""
tests/geospatial/test_geospatial.py
Comprehensive GIS unit tests for NER-SHIELD geospatial layer.
"""

import math
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.geospatial.coordinate_utils import (
    validate_wgs84,
    assert_wgs84,
    validate_ner_bounds,
    validate_bbox,
    parse_bbox,
    haversine_distance,
    haversine_distance_meters,
    is_within_ner,
    bearing_degrees,
    midpoint,
)
from backend.geospatial.geojson_utils import (
    validate_geojson,
    coords_to_geojson_point,
    path_to_geojson_linestring,
    geojson_point_to_latlon,
    validate_coordinate_ranges,
    road_to_geojson,
    incident_to_geojson,
    vehicle_to_geojson,
    hazard_to_geojson,
    to_geojson_feature_collection,
)
from backend.geospatial.road_matching import (
    find_nearest_road,
    associate_incident_road,
    roads_sorted_by_proximity,
)
from backend.geospatial.hazard_buffer import (
    create_buffer_km,
    create_hazard_polygon,
    identify_affected_roads,
    roads_in_buffer,
    incidents_in_buffer,
)
from backend.geospatial.spatial_queries import (
    roads_in_bounds,
    incidents_in_bounds,
    vehicles_in_bounds,
    filter_by_since,
    filter_by_status,
    filter_by_risk,
    incidents_within_radius,
    active_incidents,
)


# ---------------------------------------------------------------------------
# Shared Test Fixtures
# ---------------------------------------------------------------------------

_SAMPLE_ROADS = [
    {
        "id": "road-a", "name": "NH-27",
        "path_coordinates": [
            {"lat": 26.14, "lng": 91.73},
            {"lat": 25.80, "lng": 91.85},
            {"lat": 25.50, "lng": 91.90},
        ],
    },
    {
        "id": "road-b", "name": "NH-6",
        "path_coordinates": [
            {"lat": 25.57, "lng": 91.89},
            {"lat": 24.00, "lng": 92.20},
            {"lat": 23.00, "lng": 92.50},
        ],
    },
    {
        "id": "road-c", "name": "NH-2",
        "start_lat": 27.0, "start_lng": 93.0,
        "end_lat": 27.5, "end_lng": 94.0,
    },
]

_LEGACY_ROADS = [
    {"id": "road-a", "name": "NH-27", "start_lat": 26.14, "start_lng": 91.73, "end_lat": 25.5, "end_lng": 91.9},
    {"id": "road-b", "name": "NH-6",  "start_lat": 25.57, "start_lng": 91.89, "end_lat": 23.0, "end_lng": 92.5},
    {"id": "road-c", "name": "NH-2",  "start_lat": 27.0,  "start_lng": 93.0,  "end_lat": 27.5, "end_lng": 94.0},
]

# ---------------------------------------------------------------------------
# WORK ITEM 1 — WGS84 Validation
# ---------------------------------------------------------------------------

class TestCoordinateUtils:
    def test_valid_wgs84(self):
        assert validate_wgs84(26.1445, 91.7362) is True

    def test_out_of_range_lat(self):
        assert validate_wgs84(91.0, 91.7362) is False

    def test_out_of_range_lon(self):
        assert validate_wgs84(26.1445, 185.0) is False

    def test_assert_wgs84_raises_on_invalid(self):
        with pytest.raises(ValueError):
            assert_wgs84(100.0, 91.7)

    def test_haversine_guwahati_shillong(self):
        # Straight-line Haversine between Guwahati (26.14, 91.74) and Shillong (25.58, 91.89)
        # Actual great-circle distance is ~63-67 km; the test was checking road distance (wrong expectation)
        dist = haversine_distance(26.1445, 91.7362, 25.5788, 91.8933)
        assert 60.0 < dist < 75.0  # corrected: great-circle, not road distance

    def test_haversine_same_point_is_zero(self):
        dist = haversine_distance(26.0, 91.0, 26.0, 91.0)
        assert abs(dist) < 0.001

    def test_haversine_symmetry(self):
        d1 = haversine_distance(26.1, 91.7, 25.5, 91.9)
        d2 = haversine_distance(25.5, 91.9, 26.1, 91.7)
        assert abs(d1 - d2) < 0.001

    def test_haversine_distance_meters(self):
        km = haversine_distance(26.1445, 91.7362, 25.5788, 91.8933)
        m = haversine_distance_meters(26.1445, 91.7362, 25.5788, 91.8933)
        assert abs(m - km * 1000.0) < 1.0  # within 1 meter

    def test_is_within_ner_guwahati(self):
        assert is_within_ner(26.1445, 91.7362) is True

    def test_is_within_ner_outside(self):
        assert is_within_ner(28.7041, 77.1025) is False  # New Delhi

    def test_validate_ner_bounds_with_buffer(self):
        # Slightly outside strict NER but within 1deg buffer (viewport pan)
        assert validate_ner_bounds(20.5, 91.0, buffer_deg=1.0) is True

    def test_validate_ner_bounds_far_outside(self):
        # Clearly outside NER
        with pytest.raises(ValueError):
            validate_ner_bounds(0.0, 0.0)

    def test_bearing_north(self):
        bearing = bearing_degrees(0.0, 0.0, 1.0, 0.0)
        assert abs(bearing - 0.0) < 1.0

    def test_midpoint(self):
        lat_m, lon_m = midpoint(0.0, 0.0, 2.0, 2.0)
        assert abs(lat_m - 1.0) < 0.1
        assert abs(lon_m - 1.0) < 0.1


# ---------------------------------------------------------------------------
# WORK ITEM 2 — Bbox Validation
# ---------------------------------------------------------------------------

class TestBboxValidation:
    def test_valid_bbox_parsed(self):
        result = parse_bbox("88.0,22.0,97.5,29.8")
        assert result == (88.0, 22.0, 97.5, 29.8)

    def test_valid_bbox_none_input(self):
        assert parse_bbox(None) is None

    def test_malformed_bbox_letters(self):
        with pytest.raises(ValueError):
            parse_bbox("a,b,c,d")

    def test_malformed_bbox_too_few(self):
        with pytest.raises(ValueError):
            parse_bbox("88.0,22.0,97.5")

    def test_reversed_lon_bbox(self):
        # minLon > maxLon is invalid
        with pytest.raises(ValueError):
            parse_bbox("97.5,22.0,88.0,29.8")

    def test_reversed_lat_bbox(self):
        with pytest.raises(ValueError):
            parse_bbox("88.0,29.8,97.5,22.0")

    def test_out_of_range_lon(self):
        with pytest.raises(ValueError):
            parse_bbox("188.0,22.0,197.5,29.8")

    def test_validate_bbox_good(self):
        assert validate_bbox(88.0, 22.0, 97.5, 29.8) is True

    def test_validate_bbox_bad_reversed(self):
        assert validate_bbox(97.5, 22.0, 88.0, 29.8) is False


# ---------------------------------------------------------------------------
# WORK ITEM 1 — GeoJSON Conversions
# ---------------------------------------------------------------------------

class TestGeoJSONUtils:
    def test_valid_point(self):
        obj = {"type": "Point", "coordinates": [91.73, 26.14]}
        assert validate_geojson(obj) is True

    def test_invalid_type(self):
        obj = {"type": "Triangle", "coordinates": [91.73, 26.14]}
        assert validate_geojson(obj) is False

    def test_valid_linestring(self):
        obj = {"type": "LineString", "coordinates": [[91.0, 26.0], [92.0, 25.0]]}
        assert validate_geojson(obj) is True

    def test_invalid_coordinates_out_of_range(self):
        obj = {"type": "Point", "coordinates": [200.0, 26.14]}
        assert validate_geojson(obj) is False

    def test_coords_to_geojson_point(self):
        pt = coords_to_geojson_point(26.14, 91.73)
        assert pt["type"] == "Point"
        assert pt["coordinates"] == [91.73, 26.14]  # GeoJSON is [lon, lat]

    def test_coords_to_geojson_point_invalid(self):
        with pytest.raises(ValueError):
            coords_to_geojson_point(95.0, 91.0)  # invalid lat

    def test_path_to_linestring(self):
        ls = path_to_geojson_linestring([(26.0, 91.0), (25.5, 91.5)])
        assert ls["type"] == "LineString"
        assert len(ls["coordinates"]) == 2

    def test_linestring_coordinate_order_is_lon_lat(self):
        # Input: (lat, lon) — Output GeoJSON coordinates must be [lon, lat]
        ls = path_to_geojson_linestring([(26.0, 91.0), (25.5, 91.5)])
        first = ls["coordinates"][0]
        assert first[0] == 91.0  # longitude first
        assert first[1] == 26.0  # latitude second

    def test_geojson_point_to_latlon(self):
        pt = {"type": "Point", "coordinates": [91.73, 26.14]}
        lat, lon = geojson_point_to_latlon(pt)
        assert abs(lat - 26.14) < 0.001
        assert abs(lon - 91.73) < 0.001

    def test_validate_coordinate_ranges_valid(self):
        coords = [(26.1, 91.7), (25.5, 91.9)]
        assert validate_coordinate_ranges(coords) == coords

    def test_validate_coordinate_ranges_invalid(self):
        with pytest.raises(ValueError):
            validate_coordinate_ranges([(200.0, 91.0)])

    def test_road_to_geojson_feature(self):
        road = {
            "id": "road-001",
            "name": "NH-27 Test Corridor",
            "code": "NH-27",
            "status": "OPEN",
            "risk_score": 0.2,
            "risk_level": "LOW",
            "data_mode": "demo",
            "source": "mock",
            "path_coordinates": [
                {"lat": 26.14, "lng": 91.73},
                {"lat": 25.80, "lng": 91.85},
            ],
        }
        feat = road_to_geojson(road)
        assert feat["type"] == "Feature"
        assert feat["geometry"]["type"] == "LineString"
        coords = feat["geometry"]["coordinates"]
        assert coords[0][0] == 91.73  # longitude first (GeoJSON order)
        assert coords[0][1] == 26.14  # latitude second
        props = feat["properties"]
        assert props["data_mode"] == "demo"
        assert props["geometry_valid"] is True

    def test_incident_to_geojson_feature(self):
        inc = {
            "id": "inc-001",
            "incident_type": "LANDSLIDE",
            "severity": "HIGH",
            "status": "ACTIVE",
            "lat": 25.58,
            "lng": 91.89,
            "data_mode": "demo",
            "source": "field_report",
        }
        feat = incident_to_geojson(inc)
        assert feat["type"] == "Feature"
        assert feat["geometry"]["type"] == "Point"
        assert feat["geometry"]["coordinates"] == [91.89, 25.58]
        assert feat["properties"]["geometry_valid"] is True

    def test_vehicle_to_geojson_feature(self):
        veh = {
            "id": "veh-001",
            "vehicle_type": "TRUCK",
            "delivery_status": "IN_TRANSIT",
            "lat": 26.12,
            "lng": 92.20,
            "data_mode": "demo",
        }
        feat = vehicle_to_geojson(veh)
        assert feat["type"] == "Feature"
        assert feat["geometry"]["type"] == "Point"
        assert feat["properties"]["vehicle_type"] == "TRUCK"

    def test_feature_collection_wrapping(self):
        roads = [
            {"id": "r1", "name": "NH-27", "status": "OPEN", "risk_score": 0.2,
             "risk_level": "LOW", "data_mode": "demo", "source": "mock",
             "path_coordinates": [{"lat": 26.1, "lng": 91.7}, {"lat": 25.5, "lng": 91.9}]},
        ]
        fc = to_geojson_feature_collection(roads, item_type="roads")
        assert fc["type"] == "FeatureCollection"
        assert len(fc["features"]) == 1

    def test_invalid_geometry_not_silently_mapped_to_origin(self):
        # A road with no geometry should produce geometry_valid=False, not [0,0] coordinates
        road = {"id": "road-bad", "name": "No Coords", "status": "OPEN",
                "risk_score": 0.0, "risk_level": "LOW", "data_mode": "demo", "source": "mock"}
        feat = road_to_geojson(road)
        assert feat["properties"]["geometry_valid"] is False
        assert feat["geometry"] is None


# ---------------------------------------------------------------------------
# WORK ITEM 3 — Viewport Filtering
# ---------------------------------------------------------------------------

class TestViewportFiltering:
    def test_roads_within_bounds_returned(self):
        # road-a and road-b have points in this bbox; road-c is at 93-94 lon
        result = roads_in_bounds(_SAMPLE_ROADS, "91.0,25.0,92.5,27.0")
        ids = [r["id"] for r in result]
        assert "road-a" in ids
        assert "road-b" in ids

    def test_roads_outside_bounds_excluded(self):
        result = roads_in_bounds(_SAMPLE_ROADS, "91.0,25.0,92.5,27.0")
        ids = [r["id"] for r in result]
        assert "road-c" not in ids

    def test_roads_in_bounds_empty_result_safe(self):
        result = roads_in_bounds(_SAMPLE_ROADS, "0.0,0.0,1.0,1.0")
        assert result == []

    def test_incidents_in_bounds_returned(self):
        incidents = [
            {"id": "i-1", "lat": 26.1, "lng": 91.75},
            {"id": "i-2", "lat": 15.0, "lng": 75.0},
        ]
        result = incidents_in_bounds(incidents, "91.0,25.0,92.5,27.0")
        ids = [i["id"] for i in result]
        assert "i-1" in ids
        assert "i-2" not in ids

    def test_vehicles_in_bounds_returned(self):
        vehicles = [
            {"id": "v-1", "lat": 26.12, "lng": 92.20},
            {"id": "v-2", "lat": 15.0, "lng": 75.0},
        ]
        result = vehicles_in_bounds(vehicles, "91.5,25.0,93.0,27.0")
        ids = [v["id"] for v in result]
        assert "v-1" in ids
        assert "v-2" not in ids

    def test_no_bbox_returns_all(self):
        incidents = [{"id": "i-1", "lat": 26.1, "lng": 91.75}]
        assert len(incidents_in_bounds(incidents, None)) == 1

    def test_filter_by_status(self):
        records = [
            {"id": "a", "status": "OPEN"},
            {"id": "b", "status": "DISRUPTED"},
            {"id": "c", "status": "OPEN"},
        ]
        result = filter_by_status(records, ["OPEN"])
        assert all(r["status"] == "OPEN" for r in result)
        assert len(result) == 2

    def test_filter_by_risk(self):
        records = [
            {"id": "a", "risk_score": 0.8},
            {"id": "b", "risk_score": 0.3},
        ]
        result = filter_by_risk(records, minimum_risk=0.6)
        assert len(result) == 1
        assert result[0]["id"] == "a"

    def test_incidents_within_radius(self):
        incidents = [
            {"id": "i-1", "lat": 26.1, "lng": 91.75, "status": "ACTIVE"},
            {"id": "i-2", "lat": 15.0, "lng": 75.0, "status": "ACTIVE"},
        ]
        near = incidents_within_radius(26.0, 91.8, 50.0, incidents)
        assert any(i["id"] == "i-1" for i in near)
        assert not any(i["id"] == "i-2" for i in near)

    def test_incidents_within_radius_sorted_by_distance(self):
        incidents = [
            {"id": "far",  "lat": 26.5, "lng": 92.0, "status": "ACTIVE"},
            {"id": "near", "lat": 26.1, "lng": 91.75, "status": "ACTIVE"},
        ]
        result = incidents_within_radius(26.0, 91.8, 200.0, incidents)
        assert result[0]["id"] == "near"

    def test_active_incidents_filter(self):
        all_inc = [
            {"id": "a", "status": "ACTIVE"},
            {"id": "b", "status": "RESOLVED"},
            {"id": "c", "status": "IN_PROGRESS"},
        ]
        result = active_incidents(all_inc)
        ids = [i["id"] for i in result]
        assert "a" in ids
        assert "c" in ids
        assert "b" not in ids

    def test_legacy_roads_in_bounds_signature(self):
        # Legacy signature: roads_in_bounds(min_lat, max_lat, min_lon, max_lon, roads)
        result = roads_in_bounds(25.0, 27.0, 91.0, 92.5, _LEGACY_ROADS)
        assert any(r["id"] == "road-a" for r in result)
        assert not any(r["id"] == "road-c" for r in result)


# ---------------------------------------------------------------------------
# WORK ITEM 4 — Incident-to-Road Matching
# ---------------------------------------------------------------------------

class TestRoadMatching:
    def test_find_nearest_road_returns_result(self):
        result = find_nearest_road(26.0, 91.8, _SAMPLE_ROADS)
        assert result.get("matched") is True
        assert result.get("road_id") == "road-a"

    def test_find_nearest_road_returns_dict_contract(self):
        result = find_nearest_road(26.0, 91.8, _SAMPLE_ROADS)
        assert "road_id" in result
        assert "distance_meters" in result
        assert "match_method" in result
        assert "matched_at" in result
        assert "matched" in result

    def test_find_nearest_road_beyond_threshold(self):
        result = find_nearest_road(15.0, 75.0, _SAMPLE_ROADS, max_distance_meters=10000.0)
        assert result["matched"] is False
        assert result["road_id"] is None
        assert result["distance_meters"] is None

    def test_find_nearest_road_uses_explicit_road_id(self):
        result = find_nearest_road(26.0, 91.8, _SAMPLE_ROADS, explicit_road_id="road-c")
        # road-c is far but explicit; returns it if within default unlimited range
        assert result["road_id"] == "road-c"

    def test_associate_incident_road_returns_id(self):
        road_id = associate_incident_road(26.0, 91.8, _SAMPLE_ROADS)
        assert road_id == "road-a"

    def test_associate_with_legacy_roads(self):
        road_id = associate_incident_road(26.0, 91.8, _LEGACY_ROADS)
        assert road_id == "road-a"

    def test_roads_sorted_by_proximity_order(self):
        results = roads_sorted_by_proximity(26.0, 91.8, _SAMPLE_ROADS)
        distances = [r.distance_km for r in results]
        assert distances == sorted(distances)

    def test_empty_roads_returns_no_match(self):
        result = find_nearest_road(26.0, 91.8, [])
        assert result["matched"] is False

    def test_match_method_is_descriptive(self):
        result = find_nearest_road(26.0, 91.8, _SAMPLE_ROADS)
        assert "haversine" in result["match_method"] or "segment" in result["match_method"] or "vertex" in result["match_method"]

    def test_input_roads_not_mutated(self):
        import copy
        original = copy.deepcopy(_SAMPLE_ROADS)
        find_nearest_road(26.0, 91.8, _SAMPLE_ROADS)
        assert _SAMPLE_ROADS == original


# ---------------------------------------------------------------------------
# WORK ITEM 5 — Hazard Impact Assessment
# ---------------------------------------------------------------------------

class TestHazardBuffer:
    def test_create_buffer_km_contains_centre(self):
        bbox = create_buffer_km(26.0, 91.0, 50.0)
        assert bbox.contains(26.0, 91.0)

    def test_create_buffer_km_excludes_far_point(self):
        bbox = create_buffer_km(26.0, 91.0, 50.0)
        assert not bbox.contains(30.0, 91.0)

    def test_roads_in_buffer(self):
        affected = roads_in_buffer(26.0, 91.8, 100.0, _SAMPLE_ROADS)
        assert "road-a" in affected

    def test_roads_in_buffer_excludes_far_road(self):
        affected = roads_in_buffer(26.0, 91.8, 10.0, _SAMPLE_ROADS)
        assert "road-c" not in affected

    def test_incidents_in_buffer(self):
        incidents = [
            {"id": "i-1", "lat": 26.1, "lng": 91.75},
            {"id": "i-2", "lat": 15.0, "lng": 75.0},
        ]
        result = incidents_in_buffer(26.0, 91.8, 50.0, incidents)
        assert "i-1" in result
        assert "i-2" not in result

    def test_zero_radius_raises(self):
        with pytest.raises(ValueError):
            create_buffer_km(26.0, 91.0, 0.0)

    def test_identify_affected_roads_high_severity_landslide(self):
        incident = {
            "id": "inc-005",
            "lat": 26.0,
            "lng": 91.8,
            "severity": "HIGH",
            "incident_type": "landslide",
            "road_id": "road-a",
        }
        result = identify_affected_roads(incident, _SAMPLE_ROADS, severity="high", incident_type="landslide")
        assert result["incident_id"] == "inc-005"
        assert result["impact_method"] == "radius_approximation"
        assert result["radius_km"] > 0
        affected_ids = [r["road_id"] for r in result["affected_roads"]]
        # Directly matched road must be first and marked critical/blocked
        assert "road-a" in affected_ids
        direct = next(r for r in result["affected_roads"] if r["road_id"] == "road-a")
        assert direct["suggested_status"] in ("blocked", "restricted")
        assert direct["suggested_risk_penalty"] > 0.5

    def test_identify_affected_roads_nearby_included(self):
        incident = {
            "id": "inc-006",
            "lat": 26.0,
            "lng": 91.8,
            "severity": "CRITICAL",
            "incident_type": "flood",
        }
        # road-a is close; road-c at 93-94 lon is far
        result = identify_affected_roads(incident, _SAMPLE_ROADS, severity="critical", incident_type="flood")
        affected_ids = [r["road_id"] for r in result["affected_roads"]]
        assert "road-a" in affected_ids

    def test_identify_affected_roads_distant_excluded(self):
        incident = {
            "id": "inc-007",
            "lat": 26.0,
            "lng": 91.8,
            "severity": "LOW",
            "incident_type": "accident",
        }
        result = identify_affected_roads(incident, _SAMPLE_ROADS, severity="low", incident_type="accident",
                                         radius_km=0.5)
        affected_ids = [r["road_id"] for r in result["affected_roads"]]
        assert "road-c" not in affected_ids

    def test_identify_affected_roads_critical_yields_high_penalty(self):
        incident = {
            "id": "inc-008",
            "lat": 25.80,
            "lng": 91.85,
            "severity": "CRITICAL",
            "incident_type": "landslide",
            "road_id": "road-a",
        }
        result = identify_affected_roads(incident, _SAMPLE_ROADS, severity="critical")
        direct = next((r for r in result["affected_roads"] if r["road_id"] == "road-a"), None)
        assert direct is not None
        assert direct["suggested_risk_penalty"] >= 0.8

    def test_identify_affected_roads_deterministic(self):
        incident = {
            "id": "inc-det",
            "lat": 26.0,
            "lng": 91.8,
            "severity": "HIGH",
            "incident_type": "landslide",
        }
        r1 = identify_affected_roads(incident, _SAMPLE_ROADS)
        r2 = identify_affected_roads(incident, _SAMPLE_ROADS)
        ids1 = [r["road_id"] for r in r1["affected_roads"]]
        ids2 = [r["road_id"] for r in r2["affected_roads"]]
        assert ids1 == ids2

    def test_create_hazard_polygon(self):
        ring = create_hazard_polygon(26.0, 91.8, 1.5)
        assert len(ring) == 1
        outer = ring[0]
        assert outer[0] == outer[-1]  # closed ring
        assert len(outer) >= 4  # at least 4 vertices


# ---------------------------------------------------------------------------
# WORK ITEM 6 — Metadata / Freshness Preservation
# ---------------------------------------------------------------------------

class TestMetadataPreservation:
    def test_road_geojson_retains_data_mode(self):
        road = {
            "id": "r-meta", "name": "Test Rd", "status": "OPEN",
            "risk_score": 0.1, "risk_level": "LOW",
            "data_mode": "demo", "source": "mock",
            "path_coordinates": [{"lat": 26.0, "lng": 91.0}, {"lat": 25.5, "lng": 91.5}],
        }
        feat = road_to_geojson(road)
        assert feat["properties"]["data_mode"] == "demo"
        assert feat["properties"]["source"] == "mock"

    def test_incident_geojson_retains_stale_flag(self):
        inc = {
            "id": "i-stale", "incident_type": "FLOOD", "severity": "HIGH",
            "lat": 26.0, "lng": 91.0, "status": "ACTIVE",
            "stale": True, "data_mode": "demo", "source": "field_report",
        }
        feat = incident_to_geojson(inc)
        assert feat["properties"]["stale"] is True

    def test_unknown_timestamps_not_fabricated(self):
        # A record with no timestamp fields should not produce a current timestamp
        road = {
            "id": "r-no-ts", "name": "Road", "status": "OPEN",
            "risk_score": 0.0, "risk_level": "LOW",
            "data_mode": "demo", "source": "mock",
            "path_coordinates": [{"lat": 26.0, "lng": 91.0}, {"lat": 25.5, "lng": 91.5}],
        }
        feat = road_to_geojson(road)
        # source_updated_at and fetched_at should be None if not provided
        assert feat["properties"]["source_updated_at"] is None
        assert feat["properties"]["fetched_at"] is None

    def test_demo_records_labeled_honestly(self):
        road = {
            "id": "r-demo", "name": "Demo Road", "status": "OPEN",
            "risk_score": 0.0, "risk_level": "LOW",
            "data_mode": "demo", "source": "demo_seed",
            "path_coordinates": [{"lat": 26.0, "lng": 91.0}, {"lat": 25.5, "lng": 91.5}],
        }
        feat = road_to_geojson(road)
        # source should not be silently overwritten
        assert feat["properties"]["source"] == "demo_seed"

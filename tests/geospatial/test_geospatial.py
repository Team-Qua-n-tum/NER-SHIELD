"""
tests/geospatial/test_geospatial.py
Unit tests for all geospatial utility modules.
"""

import math
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.geospatial.coordinate_utils import (
    validate_wgs84,
    assert_wgs84,
    haversine_distance,
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
)
from backend.geospatial.road_matching import (
    find_nearest_road,
    associate_incident_road,
    roads_sorted_by_proximity,
)
from backend.geospatial.hazard_buffer import (
    create_buffer_km,
    roads_in_buffer,
    incidents_in_buffer,
)
from backend.geospatial.spatial_queries import (
    roads_in_bounds,
    incidents_within_radius,
    active_incidents,
)


# ---------------------------------------------------------------------------
# coordinate_utils tests
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
        # Guwahati → Shillong is approx 93–105 km by road; straight line ~90km
        dist = haversine_distance(26.1445, 91.7362, 25.5788, 91.8933)
        assert 85.0 < dist < 110.0

    def test_haversine_same_point_is_zero(self):
        dist = haversine_distance(26.0, 91.0, 26.0, 91.0)
        assert abs(dist) < 0.001

    def test_haversine_symmetry(self):
        d1 = haversine_distance(26.1, 91.7, 25.5, 91.9)
        d2 = haversine_distance(25.5, 91.9, 26.1, 91.7)
        assert abs(d1 - d2) < 0.001

    def test_is_within_ner_guwahati(self):
        assert is_within_ner(26.1445, 91.7362) is True

    def test_is_within_ner_outside(self):
        assert is_within_ner(28.7041, 77.1025) is False  # New Delhi

    def test_bearing_north(self):
        bearing = bearing_degrees(0.0, 0.0, 1.0, 0.0)
        assert abs(bearing - 0.0) < 1.0

    def test_midpoint(self):
        lat_m, lon_m = midpoint(0.0, 0.0, 2.0, 2.0)
        assert abs(lat_m - 1.0) < 0.1
        assert abs(lon_m - 1.0) < 0.1


# ---------------------------------------------------------------------------
# geojson_utils tests
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


# ---------------------------------------------------------------------------
# road_matching tests
# ---------------------------------------------------------------------------

_SAMPLE_ROADS = [
    {"id": "road-a", "name": "NH-27", "start_lat": 26.14, "start_lng": 91.73, "end_lat": 25.5, "end_lng": 91.9},
    {"id": "road-b", "name": "NH-6",  "start_lat": 25.57, "start_lng": 91.89, "end_lat": 23.0, "end_lng": 92.5},
    {"id": "road-c", "name": "NH-2",  "start_lat": 27.0,  "start_lng": 93.0,  "end_lat": 27.5, "end_lng": 94.0},
]


class TestRoadMatching:
    def test_find_nearest_road_returns_result(self):
        result = find_nearest_road(26.0, 91.8, _SAMPLE_ROADS)
        assert result is not None
        assert result.road_id == "road-a"

    def test_find_nearest_road_beyond_radius_returns_none(self):
        # Query far outside any road
        result = find_nearest_road(15.0, 75.0, _SAMPLE_ROADS, max_distance_km=10.0)
        assert result is None

    def test_associate_incident_road_returns_id(self):
        road_id = associate_incident_road(26.0, 91.8, _SAMPLE_ROADS)
        assert road_id == "road-a"

    def test_roads_sorted_by_proximity_order(self):
        results = roads_sorted_by_proximity(26.0, 91.8, _SAMPLE_ROADS)
        distances = [r.distance_km for r in results]
        assert distances == sorted(distances)

    def test_empty_roads_returns_none(self):
        result = find_nearest_road(26.0, 91.8, [])
        assert result is None


# ---------------------------------------------------------------------------
# hazard_buffer tests
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


# ---------------------------------------------------------------------------
# spatial_queries tests
# ---------------------------------------------------------------------------

class TestSpatialQueries:
    def test_roads_in_bounds(self):
        result = roads_in_bounds(25.0, 27.0, 91.0, 92.5, _SAMPLE_ROADS)
        assert any(r["id"] == "road-a" for r in result)
        assert not any(r["id"] == "road-c" for r in result)

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

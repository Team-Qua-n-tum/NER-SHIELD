# GIS & Geospatial Layer Upgrade

## Overview
This document details the GIS & Geospatial Layer Upgrade for NER-SHIELD, focusing on the live-data oriented backend foundations while preserving backward compatibility with `DEMO_MODE`.

## Work Items Implemented

### 1. Robust Core Coordinates
- Added full WGS84 bounding box validation (`validate_bbox`, `validate_ner_bounds`, `parse_bbox`).
- Implemented rigorous assertions for lat (-90 to 90) and lon (-180 to 180) to prevent silent math errors.
- Introduced `haversine_distance_meters()` alongside the legacy `haversine_distance()`, preserving backward compatibility.
- Implemented robust GeoJSON converters (`coords_to_geojson_point`, `path_to_geojson_linestring`) handling lists of dicts and tuples seamlessly.
- Standardized GeoJSON serializers: `road_to_geojson`, `incident_to_geojson`, `vehicle_to_geojson`, `hazard_to_geojson` ensuring metadata preservation.

### 2. Backward-Compatible Bbox Views
- `roads_in_bounds` now supports both the new 2-argument signature (roads, bbox) and the legacy 5-argument positional signature, ensuring older tests and internal methods do not break.
- Added strict segment intersection testing for bounding box views so roads are matched not just by endpoints.
- Migrated legacy `parse_bbox` calls to the robust `geo_parse_bbox` wrapper for centralized parsing.

### 3. Optional GeoJSON Injection
- Updated API contracts (e.g., `OperationalListResponse`) to include `geojson` as an optional `FeatureCollection`.
- The frontend receives standard lists (`items`), `total`, `freshness`, alongside this optional map-ready standard GeoJSON structure without breaking existing parsers.

### 4. Segment-Accurate Road Matching
- Refactored `find_nearest_road` to accurately calculate distance via intermediate path segments rather than just using endpoints or naive iteration.
- Updated the return contract to return a detailed match dictionary (`road_id`, `distance_meters`, `matched`, `match_method`, `matched_at`).
- Backward-compatible wrappers (`associate_incident_road`, `roads_sorted_by_proximity`) have been maintained.

### 5. Deterministic Hazard Buffer Impact
- Implemented `identify_affected_roads` which generates hazard polygons and identifies infrastructure affected within calculated radii.
- Integrated `DEFAULT_SEVERITY_RADII_KM` and `INCIDENT_TYPE_MODIFIERS`.
- Assigns deterministic risk penalties and suggested statuses for overlapping segments.

### 6. Metadata Preservation
- Explicitly maintained fields like `data_mode`, `source`, `source_updated_at`, `fetched_at`, and `stale` during GeoJSON conversion.
- `DEMO_MODE` integrity preserved. No PostGIS or active database connection is spawned or required for demo flows, unit tests, or CI actions.

### 7. PostGIS Ready
- Established foundational SQL generation interface in `PostGISSpatialRepository`.
- Supports `ST_MakeEnvelope`, `ST_Intersects`, `ST_DWithin`, and `ST_AsGeoJSON` capabilities prepared for the future `live` data mode database binding.

## Testing & Validation
- **Unit Tests:** `test_geospatial.py` fully rewritten, covering WGS84 handling, coordinate utils, spatial queries, and hazard impacts with the new dictionaries logic.
- All geospatial tests passed. All API tests passed.
- **Demo Mode Script:** In-memory validation performed validating no PostgreSQL bindings are leaked into the mock mode environments.

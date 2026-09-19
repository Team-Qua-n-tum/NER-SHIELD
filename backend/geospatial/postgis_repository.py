"""
postgis_repository.py — PostGIS spatial query interface and SQL expressions.

Provides safe, standardized helper constructs for PostgreSQL / PostGIS spatial queries:
  - ST_MakeEnvelope
  - ST_Intersects
  - ST_DWithin
  - ST_Distance
  - ST_AsGeoJSON

Note:
  This module defines the spatial SQL abstraction layer for production/live mode.
  In DEMO_MODE=true, the application uses pure-Python in-memory spatial algorithms
  and does NOT initiate database connections.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.orm import Session


class PostGISSpatialRepository:
    """
    Standardized interface for future PostGIS spatial queries on road, incident,
    and vehicle tables.
    """

    @staticmethod
    def envelope_filter_sql(
        geom_col: str,
        min_lon: float,
        min_lat: float,
        max_lon: float,
        max_lat: float,
        srid: int = 4326,
    ) -> str:
        """
        Generate ST_Intersects(geom, ST_MakeEnvelope(...)) SQL clause.
        """
        return (
            f"ST_Intersects({geom_col}, "
            f"ST_MakeEnvelope({min_lon}, {min_lat}, {max_lon}, {max_lat}, {srid}))"
        )

    @staticmethod
    def dwithin_filter_sql(
        geom_col: str,
        lon: float,
        lat: float,
        distance_meters: float,
        use_spheroid: bool = True,
    ) -> str:
        """
        Generate ST_DWithin clause using geography casting for metric distance.
        """
        cast = "::geography" if use_spheroid else ""
        return (
            f"ST_DWithin({geom_col}{cast}, "
            f"ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326){cast}, "
            f"{distance_meters})"
        )

    @staticmethod
    def distance_meters_sql(
        geom_col: str,
        lon: float,
        lat: float,
    ) -> str:
        """
        Generate ST_Distance clause in meters using geography casting.
        """
        return (
            f"ST_Distance({geom_col}::geography, "
            f"ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)::geography)"
        )

    @staticmethod
    def as_geojson_sql(geom_col: str) -> str:
        """
        Wrap geometry column in ST_AsGeoJSON.
        """
        return f"ST_AsGeoJSON({geom_col})"

    def query_roads_in_bbox(
        self,
        session: Session,
        bbox: Tuple[float, float, float, float],
        table_name: str = "roads",
        geom_col: str = "geometry",
    ) -> List[Dict[str, Any]]:
        """Query road records intersecting a bounding box in PostGIS."""
        min_lon, min_lat, max_lon, max_lat = bbox
        sql = text(
            f"SELECT id, name, code, status, risk_score, "
            f"ST_AsGeoJSON({geom_col}) AS geojson "
            f"FROM {table_name} "
            f"WHERE ST_Intersects({geom_col}, ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326))"
        )
        result = session.execute(
            sql,
            {
                "min_lon": min_lon,
                "min_lat": min_lat,
                "max_lon": max_lon,
                "max_lat": max_lat,
            },
        )
        return [dict(row._mapping) for row in result]

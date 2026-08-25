"""
mock_routing.py — Mock routing provider for demo mode and unit tests.

Uses Haversine straight-line distance and an average NER road speed to
produce plausible but synthetic route estimates. No external API calls.
"""

from __future__ import annotations

from .routing_base import RoutingProvider, RoutingProviderResult
from backend.geospatial.coordinate_utils import haversine_distance

# Average NER road speed accounting for terrain, surface, and traffic
_NER_AVG_SPEED_KMH = 38.0

# Route tortuosity factor: NER mountain roads are ~1.3× longer than straight line
_TORTUOSITY_FACTOR = 1.35


class MockRoutingProvider(RoutingProvider):
    """
    Fake routing provider for demo / test mode.

    Produces straight-line Haversine distances scaled by a tortuosity factor
    appropriate for NER mountain terrain.
    """

    @property
    def name(self) -> str:
        return "Mock (NER Heuristic)"

    def get_route(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
    ) -> RoutingProviderResult:
        straight_km = haversine_distance(origin_lat, origin_lon, dest_lat, dest_lon)
        road_km = round(straight_km * _TORTUOSITY_FACTOR, 2)
        duration_hrs = round(road_km / _NER_AVG_SPEED_KMH, 3)

        # Synthetic midpoint waypoint for map display
        mid_lat = (origin_lat + dest_lat) / 2
        mid_lon = (origin_lon + dest_lon) / 2

        return RoutingProviderResult(
            distance_km=road_km,
            duration_hrs=duration_hrs,
            waypoints=[
                (origin_lat, origin_lon),
                (mid_lat, mid_lon),
                (dest_lat, dest_lon),
            ],
            road_names=["NER Route (estimated)"],
            source="Mock",
            is_estimated=True,
        )

    def is_available(self) -> bool:
        return True

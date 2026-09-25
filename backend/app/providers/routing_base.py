"""
routing_base.py — Abstract routing provider interface.

External routing providers (OSRM, Valhalla, etc.) implement this interface.
MockRoutingProvider is used in demo mode and tests.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional, Tuple


@dataclass
class RoutingProviderResult:
    """Normalised route output from an external routing engine."""
    distance_km: float
    duration_hrs: float
    waypoints: List[Tuple[float, float]] = field(default_factory=list)  # (lat, lon)
    road_names: List[str] = field(default_factory=list)
    source: str = "UNKNOWN"
    is_estimated: bool = True


class RoutingProvider(ABC):
    """Abstract base class for external routing data providers."""

    @abstractmethod
    def get_route(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
    ) -> RoutingProviderResult:
        """
        Compute a route between two geographic points.

        Parameters
        ----------
        origin_lat, origin_lon : Start point (WGS-84).
        dest_lat, dest_lon     : End point (WGS-84).

        Returns
        -------
        RoutingProviderResult
        """

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name."""

    def is_available(self) -> bool:
        """Health-check — always True for mock providers."""
        return True

"""
weather_base.py — Abstract interface for weather data providers.

All implementations must produce a WeatherReading dataclass.
Tests can inject MockWeatherProvider to avoid live API calls.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class WeatherReading:
    """Normalised weather snapshot for a geographic point."""
    lat: float
    lon: float
    rainfall_mm: float = 0.0
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    visibility_km: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction: Optional[str] = None
    condition: str = "CLEAR"                          # CLEAR, RAIN, HEAVY_RAIN, FOG, THUNDERSTORM
    warning_level: str = "NONE"                       # NONE, WATCH, WARNING, EXTREME
    source: str = "UNKNOWN"
    observed_at: datetime = field(default_factory=datetime.utcnow)


class WeatherProvider(ABC):
    """Abstract base class for all weather data providers."""

    @abstractmethod
    def fetch(self, lat: float, lon: float) -> WeatherReading:
        """
        Retrieve the current weather reading for the given WGS-84 coordinates.

        Parameters
        ----------
        lat, lon : Geographic coordinates (WGS-84).

        Returns
        -------
        WeatherReading
        """

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name (e.g. 'Open-Meteo', 'Mock')."""

    def is_available(self) -> bool:
        """
        Quick health check — return True if the provider is reachable.
        Mock providers always return True.
        """
        return True

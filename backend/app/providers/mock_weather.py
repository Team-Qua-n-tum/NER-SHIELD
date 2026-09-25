"""
mock_weather.py — Deterministic mock weather provider for demo mode and tests.

Returns synthetic but geographically plausible NER weather values.
No network calls — safe for unit tests.
"""

from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Optional

from .weather_base import WeatherProvider, WeatherReading


class MockWeatherProvider(WeatherProvider):
    """
    Deterministic fake weather provider.

    Given the same coordinates, always returns the same reading so that
    test assertions remain stable.

    Override with explicit values by passing them to the constructor.
    """

    def __init__(
        self,
        rainfall_mm: float = 12.5,
        condition: str = "RAIN",
        warning_level: str = "NONE",
        temperature_c: float = 24.0,
        humidity_pct: float = 82.0,
    ) -> None:
        self._rainfall_mm = rainfall_mm
        self._condition = condition
        self._warning_level = warning_level
        self._temperature_c = temperature_c
        self._humidity_pct = humidity_pct

    @property
    def name(self) -> str:
        return "Mock"

    def fetch(self, lat: float, lon: float) -> WeatherReading:
        """
        Return a deterministic reading derived from the coordinates.
        The hash ensures the same lat/lon always gives the same rainfall.
        """
        # Deterministic jitter based on coordinate hash (keeps tests stable)
        coord_hash = int(hashlib.md5(f"{lat:.4f},{lon:.4f}".encode()).hexdigest(), 16)
        jitter = (coord_hash % 200) / 10.0  # 0.0 – 20.0 mm jitter

        return WeatherReading(
            lat=lat,
            lon=lon,
            rainfall_mm=round(self._rainfall_mm + jitter, 1),
            temperature_c=self._temperature_c,
            humidity_pct=self._humidity_pct,
            visibility_km=8.0,
            wind_speed_kmh=15.0,
            wind_direction="NE",
            condition=self._condition,
            warning_level=self._warning_level,
            source="Mock",
            observed_at=datetime.utcnow(),
        )

    def is_available(self) -> bool:
        return True

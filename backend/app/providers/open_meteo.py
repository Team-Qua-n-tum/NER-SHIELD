"""
open_meteo.py — Open-Meteo weather provider adapter.

Open-Meteo is a free, no-auth weather API.
This adapter fetches hourly precipitation and current conditions.

Only instantiated when WEATHER_API_URL is configured.
Falls back gracefully if the endpoint is unreachable.

API docs: https://open-meteo.com/en/docs
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Optional
from urllib.request import urlopen, Request
from urllib.error import URLError
import json

from .weather_base import WeatherProvider, WeatherReading
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Condition mapping from WMO weather interpretation codes
_WMO_TO_CONDITION: Dict[int, str] = {
    0: "CLEAR", 1: "CLEAR", 2: "CLEAR",
    3: "CLEAR",
    45: "FOG", 48: "FOG",
    51: "RAIN", 53: "RAIN", 55: "HEAVY_RAIN",
    61: "RAIN", 63: "RAIN", 65: "HEAVY_RAIN",
    71: "RAIN", 73: "RAIN", 75: "HEAVY_RAIN",
    80: "RAIN", 81: "RAIN", 82: "HEAVY_RAIN",
    95: "THUNDERSTORM", 96: "THUNDERSTORM", 99: "THUNDERSTORM",
}

_OPEN_METEO_URL = (
    "{base}?latitude={lat}&longitude={lon}"
    "&hourly=precipitation,weathercode,temperature_2m,relativehumidity_2m"
    "&current_weather=true&forecast_days=1"
)


def _warning_level(rainfall_mm: float) -> str:
    if rainfall_mm >= 200:
        return "EXTREME"
    if rainfall_mm >= 100:
        return "WARNING"
    if rainfall_mm >= 50:
        return "WATCH"
    return "NONE"


class OpenMeteoProvider(WeatherProvider):
    """
    Fetches weather from the Open-Meteo free API.
    Requires WEATHER_API_URL to be set (defaults to the official endpoint).
    No API key needed.
    """

    _BASE_URL = "https://api.open-meteo.com/v1/forecast"

    def __init__(self, timeout_secs: int = 5) -> None:
        self._base = (settings.WEATHER_API_URL or self._BASE_URL).rstrip("/")
        self._timeout = timeout_secs

    @property
    def name(self) -> str:
        return "Open-Meteo"

    def fetch(self, lat: float, lon: float) -> WeatherReading:
        """Fetch the current hourly weather for (lat, lon) from Open-Meteo."""
        url = _OPEN_METEO_URL.format(base=self._base, lat=lat, lon=lon)
        try:
            req = Request(url, headers={"Accept": "application/json"})
            with urlopen(req, timeout=self._timeout) as resp:
                raw: Dict[str, Any] = json.loads(resp.read().decode())
        except URLError as exc:
            logger.warning("[OpenMeteo] Fetch failed for (%.4f, %.4f): %s", lat, lon, exc)
            raise RuntimeError(f"OpenMeteo unavailable: {exc}") from exc

        return self._parse(lat, lon, raw)

    @staticmethod
    def _parse(lat: float, lon: float, raw: Dict[str, Any]) -> WeatherReading:
        hourly = raw.get("hourly", {})
        precipitation = hourly.get("precipitation", [0.0])
        weathercodes = hourly.get("weathercode", [0])
        temps = hourly.get("temperature_2m", [None])
        humidity = hourly.get("relativehumidity_2m", [None])

        # Sum the first 24 hourly values for 24h rainfall
        daily_rainfall = sum(float(p) for p in precipitation[:24] if p is not None)
        code = int(weathercodes[0]) if weathercodes else 0
        condition = _WMO_TO_CONDITION.get(code, "CLEAR")

        return WeatherReading(
            lat=lat,
            lon=lon,
            rainfall_mm=round(daily_rainfall, 1),
            temperature_c=float(temps[0]) if temps and temps[0] is not None else None,
            humidity_pct=float(humidity[0]) if humidity and humidity[0] is not None else None,
            condition=condition,
            warning_level=_warning_level(daily_rainfall),
            source="Open-Meteo",
            observed_at=datetime.utcnow(),
        )

    def is_available(self) -> bool:
        try:
            req = Request(
                f"{self._base}?latitude=26.1&longitude=91.7&current_weather=true",
                headers={"Accept": "application/json"},
            )
            with urlopen(req, timeout=3):
                return True
        except URLError:
            return False

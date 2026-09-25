"""
backend/app/providers/__init__.py
External data provider interfaces and implementations.
"""
from .weather_base import WeatherProvider, WeatherReading
from .mock_weather import MockWeatherProvider
from .routing_base import RoutingProvider, RoutingProviderResult
from .mock_routing import MockRoutingProvider

__all__ = [
    "WeatherProvider",
    "WeatherReading",
    "MockWeatherProvider",
    "RoutingProvider",
    "RoutingProviderResult",
    "MockRoutingProvider",
]

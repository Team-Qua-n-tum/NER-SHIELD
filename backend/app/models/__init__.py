"""
backend/app/models/__init__.py
Exports all ORM models for easy import.
"""

from .base import Base, GeometryOrText, TimestampMixin, new_uuid
from .road import Road
from .incident import Incident
from .vehicle import Vehicle
from .weather import WeatherObservation
from .risk import RiskRecord
from .route import RouteRecord
from .notification import NotificationDevice

__all__ = [
    "Base",
    "GeometryOrText",
    "TimestampMixin",
    "new_uuid",
    "Road",
    "Incident",
    "Vehicle",
    "WeatherObservation",
    "RiskRecord",
    "RouteRecord",
    "NotificationDevice",
]

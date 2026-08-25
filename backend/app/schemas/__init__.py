"""backend/app/schemas package."""

from backend.app.schemas.alert import AlertCreate, AlertListResponse, AlertResponse
from backend.app.schemas.dashboard import CorridorSummary, DashboardSummaryResponse
from backend.app.schemas.district import Coordinates, DistrictBase, DistrictListResponse, DistrictResponse
from backend.app.schemas.health import HealthResponse
from backend.app.schemas.incident import IncidentCreate, IncidentListResponse, IncidentResponse, IncidentStatusUpdate
from backend.app.schemas.risk import RiskPredictionRequest, RiskPredictionResponse
from backend.app.schemas.road import GeoPoint, RoadBase, RoadListResponse, RoadResponse, RoadStatusUpdate
from backend.app.schemas.route import RouteConstraints, RouteOption, RoutePoint, RouteRequest, RouteResponse
from backend.app.schemas.vehicle import VehicleCreate, VehicleListResponse, VehicleLocationUpdate, VehicleResponse

__all__ = [
    "HealthResponse",
    "Coordinates",
    "DistrictBase",
    "DistrictResponse",
    "DistrictListResponse",
    "GeoPoint",
    "RoadBase",
    "RoadResponse",
    "RoadListResponse",
    "RoadStatusUpdate",
    "IncidentCreate",
    "IncidentResponse",
    "IncidentStatusUpdate",
    "IncidentListResponse",
    "VehicleCreate",
    "VehicleResponse",
    "VehicleLocationUpdate",
    "VehicleListResponse",
    "RiskPredictionRequest",
    "RiskPredictionResponse",
    "RouteConstraints",
    "RoutePoint",
    "RouteOption",
    "RouteRequest",
    "RouteResponse",
    "AlertCreate",
    "AlertResponse",
    "AlertListResponse",
    "CorridorSummary",
    "DashboardSummaryResponse",
]

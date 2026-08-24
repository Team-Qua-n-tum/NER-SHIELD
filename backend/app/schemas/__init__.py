from backend.app.schemas.health import HealthResponse
from backend.app.schemas.district import DistrictResponse, DistrictListResponse, DistrictBase, Coordinates
from backend.app.schemas.road import RoadResponse, RoadListResponse, RoadStatusUpdate, RoadBase, GeoPoint
from backend.app.schemas.incident import IncidentCreate, IncidentResponse, IncidentStatusUpdate, IncidentListResponse
from backend.app.schemas.vehicle import VehicleCreate, VehicleResponse, VehicleLocationUpdate, VehicleListResponse
from backend.app.schemas.risk import RiskPredictionRequest, RiskPredictionResponse
from backend.app.schemas.route import RouteRequest, RouteResponse, RouteOption, RouteConstraints, RoutePoint
from backend.app.schemas.alert import AlertCreate, AlertResponse, AlertListResponse
from backend.app.schemas.dashboard import DashboardSummaryResponse, CorridorSummary

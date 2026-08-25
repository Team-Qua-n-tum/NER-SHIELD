from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    health,
    districts,
    roads,
    incidents,
    vehicles,
    risk,
    routes,
    alerts,
    dashboard
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(districts.router, tags=["Districts"])
api_router.include_router(roads.router, tags=["Roads"])
api_router.include_router(incidents.router, tags=["Incidents"])
api_router.include_router(vehicles.router, tags=["Vehicles"])
api_router.include_router(risk.router, tags=["AI Risk Engine"])
api_router.include_router(routes.router, tags=["Routing Engine"])
api_router.include_router(alerts.router, tags=["Alerts"])
api_router.include_router(dashboard.router, tags=["Dashboard"])

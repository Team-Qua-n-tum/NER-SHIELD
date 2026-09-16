from fastapi import APIRouter
from backend.app.schemas.health import HealthResponse
from backend.app.core.config import settings
from backend.app.services.operational_service import operational_service
from datetime import datetime, timezone

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"], summary="Service health check")
def health_check():
    """Returns service health, version, and readiness of AI and routing subsystems."""
    system = operational_service.system_status()
    return HealthResponse(
        status=system.status,
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc),
        database_connected=system.database_status in {"connected", "not_required"},
        ai_engine_ready=True,
        routing_engine_ready=True,
        demo_mode=settings.DEMO_MODE,
        app_version=system.app_version,
        environment=system.environment,
        data_mode=system.data_mode,
        database_status=system.database_status,
        weather_provider_status=system.weather_provider_status,
        routing_provider_status=system.routing_provider_status,
        last_refresh_at=system.last_refresh_at,
    )

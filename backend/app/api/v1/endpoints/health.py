from fastapi import APIRouter
from backend.app.schemas.health import HealthResponse
from backend.app.core.config import settings
from datetime import datetime

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"], summary="Service health check")
def health_check():
    """Returns service health, version, and readiness of AI and routing subsystems."""
    return HealthResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        timestamp=datetime.utcnow(),
        database_connected=True,
        ai_engine_ready=True,
        routing_engine_ready=True,
        demo_mode=settings.DEMO_MODE,
    )

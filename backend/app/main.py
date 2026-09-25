import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.v1.api import api_router
from backend.app.schemas.health import HealthResponse
from backend.app.services.operational_service import operational_service
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ner_shield")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API V1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
async def _startup() -> None:
    settings.log_summary()
    logger.info(
        "NER-SHIELD API started | demo_mode=%s | cors_origins=%s",
        settings.DEMO_MODE,
        len(settings.BACKEND_CORS_ORIGINS),
    )


# Root level health endpoint for convenience (no prefix collision)
@app.get("/health", response_model=HealthResponse, tags=["Health"])
def root_health():
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
    )

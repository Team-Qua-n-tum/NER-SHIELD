from fastapi import APIRouter
from backend.app.schemas.health import HealthResponse
from datetime import datetime

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["Health"])
@router.get("/api/v1/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    return HealthResponse(
        status="ok",
        service="NER-SHIELD Logistics API",
        version="1.0.0",
        timestamp=datetime.utcnow(),
        database_connected=True,
        ai_engine_ready=True,
        routing_engine_ready=True
    )

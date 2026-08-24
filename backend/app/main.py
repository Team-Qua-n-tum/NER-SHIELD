from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.v1.api import api_router
from backend.app.schemas.health import HealthResponse
from datetime import datetime

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
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

# Root level health endpoint for convenience
@app.get("/health", response_model=HealthResponse, tags=["Health"])
def root_health():
    return HealthResponse(
        status="ok",
        service="NER-SHIELD API Core",
        version=settings.VERSION,
        timestamp=datetime.utcnow(),
        database_connected=True,
        ai_engine_ready=True,
        routing_engine_ready=True
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

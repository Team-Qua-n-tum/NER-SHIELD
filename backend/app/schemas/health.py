from pydantic import BaseModel, Field
from datetime import datetime


class HealthResponse(BaseModel):
    status: str = Field("ok", description="Service status indicator")
    service: str = Field("NER-SHIELD API", description="Service name")
    version: str = Field("1.0.0", description="API version")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Current UTC timestamp")
    database_connected: bool = Field(True, description="Database connection status flag")
    ai_engine_ready: bool = Field(True, description="AI disruption risk engine status")
    routing_engine_ready: bool = Field(True, description="GIS routing engine status")
    demo_mode: bool = Field(True, description="True when running with synthetic demo data")
    app_version: str = Field("1.0.0", description="Application version")
    environment: str = Field("development", description="Application environment")
    data_mode: str = Field("demo", description="demo, live, or degraded")
    database_status: str = Field("not_required", description="Database readiness")
    weather_provider_status: str = Field("available", description="Weather provider readiness")
    routing_provider_status: str = Field("configured", description="Routing provider readiness")
    last_refresh_at: datetime | None = None

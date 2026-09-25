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

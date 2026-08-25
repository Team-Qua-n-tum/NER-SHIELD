from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "NER-SHIELD Backend API"
    PROJECT_DESCRIPTION: str = "AI-Based Smart Logistics & Accessibility Intelligence Platform for North Eastern Region (NER)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # Database
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL", "postgresql://ner_user:ner_password@localhost:5432/ner_shield")
    USE_IN_MEMORY_DB: bool = True
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

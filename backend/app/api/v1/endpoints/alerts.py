from fastapi import APIRouter, status
from backend.app.schemas.alert import AlertCreate, AlertResponse, AlertListResponse
from backend.app.services.logistics_service import logistics_service

router = APIRouter()

@router.get("/alerts", response_model=AlertListResponse, summary="Get all active emergency alerts")
def get_alerts():
    return logistics_service.get_all_alerts()

@router.post("/alerts", response_model=AlertResponse, status_code=201, summary="Create emergency alert broadcast")
def create_alert(data: AlertCreate):
    return logistics_service.create_alert(data)

from fastapi import APIRouter
from backend.app.schemas.dashboard import DashboardSummaryResponse
from backend.app.services.logistics_service import logistics_service

router = APIRouter()

@router.get("/dashboard", response_model=DashboardSummaryResponse, summary="Get aggregated logistics intelligence dashboard summary")
def get_dashboard_summary():
    return logistics_service.get_dashboard_summary()

from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.incident import IncidentCreate, IncidentResponse, IncidentListResponse
from backend.app.services.logistics_service import logistics_service

router = APIRouter()

@router.get("/incidents", response_model=IncidentListResponse, summary="List all field incidents")
def get_incidents():
    return logistics_service.get_all_incidents()

@router.post("/incidents", response_model=IncidentResponse, status_code=status.HTTP_210_CREATED if hasattr(status, "HTTP_210_CREATED") else 201, summary="Report a field incident")
def report_incident(data: IncidentCreate):
    return logistics_service.create_incident(data)

@router.get("/incidents/{incident_id}", response_model=IncidentResponse, summary="Get incident details")
def get_incident(incident_id: str):
    incident = logistics_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return incident

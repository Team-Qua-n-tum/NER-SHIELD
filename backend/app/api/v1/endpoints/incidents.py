from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.incident import (
    IncidentCreate,
    IncidentResponse,
    IncidentListResponse,
    IncidentStatusUpdate,
)
from backend.app.services.logistics_service import logistics_service

router = APIRouter()


@router.get(
    "/incidents",
    response_model=IncidentListResponse,
    summary="List all field incidents",
)
def get_incidents():
    """Return all active and historical field incidents across the NER network."""
    return logistics_service.get_all_incidents()


@router.post(
    "/incidents",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report a field incident",
)
def report_incident(data: IncidentCreate):
    """Submit a geo-tagged field incident report (landslide, flood, road block, etc.)."""
    return logistics_service.create_incident(data)


@router.get(
    "/incidents/{incident_id}",
    response_model=IncidentResponse,
    summary="Get incident details",
)
def get_incident(incident_id: str):
    """Retrieve a specific incident by its unique ID."""
    incident = logistics_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(
            status_code=404,
            detail=f"Incident '{incident_id}' not found.",
        )
    return incident


@router.patch(
    "/incidents/{incident_id}/status",
    response_model=IncidentResponse,
    summary="Update incident status",
)
def update_incident_status(incident_id: str, update: IncidentStatusUpdate):
    """Update the operational status of an incident (e.g., ACTIVE → IN_PROGRESS → RESOLVED)."""
    updated = logistics_service.update_incident_status(incident_id, update)
    if not updated:
        raise HTTPException(
            status_code=404,
            detail=f"Incident '{incident_id}' not found.",
        )
    return updated

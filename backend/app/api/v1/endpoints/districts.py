from fastapi import APIRouter, HTTPException
from backend.app.schemas.district import DistrictResponse, DistrictListResponse
from backend.app.services.logistics_service import logistics_service

router = APIRouter()

@router.get("/districts", response_model=DistrictListResponse, summary="Get all districts monitored")
def get_districts():
    return logistics_service.get_all_districts()

@router.get("/districts/{district_id}", response_model=DistrictResponse, summary="Get specific district details")
def get_district(district_id: str):
    district = logistics_service.get_district(district_id)
    if not district:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found.")
    return district

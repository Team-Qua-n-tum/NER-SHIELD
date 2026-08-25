from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.vehicle import VehicleCreate, VehicleResponse, VehicleListResponse, VehicleLocationUpdate
from backend.app.services.logistics_service import logistics_service

router = APIRouter()

@router.get("/vehicles", response_model=VehicleListResponse, summary="List all logistics vehicles")
def get_vehicles():
    return logistics_service.get_all_vehicles()

@router.post("/vehicles", response_model=VehicleResponse, status_code=201, summary="Register a vehicle for tracking")
def register_vehicle(data: VehicleCreate):
    return logistics_service.create_vehicle(data)

@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse, summary="Get vehicle details")
def get_vehicle(vehicle_id: str):
    vehicle = logistics_service.get_vehicle(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' not found.")
    return vehicle

@router.patch("/vehicles/{vehicle_id}/location", response_model=VehicleResponse, summary="Update vehicle GPS location")
def update_vehicle_location(vehicle_id: str, update: VehicleLocationUpdate):
    updated = logistics_service.update_vehicle_location(vehicle_id, update)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' not found.")
    return updated

from fastapi import APIRouter, HTTPException
from backend.app.schemas.road import RoadResponse, RoadListResponse, RoadStatusUpdate
from backend.app.services.logistics_service import logistics_service

router = APIRouter()

@router.get("/roads", response_model=RoadListResponse, summary="Get all road corridors")
def get_roads():
    return logistics_service.get_all_roads()

@router.get("/roads/{road_id}", response_model=RoadResponse, summary="Get road corridor details")
def get_road(road_id: str):
    road = logistics_service.get_road(road_id)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road '{road_id}' not found.")
    return road

@router.patch("/roads/{road_id}/status", response_model=RoadResponse, summary="Update road operational status")
def update_road_status(road_id: str, update: RoadStatusUpdate):
    updated_road = logistics_service.update_road_status(road_id, update)
    if not updated_road:
        raise HTTPException(status_code=404, detail=f"Road '{road_id}' not found.")
    return updated_road

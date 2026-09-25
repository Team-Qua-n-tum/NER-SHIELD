from fastapi import APIRouter, HTTPException
from backend.app.schemas.route import RouteRequest, RouteResponse
from backend.app.services.routing_service import routing_service

router = APIRouter()

@router.post("/routes/recommend", response_model=RouteResponse, summary="Recommend risk-aware routes via routing engine")
def recommend_route(request: RouteRequest):
    try:
        return routing_service.recommend_route(request)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))

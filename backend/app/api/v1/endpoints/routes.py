from fastapi import APIRouter, HTTPException
from backend.app.schemas.route import RouteRequest, RouteResponse
from backend.app.services.routing_service import routing_service

router = APIRouter()


def _handle_route_request(request: RouteRequest) -> RouteResponse:
    """Shared handler for both route endpoints."""
    try:
        return routing_service.recommend_route(request)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@router.post(
    "/routes/recommend",
    response_model=RouteResponse,
    summary="Recommend risk-aware routes via routing engine",
)
def recommend_route(request: RouteRequest):
    """Compute the safest, most efficient route for a commodity shipment."""
    return _handle_route_request(request)


@router.post(
    "/routes/plan",
    response_model=RouteResponse,
    summary="Plan a logistics route (alias for /routes/recommend)",
)
def plan_route(request: RouteRequest):
    """
    Plan a logistics route with risk-aware Dijkstra optimization.
    Alias for POST /routes/recommend — included for spec compliance.
    """
    return _handle_route_request(request)

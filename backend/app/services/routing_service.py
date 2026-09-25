from backend.routing.engine import routing_engine
from backend.app.schemas.route import RouteRequest, RouteResponse

class RoutingService:
    @staticmethod
    def recommend_route(request: RouteRequest) -> RouteResponse:
        raw_result = routing_engine.find_route(
            source_id=request.source_district,
            destination_id=request.destination_district,
            commodity=request.commodity,
            avoid_high_risk=request.constraints.avoid_high_risk,
            vehicle_type=request.constraints.vehicle_type or "TRUCK"
        )
        return RouteResponse(**raw_result)

routing_service = RoutingService()

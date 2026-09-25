"""
Tests for ETA computation engine.
Validates travel time estimation under various surface conditions, traffic, and disruption risk levels.
"""

import pytest
from backend.routing.models import (
    Node,
    Edge,
    RoadStatus,
    RoadCondition,
    CommodityPriority,
    RouteRequest,
)
from backend.routing.graph import RoadNetwork
from backend.routing.service import RoutingService


@pytest.fixture
def eta_sample_network():
    network = RoadNetwork()
    network.add_node(Node(id="P1", name="Jorhat", lat=26.75, lon=94.22))
    network.add_node(Node(id="P2", name="Majuli Crossing", lat=26.90, lon=94.17))

    # 50 km road segment, 50 km/h speed limit -> Base time = 1.0 hour
    # Road condition: POOR (speed factor = 0.50) -> Effective speed = 25 km/h -> Surface time = 2.0 hours
    network.add_edge(
        Edge(
            id="E_JOR_MAJ",
            source="P1",
            target="P2",
            distance_km=50.0,
            speed_limit_kmh=50.0,
            disruption_risk=0.40,
            road_condition=RoadCondition.POOR,
        )
    )
    return network


def test_eta_calculation_components(eta_sample_network):
    service = RoutingService(network=eta_sample_network)
    request = RouteRequest(
        source_id="P1",
        destination_id="P2",
        commodity=CommodityPriority.MEDICINE,
        traffic_factor=1.25,  # 25% traffic slowdown
    )

    response = service.plan_route(request)
    assert response.recommended is not None

    eta_breakdown = service.eta_engine.compute_route_eta(
        route=response.recommended,
        commodity=request.commodity,
        traffic_factor=request.traffic_factor,
    )

    assert eta_breakdown["is_prototype_estimate"] is True
    assert eta_breakdown["base_travel_time_hrs"] == 1.0
    assert eta_breakdown["surface_delay_hrs"] == 1.0  # 2.0h - 1.0h = 1.0h delay due to POOR surface
    assert eta_breakdown["traffic_delay_hrs"] > 0.0
    assert eta_breakdown["disruption_risk_buffer_hrs"] > 0.0
    assert eta_breakdown["total_eta_hrs"] > 2.0
    assert response.estimated_travel_time_hrs == eta_breakdown["total_eta_hrs"]

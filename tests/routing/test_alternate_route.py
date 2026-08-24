"""
Tests for alternate route generation and rationale selection.
"""

import pytest
from backend.routing.models import Node, Edge, CommodityPriority, RouteRequest
from backend.routing.graph import RoadNetwork
from backend.routing.service import RoutingService


@pytest.fixture
def dual_corridor_network():
    network = RoadNetwork()
    network.add_node(Node(id="S", name="Source Node", lat=26.0, lon=91.0))
    network.add_node(Node(id="C1", name="Corridor 1 Mid", lat=26.1, lon=91.1))
    network.add_node(Node(id="C2", name="Corridor 2 Mid", lat=25.9, lon=91.2))
    network.add_node(Node(id="D", name="Dest Node", lat=26.2, lon=91.3))

    # Corridor 1 (Recommended - Low Risk, slightly longer)
    network.add_edge(Edge(id="E1_1", source="S", target="C1", distance_km=25.0, speed_limit_kmh=50.0, disruption_risk=0.10))
    network.add_edge(Edge(id="E1_2", source="C1", target="D", distance_km=25.0, speed_limit_kmh=50.0, disruption_risk=0.10))

    # Corridor 2 (Alternate - Higher Risk, slightly shorter)
    network.add_edge(Edge(id="E2_1", source="S", target="C2", distance_km=22.0, speed_limit_kmh=50.0, disruption_risk=0.65))
    network.add_edge(Edge(id="E2_2", source="C2", target="D", distance_km=22.0, speed_limit_kmh=50.0, disruption_risk=0.65))

    return network


def test_alternate_route_generation(dual_corridor_network):
    service = RoutingService(network=dual_corridor_network)
    request = RouteRequest(source_id="S", destination_id="D", commodity=CommodityPriority.MEDICINE)
    response = service.plan_route(request)

    assert response.recommended is not None
    assert response.alternate is not None

    # Primary should be Corridor 1
    assert response.recommended.path_nodes == ["S", "C1", "D"]
    # Alternate should be Corridor 2
    assert response.alternate.path_nodes == ["S", "C2", "D"]

    # Reason should explain the risk tradeoff
    assert "reason" in response.to_dict()
    assert len(response.reason) > 0
    assert response.recommended.average_risk < response.alternate.average_risk

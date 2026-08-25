"""
Tests for handling blocked roads and dynamic re-routing.
"""

import pytest
from backend.routing.models import Node, Edge, RoadStatus, CommodityPriority, RouteRequest
from backend.routing.graph import RoadNetwork
from backend.routing.service import RoutingService


@pytest.fixture
def blocked_road_network():
    network = RoadNetwork()
    network.add_node(Node(id="X", name="Tezpur", lat=26.63, lon=92.80))
    network.add_node(Node(id="Y_BRIDGE", name="Kolia Bhomora Bridge", lat=26.61, lon=92.85))
    network.add_node(Node(id="Y_ALT", name="Northern Bypass", lat=26.70, lon=92.90))
    network.add_node(Node(id="Z", name="Nagaon", lat=26.35, lon=92.68))

    # Primary Bridge Route
    network.add_edge(
        Edge(
            id="E_BRIDGE_1",
            source="X",
            target="Y_BRIDGE",
            distance_km=15.0,
            speed_limit_kmh=60.0,
            disruption_risk=0.1,
        )
    )
    network.add_edge(
        Edge(
            id="E_BRIDGE_2",
            source="Y_BRIDGE",
            target="Z",
            distance_km=20.0,
            speed_limit_kmh=60.0,
            disruption_risk=0.1,
        )
    )

    # Alternate Bypass Route
    network.add_edge(
        Edge(
            id="E_ALT_1",
            source="X",
            target="Y_ALT",
            distance_km=30.0,
            speed_limit_kmh=50.0,
            disruption_risk=0.05,
        )
    )
    network.add_edge(
        Edge(
            id="E_ALT_2",
            source="Y_ALT",
            target="Z",
            distance_km=35.0,
            speed_limit_kmh=50.0,
            disruption_risk=0.05,
        )
    )

    return network


def test_routing_with_open_roads(blocked_road_network):
    service = RoutingService(network=blocked_road_network)
    response = service.plan_route(RouteRequest(source_id="X", destination_id="Z"))

    assert response.recommended is not None
    assert response.recommended.path_nodes == ["X", "Y_BRIDGE", "Z"]


def test_dynamic_road_blockage_rerouting(blocked_road_network):
    service = RoutingService(network=blocked_road_network)

    # Simulate landslide / bridge damage blocking Kolia Bhomora Bridge
    service.update_road_telemetry("E_BRIDGE_1", status=RoadStatus.BLOCKED)

    response = service.plan_route(RouteRequest(source_id="X", destination_id="Z"))

    assert response.recommended is not None
    # System MUST bypass blocked segment and route via Y_ALT
    assert response.recommended.path_nodes == ["X", "Y_ALT", "Z"]
    assert "Y_BRIDGE" not in response.recommended.path_nodes
    assert response.recommended.total_distance_km == 65.0

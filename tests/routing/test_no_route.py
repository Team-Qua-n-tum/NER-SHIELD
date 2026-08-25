"""
Tests for handling no-route conditions (disconnected graphs, invalid nodes, fully blocked networks).
"""

import pytest
from backend.routing.models import Node, Edge, RoadStatus, RouteRequest
from backend.routing.graph import RoadNetwork
from backend.routing.service import RoutingService


def test_disconnected_network_no_route():
    network = RoadNetwork()
    network.add_node(Node(id="ISLAND_A", name="Isolated Island A", lat=26.0, lon=91.0))
    network.add_node(Node(id="ISLAND_B", name="Isolated Island B", lat=27.0, lon=92.0))

    service = RoutingService(network=network)
    response = service.plan_route(RouteRequest(source_id="ISLAND_A", destination_id="ISLAND_B"))

    assert response.recommended is None
    assert response.alternate is None
    assert response.risk_level == "SEVERE"
    assert "no viable route" in response.reason.lower()


def test_fully_blocked_corridor():
    network = RoadNetwork()
    network.add_node(Node(id="U1", name="Node 1", lat=26.0, lon=91.0))
    network.add_node(Node(id="U2", name="Node 2", lat=26.1, lon=91.1))
    edge = Edge(id="E12", source="U1", target="U2", distance_km=10.0, speed_limit_kmh=40.0, disruption_risk=0.9)
    network.add_edge(edge)

    # Block the edge
    network.update_edge_status("E12", RoadStatus.BLOCKED)

    service = RoutingService(network=network)
    response = service.plan_route(RouteRequest(source_id="U1", destination_id="U2"))

    assert response.recommended is None
    assert "no viable route" in response.reason.lower()


def test_invalid_node_error_handling():
    service = RoutingService()
    response = service.plan_route(RouteRequest(source_id="NON_EXISTENT_1", destination_id="NON_EXISTENT_2"))

    assert response.recommended is None
    assert "does not exist" in response.reason.lower()

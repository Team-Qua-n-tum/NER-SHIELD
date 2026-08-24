"""
Tests for RoadNetwork graph data structure.
"""

import pytest
from backend.routing.models import Node, Edge, RoadStatus, RoadCondition
from backend.routing.graph import RoadNetwork


def test_road_network_initialization():
    network = RoadNetwork()
    node_a = Node(id="N1", name="Guwahati", lat=26.1445, lon=91.7362, district="Kamrup")
    node_b = Node(id="N2", name="Shillong", lat=25.5788, lon=91.8933, district="East Khasi Hills")

    network.add_node(node_a)
    network.add_node(node_b)

    edge = Edge(
        id="E1",
        source="N1",
        target="N2",
        distance_km=100.0,
        speed_limit_kmh=40.0,
        disruption_risk=0.1,
        status=RoadStatus.OPEN,
        road_condition=RoadCondition.GOOD,
        name="NH6 Guwahati-Shillong",
        is_bidirectional=True,
    )
    network.add_edge(edge)

    assert len(network.nodes) == 2
    assert network.get_node("N1").name == "Guwahati"
    assert len(network.get_neighbors("N1")) == 1
    assert len(network.get_neighbors("N2")) == 1  # Due to bidirectional property


def test_dynamic_status_and_risk_updates():
    network = RoadNetwork()
    network.add_node(Node(id="N1", name="Guwahati", lat=26.14, lon=91.73))
    network.add_node(Node(id="N2", name="Dispur", lat=26.15, lon=91.78))

    edge = Edge(
        id="E1",
        source="N1",
        target="N2",
        distance_km=10.0,
        speed_limit_kmh=50.0,
        disruption_risk=0.2,
        is_bidirectional=True,
    )
    network.add_edge(edge)

    # Update status to BLOCKED
    assert network.update_edge_status("E1", RoadStatus.BLOCKED)
    assert network.get_edge("E1").status == RoadStatus.BLOCKED
    assert network.get_edge("E1_rev").status == RoadStatus.BLOCKED

    # Update risk to 0.85
    assert network.update_edge_risk("E1", 0.85)
    assert network.get_edge("E1").disruption_risk == 0.85
    assert network.get_edge("E1_rev").disruption_risk == 0.85


def test_serialization():
    network = RoadNetwork()
    network.add_node(Node(id="A", name="Node A", lat=25.0, lon=90.0))
    network.add_node(Node(id="B", name="Node B", lat=25.1, lon=90.1))
    network.add_edge(
        Edge(
            id="E_AB",
            source="A",
            target="B",
            distance_km=15.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.05,
        )
    )

    data = network.to_dict()
    reconstructed = RoadNetwork.from_dict(data)

    assert len(reconstructed.nodes) == 2
    assert reconstructed.get_node("A").name == "Node A"
    assert reconstructed.get_edge("E_AB").distance_km == 15.0

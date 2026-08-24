"""
Tests demonstrating risk-aware route scoring vs traditional shortest distance routing.
Validates the CORE IDEA:
  Route A: 100 km, 2.5 hours, HIGH disruption risk (0.80)
  Route B: 115 km, 3.0 hours, LOW disruption risk (0.05)
For essential goods (MEDICINE), Route B must be selected over Route A.
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
def sample_risk_network():
    network = RoadNetwork()

    # Nodes: Start (Guwahati), Corridor Node A (High Risk Pass), Corridor Node B (Safe Valley), End (Silchar)
    network.add_node(Node(id="N_START", name="Guwahati", lat=26.14, lon=91.73, district="Kamrup"))
    network.add_node(Node(id="N_MID_A", name="Shillong Pass (High Risk)", lat=25.57, lon=91.89, district="East Khasi Hills"))
    network.add_node(Node(id="N_MID_B", name="Nagaon Bypass (Low Risk)", lat=26.30, lon=92.68, district="Nagaon"))
    network.add_node(Node(id="N_END", name="Silchar", lat=24.83, lon=92.77, district="Cachar"))

    # Route A (Shortest distance 100 km, 2.5 hours, HIGH disruption risk = 0.80)
    network.add_edge(
        Edge(
            id="E_START_A",
            source="N_START",
            target="N_MID_A",
            distance_km=50.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.80,
            road_condition=RoadCondition.POOR,
            landslide_prone=True,
        )
    )
    network.add_edge(
        Edge(
            id="E_A_END",
            source="N_MID_A",
            target="N_END",
            distance_km=50.0,
            speed_limit_kmh=40.0,
            disruption_risk=0.80,
            road_condition=RoadCondition.POOR,
            landslide_prone=True,
        )
    )

    # Route B (Longer distance 115 km, 3.0 hours, LOW disruption risk = 0.05)
    network.add_edge(
        Edge(
            id="E_START_B",
            source="N_START",
            target="N_MID_B",
            distance_km=60.0,
            speed_limit_kmh=50.0,
            disruption_risk=0.05,
            road_condition=RoadCondition.GOOD,
        )
    )
    network.add_edge(
        Edge(
            id="E_B_END",
            source="N_MID_B",
            target="N_END",
            distance_km=55.0,
            speed_limit_kmh=50.0,
            disruption_risk=0.05,
            road_condition=RoadCondition.GOOD,
        )
    )

    return network


def test_shortest_distance_vs_risk_aware_routing(sample_risk_network):
    service = RoutingService(network=sample_risk_network)

    # 1. Pure Shortest Distance Route (Benchmark)
    shortest_res = service.optimizer.find_shortest_distance_route("N_START", "N_END")
    assert shortest_res is not None
    assert shortest_res.total_distance_km == 100.0  # Route A selected on pure distance
    assert shortest_res.path_nodes == ["N_START", "N_MID_A", "N_END"]
    assert shortest_res.average_risk == 0.80

    # 2. Risk-Aware Route for MEDICINE (NER-SHIELD)
    req_medicine = RouteRequest(
        source_id="N_START",
        destination_id="N_END",
        commodity=CommodityPriority.MEDICINE,
    )
    response_med = service.plan_route(req_medicine)

    assert response_med.recommended is not None
    # For essential medicine, system MUST choose Route B (via N_MID_B) due to low risk!
    assert response_med.recommended.path_nodes == ["N_START", "N_MID_B", "N_END"]
    assert response_med.recommended.total_distance_km == 115.0
    assert response_med.recommended.average_risk == 0.05
    assert response_med.risk_level == "LOW"
    assert "lower disruption risk" in response_med.reason.lower()


def test_cost_function_weights():
    # Verify cost function formula behavior
    edge_high_risk = Edge(
        id="E_HIGH",
        source="A",
        target="B",
        distance_km=50.0,
        speed_limit_kmh=50.0,
        disruption_risk=0.90,
    )
    edge_low_risk = Edge(
        id="E_LOW",
        source="A",
        target="C",
        distance_km=60.0,
        speed_limit_kmh=50.0,
        disruption_risk=0.05,
    )

    service = RoutingService()
    cost_med_high = service.cost_fn.calculate_edge_cost(edge_high_risk, CommodityPriority.MEDICINE)
    cost_med_low = service.cost_fn.calculate_edge_cost(edge_low_risk, CommodityPriority.MEDICINE)

    # Cost for high-risk route under MEDICINE must be dramatically higher than low-risk route
    assert cost_med_high > cost_med_low

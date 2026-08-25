"""
Tests for commodity prioritization in route selection.
Ensures emergency/essential commodities (MEDICINE, FOOD) receive higher risk penalty scaling
compared to standard cargo (GENERAL, CONSTRUCTION).
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
def commodity_network():
    network = RoadNetwork()
    network.add_node(Node(id="A", name="Depot A", lat=26.0, lon=91.0))
    network.add_node(Node(id="B_MODERATE", name="Moderate Risk Short Cut", lat=26.1, lon=91.1))
    network.add_node(Node(id="B_SAFE", name="Safe Long Detour", lat=25.9, lon=91.2))
    network.add_node(Node(id="C", name="Hospital C", lat=26.2, lon=91.3))

    # Moderate Risk Short Cut: 40 km, disruption risk 0.10
    network.add_edge(
        Edge(
            id="E_MOD_1",
            source="A",
            target="B_MODERATE",
            distance_km=20.0,
            speed_limit_kmh=50.0,
            disruption_risk=0.10,
            road_condition=RoadCondition.EXCELLENT,
        )
    )
    network.add_edge(
        Edge(
            id="E_MOD_2",
            source="B_MODERATE",
            target="C",
            distance_km=20.0,
            speed_limit_kmh=50.0,
            disruption_risk=0.10,
            road_condition=RoadCondition.EXCELLENT,
        )
    )

    # Safe Long Detour: 80 km, disruption risk 0.01
    network.add_edge(
        Edge(
            id="E_SAFE_1",
            source="A",
            target="B_SAFE",
            distance_km=40.0,
            speed_limit_kmh=60.0,
            disruption_risk=0.01,
            road_condition=RoadCondition.EXCELLENT,
        )
    )
    network.add_edge(
        Edge(
            id="E_SAFE_2",
            source="B_SAFE",
            target="C",
            distance_km=40.0,
            speed_limit_kmh=60.0,
            disruption_risk=0.01,
            road_condition=RoadCondition.EXCELLENT,
        )
    )

    return network


def test_commodity_priority_routing_differences(commodity_network):
    service = RoutingService(network=commodity_network)

    # 1. Transporting MEDICINE -> Must prefer Safe Long Detour (80km, 0.01 risk)
    res_medicine = service.plan_route(
        RouteRequest(source_id="A", destination_id="C", commodity=CommodityPriority.MEDICINE)
    )
    assert res_medicine.recommended is not None
    assert res_medicine.recommended.path_nodes == ["A", "B_SAFE", "C"]
    assert res_medicine.recommended.average_risk == 0.01

    # 2. Transporting GENERAL goods -> Prefers Moderate Risk Short Cut (40km, 0.35 risk) to save distance
    res_general = service.plan_route(
        RouteRequest(source_id="A", destination_id="C", commodity=CommodityPriority.GENERAL)
    )
    assert res_general.recommended is not None
    assert res_general.recommended.path_nodes == ["A", "B_MODERATE", "C"]
    assert res_general.recommended.total_distance_km == 40.0


def test_all_commodity_types_supported():
    service = RoutingService()
    categories = [
        CommodityPriority.MEDICINE,
        CommodityPriority.FOOD,
        CommodityPriority.AGRICULTURAL,
        CommodityPriority.CONSTRUCTION,
        CommodityPriority.GENERAL,
    ]
    for cat in categories:
        assert cat.risk_weight_multiplier > 0.0
        assert cat.delay_sensitivity_factor > 0.0

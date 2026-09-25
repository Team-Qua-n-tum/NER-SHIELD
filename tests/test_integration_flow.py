"""
test_integration_flow.py
------------------------
End-to-End integration test validating the main demonstration path for NER-SHIELD:
1. Dashboard loads logistics data (districts, roads, incidents, vehicles, alerts)
2. Map loads roads/incidents/alerts coordinates
3. Risk prediction engine evaluates disruption risks based on environmental inputs
4. Routing engine recommends optimal and alternate routes based on risk-awareness and constraints
5. Dashboard displays ETA, risk level, and reasoning
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app

client = TestClient(app)

def test_e2e_logistics_and_routing_flow():
    # ------------------------------------------------------------
    # STEP 1: Dashboard loads logistics data
    # ------------------------------------------------------------
    dashboard_res = client.get("/api/v1/dashboard")
    assert dashboard_res.status_code == 200
    dashboard_data = dashboard_res.json()
    
    assert "districts_monitored" in dashboard_data
    assert "total_roads" in dashboard_data
    assert "active_incidents" in dashboard_data
    assert "vehicles_in_transit" in dashboard_data
    
    assert dashboard_data["districts_monitored"] > 0
    assert dashboard_data["total_roads"] > 0

    # ------------------------------------------------------------
    # STEP 2: Map displays roads, incidents, and active alerts
    # ------------------------------------------------------------
    # Get roads list
    roads_res = client.get("/api/v1/roads")
    assert roads_res.status_code == 200
    roads_data = roads_res.json()
    assert roads_data["total"] > 0
    assert "path_coordinates" in roads_data["roads"][0]

    # Get incidents list
    incidents_res = client.get("/api/v1/incidents")
    assert incidents_res.status_code == 200
    incidents_data = incidents_res.json()
    assert incidents_data["total"] > 0
    assert "lat" in incidents_data["incidents"][0]
    assert "lng" in incidents_data["incidents"][0]

    # Get alerts list
    alerts_res = client.get("/api/v1/alerts")
    assert alerts_res.status_code == 200
    alerts_data = alerts_res.json()
    assert alerts_data["total"] > 0

    # ------------------------------------------------------------
    # STEP 3: Risk information and AI predictive engine evaluation
    # ------------------------------------------------------------
    # Predict risk for a high hazard scenario
    risk_payload = {
        "district_id": "dist-tawang",
        "road_id": "road-nh13-it",
        "rainfall_mm": 250.0,
        "slope_degree": 45.0,
        "weather_condition": "HEAVY_RAIN",
        "soil_type": "CLAY",
        "historical_landslides_count": 5,
        "active_incidents_count": 2
    }
    risk_res = client.post("/api/v1/risk/predict", json=risk_payload)
    assert risk_res.status_code == 200
    risk_data = risk_res.json()
    
    assert "risk_probability" in risk_data
    assert "risk_level" in risk_data
    assert "risk_factors" in risk_data
    assert risk_data["risk_level"] in ["HIGH", "CRITICAL"]
    assert len(risk_data["risk_factors"]) > 0

    # ------------------------------------------------------------
    # STEP 4: Routing engine recommends route based on risk & constraints
    # ------------------------------------------------------------
    route_payload = {
        "source_district": "dist-guwahati",
        "destination_district": "dist-tawang",
        "commodity": "MEDICINES",
        "constraints": {
            "avoid_high_risk": True,
            "vehicle_type": "TRUCK"
        }
    }
    route_res = client.post("/api/v1/routes/recommend", json=route_payload)
    assert route_res.status_code == 200
    route_data = route_res.json()

    # ------------------------------------------------------------
    # STEP 5: Dashboard displays ETA / Risk / Reason
    # ------------------------------------------------------------
    assert "source" in route_data
    assert "destination" in route_data
    assert "recommended_route" in route_data
    assert "alternate_route" in route_data
    assert "is_direct_route_blocked" in route_data

    rec_route = route_data["recommended_route"]
    assert "route_name" in rec_route
    assert "total_distance_km" in rec_route
    assert "eta_hours" in rec_route
    assert "risk_score" in rec_route
    assert "risk_level" in rec_route
    assert "reason" in rec_route
    assert len(rec_route["waypoints"]) >= 2

    # Verify that reason explains why the bypass is selected
    assert len(rec_route["reason"]) > 0
    assert rec_route["total_distance_km"] > 0
    assert rec_route["eta_hours"] > 0

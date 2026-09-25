import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app
from backend.app.schemas.risk import RiskPredictionRequest
from backend.app.schemas.route import RouteRequest, RouteConstraints

client = TestClient(app)

def test_health_endpoints():
    # Root health check
    res1 = client.get("/health")
    assert res1.status_code == 200
    body1 = res1.json()
    assert body1["status"] == "ok"
    assert body1["ai_engine_ready"] is True
    assert body1["routing_engine_ready"] is True

    # API v1 health check
    res2 = client.get("/api/v1/health")
    assert res2.status_code == 200
    assert res2.json()["status"] == "ok"

def test_districts_api():
    res = client.get("/api/v1/districts")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 8
    assert len(data["districts"]) > 0

    # Specific district check
    dist_id = data["districts"][0]["id"]
    res_single = client.get(f"/api/v1/districts/{dist_id}")
    assert res_single.status_code == 200
    assert res_single.json()["id"] == dist_id

    # 404 for non-existent district
    res_404 = client.get("/api/v1/districts/dist-non-existent")
    assert res_404.status_code == 404

def test_roads_api():
    res = client.get("/api/v1/roads")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 5

    road_id = data["roads"][0]["id"]
    # Patch status
    patch_res = client.patch(f"/api/v1/roads/{road_id}/status", json={
        "status": "DISRUPTED",
        "disruption_cause": "Test Rainfall",
        "notes": "Testing road status patch"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "DISRUPTED"
    assert patch_res.json()["disruption_cause"] == "Test Rainfall"

def test_incidents_api():
    # GET list
    list_res = client.get("/api/v1/incidents")
    assert list_res.status_code == 200
    initial_count = list_res.json()["total"]

    # POST new incident
    new_inc = {
        "title": "Automated Test Rockfall",
        "incident_type": "LANDSLIDE",
        "severity": "SEVERE",
        "district_id": "dist-guwahati",
        "road_id": "road-nh27-gt",
        "lat": 26.2000,
        "lng": 91.8000,
        "description": "Loose rocks blocking single lane near Guwahati suburbs.",
        "reported_by": "Test Suite Inspector"
    }
    create_res = client.post("/api/v1/incidents", json=new_inc)
    assert create_res.status_code in [200, 201]
    created = create_res.json()
    assert created["title"] == "Automated Test Rockfall"
    assert created["id"].startswith("inc-")

    # GET single
    get_res = client.get(f"/api/v1/incidents/{created['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Automated Test Rockfall"

def test_vehicles_api():
    # GET list
    list_res = client.get("/api/v1/vehicles")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # POST register vehicle
    new_veh = {
        "registration_number": "TEST-01-AB-9999",
        "vehicle_type": "TRUCK",
        "commodity": "MEDICINES",
        "driver_name": "Test Driver",
        "driver_phone": "+91-9999999999",
        "origin_district": "dist-guwahati",
        "destination_district": "dist-shillong",
        "lat": 26.1000,
        "lng": 91.7500
    }
    reg_res = client.post("/api/v1/vehicles", json=new_veh)
    assert reg_res.status_code in [200, 201]
    veh_data = reg_res.json()
    assert veh_data["registration_number"] == "TEST-01-AB-9999"

    # PATCH vehicle location
    patch_res = client.patch(f"/api/v1/vehicles/{veh_data['id']}/location", json={
        "lat": 25.9000,
        "lng": 91.8000,
        "speed_kmh": 42.5,
        "delivery_status": "IN_TRANSIT"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["lat"] == 25.9000
    assert patch_res.json()["speed_kmh"] == 42.5

def test_risk_api():
    # High rainfall, steep slope test
    payload = {
        "district_id": "dist-shillong",
        "road_id": "road-nh6-ss",
        "rainfall_mm": 180.0,
        "slope_degree": 45.0,
        "weather_condition": "HEAVY_RAIN",
        "soil_type": "CLAY",
        "active_incidents_count": 2
    }
    res = client.post("/api/v1/risk/predict", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["risk_probability"] > 0.5
    assert body["risk_level"] in ["HIGH", "CRITICAL"]
    assert len(body["risk_factors"]) > 0

def test_routes_api():
    payload = {
        "source_district": "dist-guwahati",
        "destination_district": "dist-tawang",
        "commodity": "MEDICINES",
        "constraints": {
            "avoid_high_risk": True,
            "vehicle_type": "TRUCK"
        }
    }
    res = client.post("/api/v1/routes/recommend", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert "recommended_route" in body
    assert body["recommended_route"]["total_distance_km"] > 0
    assert body["recommended_route"]["eta_hours"] > 0

    # Test invalid district error handling
    bad_payload = {
        "source_district": "dist-invalid",
        "destination_district": "dist-tawang",
        "commodity": "FOOD"
    }
    bad_res = client.post("/api/v1/routes/recommend", json=bad_payload)
    assert bad_res.status_code == 400

def test_dashboard_api():
    res = client.get("/api/v1/dashboard")
    assert res.status_code == 200
    body = res.json()
    assert body["districts_monitored"] >= 8
    assert body["total_roads"] >= 5
    assert body["active_incidents"] >= 1
    assert body["vehicles_in_transit"] >= 1
    assert "last_updated" in body

def test_alerts_api():
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    assert res.json()["total"] >= 1

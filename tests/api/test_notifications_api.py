import os

os.environ.setdefault("DEMO_MODE", "true")

from fastapi.testclient import TestClient

from backend.app.db.store import db_store
from backend.app.main import app


client = TestClient(app)


def setup_function():
    db_store.notification_devices.clear()


def registration_payload(token="fcm-device-token-1234567890"):
    return {
        "token": token,
        "platform": "web",
        "device_name": "Test browser",
        "notification_types": ["ROAD_BLOCKED", "FLOOD_ALERT"],
        "district_ids": ["dist-guwahati"],
    }


def test_register_device_returns_token_safe_response():
    response = client.post("/api/v1/notifications/devices", json=registration_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["platform"] == "web"
    assert body["data_mode"] == "demo"
    assert body["token_fingerprint"]
    assert "token" not in body
    assert "fcm-device-token-1234567890" not in response.text


def test_notification_delivery_is_explicitly_simulated_in_demo_mode():
    client.post("/api/v1/notifications/devices", json=registration_payload())
    response = client.post("/api/v1/notifications/send", json={
        "title": "Road blocked",
        "body": "NH-27 is blocked.",
        "notification_type": "ROAD_BLOCKED",
        "district_ids": ["dist-guwahati"],
    })
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "simulated"
    assert body["delivered"] == 1
    assert body["results"][0]["status"] == "simulated"
    assert "fcm-device-token-1234567890" not in response.text


def test_notification_filter_does_not_deliver_unsubscribed_type():
    client.post("/api/v1/notifications/devices", json=registration_payload())
    response = client.post("/api/v1/notifications/send", json={
        "title": "Route changed",
        "body": "The route changed.",
        "notification_type": "ROUTE_CHANGED",
    })
    assert response.status_code == 200
    assert response.json()["attempted"] == 0


def test_notification_type_validation_is_explicit():
    response = client.post("/api/v1/notifications/devices", json={
        **registration_payload(),
        "notification_types": ["UNSUPPORTED"],
    })
    assert response.status_code == 422
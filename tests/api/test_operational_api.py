import os

os.environ.setdefault("DEMO_MODE", "true")

from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_operational_status_is_explicit_demo_mode():
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    body = response.json()
    assert body["data_mode"] == "demo"
    assert body["database_status"] == "not_required"
    assert body["status"] == "ok"


def test_operational_collections_include_freshness_contract():
    body = client.get("/api/v1/incidents").json()
    assert body["source"] == "mock"
    assert body["data_mode"] == "demo"
    assert body["stale"] is False
    assert "fetched_at" in body


def test_bbox_validation_rejects_invalid_coordinates():
    response = client.get("/api/v1/roads?bbox=91,26,90,27")
    assert response.status_code == 422


def test_refresh_returns_per_source_contract():
    response = client.post("/api/v1/refresh")
    assert response.status_code == 200
    body = response.json()
    assert body["data_mode"] == "demo"
    assert body["status"] == "ok"
    assert {source["source"] for source in body["sources"]} == {"weather", "operations"}
    assert all("fetched_at" in source and "stale" in source for source in body["sources"])


def test_weather_provider_failure_is_explicitly_stale(monkeypatch):
    from backend.app.services.operational_service import operational_service

    class FailingProvider:
        def fetch(self, lat, lon):
            raise RuntimeError("provider down")

        def is_available(self):
            return False

    monkeypatch.setattr(operational_service, "weather_provider", FailingProvider())
    body = client.get("/api/v1/weather/forecast").json()
    assert body["source"] == "unavailable"
    assert body["data_mode"] == "degraded"
    assert body["stale"] is True


def test_live_settings_require_provider_configuration():
    from pydantic import ValidationError
    from backend.app.core.config import Settings

    try:
        Settings(DEMO_MODE=False)
    except ValidationError as exc:
        assert "DATABASE_URL is required" in str(exc)
    else:
        raise AssertionError("live settings must reject missing provider configuration")
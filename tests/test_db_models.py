"""
tests/test_db_models.py
Tests for ORM model column definitions using SQLite in-memory (no PostGIS required).
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from backend.app.models.base import Base
from backend.app.models.road import Road
from backend.app.models.incident import Incident
from backend.app.models.vehicle import Vehicle
from backend.app.models.weather import WeatherObservation
from backend.app.models.risk import RiskRecord
from backend.app.models.route import RouteRecord


@pytest.fixture(scope="module")
def sqlite_engine():
    """Create a SQLite in-memory engine with all NER-SHIELD tables."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def session(sqlite_engine):
    Session = sessionmaker(bind=sqlite_engine)
    db = Session()
    yield db
    db.close()


class TestRoadModel:
    def test_road_table_exists(self, sqlite_engine):
        assert inspect(sqlite_engine).has_table("roads")

    def test_create_road(self, session):
        road = Road(
            id="road-test-1",
            name="Test NH-27",
            status="OPEN",
            risk_score=0.1,
            risk_level="LOW",
            length_km=150.0,
        )
        session.add(road)
        session.commit()
        fetched = session.get(Road, "road-test-1")
        assert fetched is not None
        assert fetched.name == "Test NH-27"
        assert fetched.status == "OPEN"

    def test_road_created_at_populated(self, session):
        road = Road(id="road-ts-2", name="TS Road 2", status="OPEN")
        session.add(road)
        session.commit()
        fetched = session.get(Road, "road-ts-2")
        assert fetched.created_at is not None


class TestIncidentModel:
    def test_incident_table_exists(self, sqlite_engine):
        assert inspect(sqlite_engine).has_table("incidents")

    def test_create_incident(self, session):
        inc = Incident(
            id="inc-test-1",
            title="Test Landslide",
            incident_type="LANDSLIDE",
            severity="SEVERE",
            lat=26.2,
            lng=91.8,
        )
        session.add(inc)
        session.commit()
        fetched = session.get(Incident, "inc-test-1")
        assert fetched is not None
        assert fetched.status == "ACTIVE"  # default
        assert fetched.lat == 26.2


class TestVehicleModel:
    def test_vehicle_table_exists(self, sqlite_engine):
        assert inspect(sqlite_engine).has_table("vehicles")

    def test_create_vehicle(self, session):
        v = Vehicle(
            id="veh-test-1",
            registration_number="AS-01-AA-1234",
            vehicle_type="TRUCK",
            commodity="MEDICINES",
        )
        session.add(v)
        session.commit()
        fetched = session.get(Vehicle, "veh-test-1")
        assert fetched is not None
        assert fetched.registration_number == "AS-01-AA-1234"
        assert fetched.delivery_status == "IN_TRANSIT"  # default


class TestWeatherModel:
    def test_weather_table_exists(self, sqlite_engine):
        assert inspect(sqlite_engine).has_table("weather_observations")

    def test_create_weather_observation(self, session):
        obs = WeatherObservation(
            id="wx-test-1",
            lat=26.1,
            lng=91.7,
            rainfall_mm=45.2,
            condition="RAIN",
        )
        session.add(obs)
        session.commit()
        fetched = session.get(WeatherObservation, "wx-test-1")
        assert fetched is not None
        assert fetched.rainfall_mm == 45.2


class TestRiskModel:
    def test_risk_table_exists(self, sqlite_engine):
        assert inspect(sqlite_engine).has_table("risk_records")

    def test_create_risk_record(self, session):
        r = RiskRecord(
            id="risk-test-1",
            road_id="road-test-1",
            risk_score=0.78,
            risk_level="HIGH",
            confidence=0.92,
        )
        session.add(r)
        session.commit()
        fetched = session.get(RiskRecord, "risk-test-1")
        assert fetched is not None
        assert fetched.risk_level == "HIGH"


class TestRouteModel:
    def test_route_table_exists(self, sqlite_engine):
        assert inspect(sqlite_engine).has_table("route_records")

    def test_create_route_record(self, session):
        rec = RouteRecord(
            id="route-test-1",
            origin_district_id="dist-guwahati",
            destination_district_id="dist-tawang",
            commodity="MEDICINES",
            total_distance_km=520.0,
            eta_hours=14.5,
            risk_score=0.42,
            risk_level="MEDIUM",
        )
        session.add(rec)
        session.commit()
        fetched = session.get(RouteRecord, "route-test-1")
        assert fetched is not None
        assert fetched.origin_district_id == "dist-guwahati"
        assert fetched.total_distance_km == 520.0

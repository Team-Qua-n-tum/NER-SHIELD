from typing import Dict, List, Optional
from datetime import datetime
import threading
from backend.app.schemas.district import DistrictResponse, Coordinates
from backend.app.schemas.road import RoadResponse, GeoPoint
from backend.app.schemas.incident import IncidentResponse
from backend.app.schemas.vehicle import VehicleResponse
from backend.app.schemas.alert import AlertResponse

class DataStore:
    """
    Thread-safe in-memory repository pre-populated with North Eastern Region (NER)
    logistics, geographical, and incident seed data.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self.districts: Dict[str, DistrictResponse] = {}
        self.roads: Dict[str, RoadResponse] = {}
        self.incidents: Dict[str, IncidentResponse] = {}
        self.vehicles: Dict[str, VehicleResponse] = {}
        self.alerts: Dict[str, AlertResponse] = {}
        self._seed_data()

    def _seed_data(self):
        # 1. Seed Districts
        raw_districts = [
            {
                "id": "dist-guwahati",
                "name": "Kamrup Metropolitan (Guwahati)",
                "state": "Assam",
                "coordinates": {"lat": 26.1445, "lng": 91.7362},
                "connectivity_status": "NORMAL",
                "accessibility_score": 95.0,
                "active_incidents_count": 0,
                "risk_level": "LOW",
                "isolation_vulnerability": "LOW",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "id": "dist-shillong",
                "name": "East Khasi Hills (Shillong)",
                "state": "Meghalaya",
                "coordinates": {"lat": 25.5788, "lng": 91.8933},
                "connectivity_status": "PARTIAL_DISRUPTED",
                "accessibility_score": 72.0,
                "active_incidents_count": 1,
                "risk_level": "MEDIUM",
                "isolation_vulnerability": "MEDIUM",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "id": "dist-gangtok",
                "name": "East Sikkim (Gangtok)",
                "state": "Sikkim",
                "coordinates": {"lat": 27.3389, "lng": 88.6065},
                "connectivity_status": "PARTIAL_DISRUPTED",
                "accessibility_score": 65.0,
                "active_incidents_count": 1,
                "risk_level": "HIGH",
                "isolation_vulnerability": "HIGH",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "id": "dist-itanagar",
                "name": "Papum Pare (Itanagar)",
                "state": "Arunachal Pradesh",
                "coordinates": {"lat": 27.0844, "lng": 93.6053},
                "connectivity_status": "NORMAL",
                "accessibility_score": 88.0,
                "active_incidents_count": 0,
                "risk_level": "LOW",
                "isolation_vulnerability": "MEDIUM",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "id": "dist-kohima",
                "name": "Kohima",
                "state": "Nagaland",
                "coordinates": {"lat": 25.6751, "lng": 94.1086},
                "connectivity_status": "NORMAL",
                "accessibility_score": 82.0,
                "active_incidents_count": 0,
                "risk_level": "LOW",
                "isolation_vulnerability": "MEDIUM",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "id": "dist-imphal",
                "name": "Imphal East",
                "state": "Manipur",
                "coordinates": {"lat": 24.8170, "lng": 93.9368},
                "connectivity_status": "PARTIAL_DISRUPTED",
                "accessibility_score": 70.0,
                "active_incidents_count": 1,
                "risk_level": "MEDIUM",
                "isolation_vulnerability": "HIGH",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "id": "dist-aizawl",
                "name": "Aizawl",
                "state": "Mizoram",
                "coordinates": {"lat": 23.7271, "lng": 92.7176},
                "connectivity_status": "PARTIAL_DISRUPTED",
                "accessibility_score": 68.0,
                "active_incidents_count": 1,
                "risk_level": "HIGH",
                "isolation_vulnerability": "HIGH",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "id": "dist-agartala",
                "name": "West Tripura (Agartala)",
                "state": "Tripura",
                "coordinates": {"lat": 23.8315, "lng": 91.2868},
                "connectivity_status": "NORMAL",
                "accessibility_score": 90.0,
                "active_incidents_count": 0,
                "risk_level": "LOW",
                "isolation_vulnerability": "LOW",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "id": "dist-silchar",
                "name": "Cachar (Silchar)",
                "state": "Assam",
                "coordinates": {"lat": 24.8333, "lng": 92.7789},
                "connectivity_status": "PARTIAL_DISRUPTED",
                "accessibility_score": 75.0,
                "active_incidents_count": 1,
                "risk_level": "HIGH",
                "isolation_vulnerability": "MEDIUM",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "id": "dist-tawang",
                "name": "Tawang",
                "state": "Arunachal Pradesh",
                "coordinates": {"lat": 27.5861, "lng": 91.8594},
                "connectivity_status": "CUT_OFF",
                "accessibility_score": 20.0,
                "active_incidents_count": 1,
                "risk_level": "CRITICAL",
                "isolation_vulnerability": "CRITICAL",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "id": "dist-tezpur",
                "name": "Sonitpur (Tezpur)",
                "state": "Assam",
                "coordinates": {"lat": 26.6528, "lng": 92.7926},
                "connectivity_status": "NORMAL",
                "accessibility_score": 92.0,
                "active_incidents_count": 0,
                "risk_level": "LOW",
                "isolation_vulnerability": "LOW",
                "last_updated": datetime.utcnow().isoformat()
            },
            {
                "id": "dist-dimapur",
                "name": "Dimapur",
                "state": "Nagaland",
                "coordinates": {"lat": 25.9060, "lng": 93.7270},
                "connectivity_status": "NORMAL",
                "accessibility_score": 88.0,
                "active_incidents_count": 0,
                "risk_level": "LOW",
                "isolation_vulnerability": "LOW",
                "last_updated": datetime.utcnow().isoformat()
            }
        ]
        for d in raw_districts:
            self.districts[d["id"]] = DistrictResponse(**d)

        # 2. Seed Roads
        raw_roads = [
            {
                "id": "road-nh27-gt",
                "code": "NH-27",
                "name": "Guwahati - Tezpur Arterial Highway",
                "start_district": "dist-guwahati",
                "end_district": "dist-tezpur",
                "length_km": 180.0,
                "status": "OPEN",
                "disruption_cause": None,
                "risk_score": 0.15,
                "risk_level": "LOW",
                "path_coordinates": [
                    {"lat": 26.1445, "lng": 91.7362},
                    {"lat": 26.4000, "lng": 92.2000},
                    {"lat": 26.6528, "lng": 92.7926}
                ],
                "last_checked": datetime.utcnow().isoformat()
            },
            {
                "id": "road-nh6-gs",
                "code": "NH-6",
                "name": "Guwahati - Shillong Expressway",
                "start_district": "dist-guwahati",
                "end_district": "dist-shillong",
                "length_km": 100.0,
                "status": "OPEN",
                "disruption_cause": None,
                "risk_score": 0.25,
                "risk_level": "LOW",
                "path_coordinates": [
                    {"lat": 26.1445, "lng": 91.7362},
                    {"lat": 25.9000, "lng": 91.8000},
                    {"lat": 25.5788, "lng": 91.8933}
                ],
                "last_checked": datetime.utcnow().isoformat()
            },
            {
                "id": "road-nh6-ss",
                "code": "NH-6",
                "name": "Shillong - Silchar Mountain Corridor",
                "start_district": "dist-shillong",
                "end_district": "dist-silchar",
                "length_km": 220.0,
                "status": "DISRUPTED",
                "disruption_cause": "Landslide near Sonapur Tunnel",
                "risk_score": 0.78,
                "risk_level": "HIGH",
                "path_coordinates": [
                    {"lat": 25.5788, "lng": 91.8933},
                    {"lat": 25.1000, "lng": 92.3000},
                    {"lat": 24.8333, "lng": 92.7789}
                ],
                "last_checked": datetime.utcnow().isoformat()
            },
            {
                "id": "road-nh10-gg",
                "code": "NH-10",
                "name": "Siliguri - Gangtok Highway",
                "start_district": "dist-guwahati",
                "end_district": "dist-gangtok",
                "length_km": 114.0,
                "status": "DISRUPTED",
                "disruption_cause": "Heavy Rainfall & Subsidence",
                "risk_score": 0.65,
                "risk_level": "HIGH",
                "path_coordinates": [
                    {"lat": 26.1445, "lng": 91.7362},
                    {"lat": 26.8000, "lng": 89.5000},
                    {"lat": 27.3389, "lng": 88.6065}
                ],
                "last_checked": datetime.utcnow().isoformat()
            },
            {
                "id": "road-nh27-ti",
                "code": "NH-27/415",
                "name": "Tezpur - Itanagar Link Road",
                "start_district": "dist-tezpur",
                "end_district": "dist-itanagar",
                "length_km": 160.0,
                "status": "OPEN",
                "disruption_cause": None,
                "risk_score": 0.20,
                "risk_level": "LOW",
                "path_coordinates": [
                    {"lat": 26.6528, "lng": 92.7926},
                    {"lat": 26.8500, "lng": 93.2000},
                    {"lat": 27.0844, "lng": 93.6053}
                ],
                "last_checked": datetime.utcnow().isoformat()
            },
            {
                "id": "road-nh13-it",
                "code": "NH-13",
                "name": "Itanagar - Tawang Trans-Arunachal Highway",
                "start_district": "dist-itanagar",
                "end_district": "dist-tawang",
                "length_km": 320.0,
                "status": "BLOCKED",
                "disruption_cause": "Massive Landslide & Snowfall at Sela Pass",
                "risk_score": 0.95,
                "risk_level": "CRITICAL",
                "path_coordinates": [
                    {"lat": 27.0844, "lng": 93.6053},
                    {"lat": 27.3500, "lng": 92.4000},
                    {"lat": 27.5861, "lng": 91.8594}
                ],
                "last_checked": datetime.utcnow().isoformat()
            },
            {
                "id": "road-nh2-kd",
                "code": "NH-2",
                "name": "Dimapur - Kohima Highway",
                "start_district": "dist-dimapur",
                "end_district": "dist-kohima",
                "length_km": 74.0,
                "status": "OPEN",
                "disruption_cause": None,
                "risk_score": 0.30,
                "risk_level": "LOW",
                "path_coordinates": [
                    {"lat": 25.9060, "lng": 93.7270},
                    {"lat": 25.8000, "lng": 93.9000},
                    {"lat": 25.6751, "lng": 94.1086}
                ],
                "last_checked": datetime.utcnow().isoformat()
            },
            {
                "id": "road-nh2-ki",
                "code": "NH-2",
                "name": "Kohima - Imphal Highway",
                "start_district": "dist-kohima",
                "end_district": "dist-imphal",
                "length_km": 138.0,
                "status": "OPEN",
                "disruption_cause": None,
                "risk_score": 0.40,
                "risk_level": "MEDIUM",
                "path_coordinates": [
                    {"lat": 25.6751, "lng": 94.1086},
                    {"lat": 25.2000, "lng": 94.0000},
                    {"lat": 24.8170, "lng": 93.9368}
                ],
                "last_checked": datetime.utcnow().isoformat()
            },
            {
                "id": "road-nh6-sa",
                "code": "NH-306",
                "name": "Silchar - Aizawl Life Line Corridor",
                "start_district": "dist-silchar",
                "end_district": "dist-aizawl",
                "length_km": 180.0,
                "status": "DISRUPTED",
                "disruption_cause": "Mudslide near Vairengte",
                "risk_score": 0.70,
                "risk_level": "HIGH",
                "path_coordinates": [
                    {"lat": 24.8333, "lng": 92.7789},
                    {"lat": 24.2000, "lng": 92.7500},
                    {"lat": 23.7271, "lng": 92.7176}
                ],
                "last_checked": datetime.utcnow().isoformat()
            },
            {
                "id": "road-nh8-sa",
                "code": "NH-8",
                "name": "Silchar - Agartala Highway",
                "start_district": "dist-silchar",
                "end_district": "dist-agartala",
                "length_km": 250.0,
                "status": "OPEN",
                "disruption_cause": None,
                "risk_score": 0.35,
                "risk_level": "MEDIUM",
                "path_coordinates": [
                    {"lat": 24.8333, "lng": 92.7789},
                    {"lat": 24.1000, "lng": 92.0000},
                    {"lat": 23.8315, "lng": 91.2868}
                ],
                "last_checked": datetime.utcnow().isoformat()
            }
        ]
        for r in raw_roads:
            self.roads[r["id"]] = RoadResponse(**r)

        # 3. Seed Incidents
        raw_incidents = [
            {
                "id": "inc-101",
                "title": "Massive Landslide at Sela Pass",
                "incident_type": "LANDSLIDE",
                "severity": "CRITICAL",
                "district_id": "dist-tawang",
                "road_id": "road-nh13-it",
                "lat": 27.5000,
                "lng": 92.1000,
                "description": "Severe debris fall and snow blockage. Road cut off for all heavy logistics vehicles.",
                "reported_by": "Border Roads Organisation (BRO)",
                "photo_url": "https://example.com/incidents/sela_landslide.jpg",
                "status": "ACTIVE",
                "reported_at": datetime.utcnow()
            },
            {
                "id": "inc-102",
                "title": "Sonapur Tunnel Flash Flood & Mudslide",
                "incident_type": "FLOOD",
                "severity": "SEVERE",
                "district_id": "dist-shillong",
                "road_id": "road-nh6-ss",
                "lat": 25.1200,
                "lng": 92.3500,
                "description": "Continuous rain induced flooding near tunnel entrance. Single-lane movement active.",
                "reported_by": "Meghalaya Highway Patrol",
                "photo_url": "https://example.com/incidents/sonapur_flood.jpg",
                "status": "IN_PROGRESS",
                "reported_at": datetime.utcnow()
            },
            {
                "id": "inc-103",
                "title": "Mudslide on Vairengte Stretch",
                "incident_type": "LANDSLIDE",
                "severity": "MODERATE",
                "district_id": "dist-aizawl",
                "road_id": "road-nh6-sa",
                "lat": 24.1800,
                "lng": 92.7400,
                "description": "Soil slip slowing down freight movement between Silchar and Aizawl.",
                "reported_by": "Mizoram Logistics Control Cell",
                "photo_url": "https://example.com/incidents/vairengte_mudslide.jpg",
                "status": "ACTIVE",
                "reported_at": datetime.utcnow()
            }
        ]
        for inc in raw_incidents:
            self.incidents[inc["id"]] = IncidentResponse(**inc)

        # 4. Seed Vehicles
        raw_vehicles = [
            {
                "id": "veh-01",
                "registration_number": "AS-01-GB-4592",
                "vehicle_type": "TRUCK",
                "commodity": "MEDICINES",
                "driver_name": "Ramesh Das",
                "driver_phone": "+91-9876543210",
                "origin_district": "dist-guwahati",
                "destination_district": "dist-tawang",
                "lat": 27.1000,
                "lng": 93.5000,
                "delivery_status": "REROUTED",
                "speed_kmh": 35.0,
                "eta_hours": 9.5,
                "assigned_route_id": "route-gt-alt-01",
                "last_ping": datetime.utcnow().isoformat()
            },
            {
                "id": "veh-02",
                "registration_number": "ML-05-AB-1234",
                "vehicle_type": "TANKER",
                "commodity": "FUEL",
                "driver_name": "Bahun Syiem",
                "driver_phone": "+91-9876543211",
                "origin_district": "dist-guwahati",
                "destination_district": "dist-shillong",
                "lat": 25.8500,
                "lng": 91.8200,
                "delivery_status": "IN_TRANSIT",
                "speed_kmh": 48.0,
                "eta_hours": 1.2,
                "assigned_route_id": "route-gs-primary",
                "last_ping": datetime.utcnow().isoformat()
            },
            {
                "id": "veh-03",
                "registration_number": "TR-01-C-9876",
                "vehicle_type": "CARGO_VAN",
                "commodity": "FOOD_SUPPLIES",
                "driver_name": "Bikram Debbarma",
                "driver_phone": "+91-9876543212",
                "origin_district": "dist-silchar",
                "destination_district": "dist-agartala",
                "lat": 24.2000,
                "lng": 91.9000,
                "delivery_status": "IN_TRANSIT",
                "speed_kmh": 52.0,
                "eta_hours": 3.8,
                "assigned_route_id": "route-sa-primary",
                "last_ping": datetime.utcnow().isoformat()
            },
            {
                "id": "veh-04",
                "registration_number": "MN-01-D-5544",
                "vehicle_type": "TRUCK",
                "commodity": "CONSTRUCTION_MATERIALS",
                "driver_name": "Lhingkim Kipgen",
                "driver_phone": "+91-9876543213",
                "origin_district": "dist-dimapur",
                "destination_district": "dist-imphal",
                "lat": 25.1000,
                "lng": 93.9800,
                "delivery_status": "DELAYED",
                "speed_kmh": 18.0,
                "eta_hours": 5.5,
                "assigned_route_id": "route-di-primary",
                "last_ping": datetime.utcnow().isoformat()
            }
        ]
        for v in raw_vehicles:
            self.vehicles[v["id"]] = VehicleResponse(**v)

        # 5. Seed Alerts
        raw_alerts = [
            {
                "id": "alt-01",
                "title": "CRITICAL: Sela Pass Highway (NH-13) Blocked",
                "category": "ROAD_BLOCK",
                "severity": "CRITICAL",
                "district_id": "dist-tawang",
                "road_id": "road-nh13-it",
                "message": "Massive landslide and heavy snow near Sela Pass. Highway completely blocked. Medical supplies rerouted via emergency bypass.",
                "created_at": datetime.utcnow(),
                "active": True
            },
            {
                "id": "alt-02",
                "title": "WARNING: Flash Flood Advisory on NH-6 (Sonapur)",
                "category": "WEATHER_WARNING",
                "severity": "HIGH",
                "district_id": "dist-shillong",
                "road_id": "road-nh6-ss",
                "message": "Continuous heavy rainfall in East Khasi Hills causing minor waterlogging and rockfall near Sonapur tunnel. Drive with extreme caution.",
                "created_at": datetime.utcnow(),
                "active": True
            }
        ]
        for a in raw_alerts:
            self.alerts[a["id"]] = AlertResponse(**a)

# Global store instance
db_store = DataStore()

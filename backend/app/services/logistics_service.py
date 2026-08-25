from typing import List, Optional
from datetime import datetime
import uuid
from backend.app.db.store import db_store
from backend.app.schemas.district import DistrictResponse, DistrictListResponse
from backend.app.schemas.road import RoadResponse, RoadListResponse, RoadStatusUpdate
from backend.app.schemas.incident import IncidentCreate, IncidentResponse, IncidentListResponse, IncidentStatusUpdate
from backend.app.schemas.vehicle import VehicleCreate, VehicleResponse, VehicleListResponse, VehicleLocationUpdate
from backend.app.schemas.alert import AlertCreate, AlertResponse, AlertListResponse
from backend.app.schemas.dashboard import DashboardSummaryResponse, CorridorSummary

class LogisticsService:
    # Districts
    @staticmethod
    def get_all_districts() -> DistrictListResponse:
        districts = list(db_store.districts.values())
        return DistrictListResponse(total=len(districts), districts=districts)

    @staticmethod
    def get_district(district_id: str) -> Optional[DistrictResponse]:
        return db_store.districts.get(district_id)

    # Roads
    @staticmethod
    def get_all_roads() -> RoadListResponse:
        roads = list(db_store.roads.values())
        return RoadListResponse(total=len(roads), roads=roads)

    @staticmethod
    def get_road(road_id: str) -> Optional[RoadResponse]:
        return db_store.roads.get(road_id)

    @staticmethod
    def update_road_status(road_id: str, update: RoadStatusUpdate) -> Optional[RoadResponse]:
        with db_store._lock:
            road = db_store.roads.get(road_id)
            if not road:
                return None
            updated_data = road.dict()
            updated_data["status"] = update.status
            if update.disruption_cause is not None:
                updated_data["disruption_cause"] = update.disruption_cause
            if update.status == "BLOCKED":
                updated_data["risk_level"] = "CRITICAL"
                updated_data["risk_score"] = 0.95
            elif update.status == "DISRUPTED":
                updated_data["risk_level"] = "HIGH"
                updated_data["risk_score"] = 0.75
            else:
                updated_data["risk_level"] = "LOW"
                updated_data["risk_score"] = 0.20
            updated_data["last_checked"] = datetime.utcnow().isoformat()
            
            new_road = RoadResponse(**updated_data)
            db_store.roads[road_id] = new_road
            return new_road

    # Incidents
    @staticmethod
    def get_all_incidents() -> IncidentListResponse:
        incidents = list(db_store.incidents.values())
        return IncidentListResponse(total=len(incidents), incidents=incidents)

    @staticmethod
    def create_incident(data: IncidentCreate) -> IncidentResponse:
        with db_store._lock:
            incident_id = f"inc-{uuid.uuid4().hex[:6]}"
            new_incident = IncidentResponse(
                id=incident_id,
                **data.dict(),
                status="ACTIVE",
                reported_at=datetime.utcnow()
            )
            db_store.incidents[incident_id] = new_incident
            
            # Update affected district incident count
            dist = db_store.districts.get(data.district_id)
            if dist:
                d_dict = dist.dict()
                d_dict["active_incidents_count"] += 1
                if data.severity in ["SEVERE", "CRITICAL"]:
                    d_dict["connectivity_status"] = "PARTIAL_DISRUPTED"
                    d_dict["risk_level"] = "HIGH"
                db_store.districts[data.district_id] = DistrictResponse(**d_dict)
                
            return new_incident

    @staticmethod
    def get_incident(incident_id: str) -> Optional[IncidentResponse]:
        return db_store.incidents.get(incident_id)

    @staticmethod
    def update_incident_status(incident_id: str, update: IncidentStatusUpdate) -> Optional[IncidentResponse]:
        with db_store._lock:
            incident = db_store.incidents.get(incident_id)
            if not incident:
                return None
            inc_dict = incident.dict()
            inc_dict["status"] = update.status
            if update.status == "RESOLVED":
                inc_dict["resolved_at"] = datetime.utcnow()
                # Decrement district active incident count
                dist = db_store.districts.get(inc_dict.get("district_id", ""))
                if dist:
                    d_dict = dist.dict()
                    d_dict["active_incidents_count"] = max(0, d_dict["active_incidents_count"] - 1)
                    db_store.districts[inc_dict["district_id"]] = DistrictResponse(**d_dict)
            updated = IncidentResponse(**inc_dict)
            db_store.incidents[incident_id] = updated
            return updated

    # Vehicles
    @staticmethod
    def get_all_vehicles() -> VehicleListResponse:
        vehicles = list(db_store.vehicles.values())
        return VehicleListResponse(total=len(vehicles), vehicles=vehicles)

    @staticmethod
    def create_vehicle(data: VehicleCreate) -> VehicleResponse:
        with db_store._lock:
            veh_id = f"veh-{uuid.uuid4().hex[:6]}"
            new_vehicle = VehicleResponse(
                id=veh_id,
                **data.dict(),
                delivery_status="IN_TRANSIT",
                speed_kmh=45.0,
                eta_hours=4.0,
                assigned_route_id=f"route-{data.origin_district[:4]}-{data.destination_district[:4]}",
                last_ping=datetime.utcnow().isoformat()
            )
            db_store.vehicles[veh_id] = new_vehicle
            return new_vehicle

    @staticmethod
    def update_vehicle_location(veh_id: str, update: VehicleLocationUpdate) -> Optional[VehicleResponse]:
        with db_store._lock:
            vehicle = db_store.vehicles.get(veh_id)
            if not vehicle:
                return None
            v_dict = vehicle.dict()
            v_dict["lat"] = update.lat
            v_dict["lng"] = update.lng
            if update.speed_kmh is not None:
                v_dict["speed_kmh"] = update.speed_kmh
            if update.delivery_status is not None:
                v_dict["delivery_status"] = update.delivery_status
            v_dict["last_ping"] = datetime.utcnow().isoformat()
            
            new_vehicle = VehicleResponse(**v_dict)
            db_store.vehicles[veh_id] = new_vehicle
            return new_vehicle

    @staticmethod
    def get_vehicle(veh_id: str) -> Optional[VehicleResponse]:
        return db_store.vehicles.get(veh_id)

    # Alerts
    @staticmethod
    def get_all_alerts() -> AlertListResponse:
        alerts = list(db_store.alerts.values())
        return AlertListResponse(total=len(alerts), alerts=alerts)

    @staticmethod
    def create_alert(data: AlertCreate) -> AlertResponse:
        with db_store._lock:
            alert_id = f"alt-{uuid.uuid4().hex[:6]}"
            new_alert = AlertResponse(
                id=alert_id,
                **data.dict(),
                created_at=datetime.utcnow(),
                active=True
            )
            db_store.alerts[alert_id] = new_alert
            return new_alert

    # Dashboard Summary Aggregation
    @staticmethod
    def get_dashboard_summary() -> DashboardSummaryResponse:
        districts = list(db_store.districts.values())
        roads = list(db_store.roads.values())
        incidents = list(db_store.incidents.values())
        vehicles = list(db_store.vehicles.values())
        
        open_roads = sum(1 for r in roads if r.status == "OPEN")
        disrupted_roads = sum(1 for r in roads if r.status == "DISRUPTED")
        blocked_roads = sum(1 for r in roads if r.status == "BLOCKED")
        
        active_incidents = sum(1 for inc in incidents if inc.status in ["ACTIVE", "IN_PROGRESS"])
        in_transit = sum(1 for v in vehicles if v.delivery_status in ["IN_TRANSIT", "REROUTED"])
        delayed = sum(1 for v in vehicles if v.delivery_status == "DELAYED")
        
        high_risk_roads = [
            CorridorSummary(
                id=r.id,
                code=r.code,
                name=r.name,
                risk_level=r.risk_level,
                status=r.status
            )
            for r in roads if r.risk_level in ["HIGH", "CRITICAL"]
        ]
        
        return DashboardSummaryResponse(
            districts_monitored=len(districts),
            total_roads=len(roads),
            open_roads=open_roads,
            disrupted_roads=disrupted_roads,
            blocked_roads=blocked_roads,
            active_incidents=active_incidents,
            vehicles_in_transit=in_transit,
            delayed_deliveries=delayed,
            high_risk_corridors_count=len(high_risk_roads),
            high_risk_corridors=high_risk_roads,
            last_updated=datetime.utcnow().isoformat()
        )

logistics_service = LogisticsService()

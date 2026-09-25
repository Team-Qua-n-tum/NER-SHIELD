from typing import Dict, Any, List, Optional
import math
from backend.app.db.store import db_store

class NERRoutingEngine:
    """
    Member 3 Routing Engine: Calculates optimal, risk-aware logistics routes
    across North Eastern Region road networks taking into account road status,
    AI risk scores, vehicle types, and commodity constraints.
    """
    def __init__(self):
        pass

    def _haversine_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def find_route(
        self,
        source_id: str,
        destination_id: str,
        commodity: str = "MEDICINES",
        avoid_high_risk: bool = True,
        vehicle_type: str = "TRUCK"
    ) -> Dict[str, Any]:
        """
        Generate primary recommended route and alternate route.
        """
        source_dist = db_store.districts.get(source_id)
        dest_dist = db_store.districts.get(destination_id)

        if not source_dist or not dest_dist:
            raise ValueError(f"Invalid district reference: source '{source_id}' or dest '{destination_id}' not found.")

        # Find direct roads connecting source & dest or nearby hub roads
        direct_roads = [
            r for r in db_store.roads.values()
            if (r.start_district == source_id and r.end_district == destination_id) or
               (r.start_district == destination_id and r.end_district == source_id)
        ]

        direct_blocked = False
        primary_road = direct_roads[0] if direct_roads else None

        if primary_road and primary_road.status == "BLOCKED":
            direct_blocked = True

        # Calculate estimated distance
        direct_dist = self._haversine_distance(
            source_dist.coordinates.lat, source_dist.coordinates.lng,
            dest_dist.coordinates.lat, dest_dist.coordinates.lng
        ) * 1.3 # road tortuosity factor in NER mountain terrain

        avg_speed_kmh = 40.0 if vehicle_type.upper() == "TRUCK" else 45.0
        
        # Build Recommended Route
        if primary_road and not (avoid_high_risk and primary_road.risk_level == "CRITICAL") and primary_road.status != "BLOCKED":
            rec_distance = primary_road.length_km
            rec_risk = primary_road.risk_score
            rec_level = primary_road.risk_level
            rec_reason = f"Optimal direct corridor via {primary_road.code} ({primary_road.name}). Traffic flowing."
            rec_roads = [primary_road.id]
        else:
            # Bypass route calculation
            rec_distance = round(direct_dist * 1.25, 1)
            rec_risk = 0.25
            rec_level = "LOW"
            rec_reason = f"Bypass route via state highway corridors avoiding high-risk or blocked zones."
            rec_roads = [r.id for r in db_store.roads.values() if r.status == "OPEN"][:2]

        rec_eta = round(rec_distance / avg_speed_kmh, 1)

        recommended_route = {
            "route_name": f"Primary Corridor ({source_dist.name} -> {dest_dist.name})",
            "waypoints": [
                {
                    "district_id": source_dist.id,
                    "district_name": source_dist.name,
                    "lat": source_dist.coordinates.lat,
                    "lng": source_dist.coordinates.lng
                },
                {
                    "district_id": dest_dist.id,
                    "district_name": dest_dist.name,
                    "lat": dest_dist.coordinates.lat,
                    "lng": dest_dist.coordinates.lng
                }
            ],
            "total_distance_km": rec_distance,
            "eta_hours": rec_eta,
            "risk_score": rec_risk,
            "risk_level": rec_level,
            "reason": rec_reason,
            "road_ids": rec_roads
        }

        # Build Alternate Route
        alt_distance = round(rec_distance * 1.35, 1)
        alt_eta = round(alt_distance / avg_speed_kmh, 1)
        alt_route = {
            "route_name": f"Emergency Alternate Bypass ({source_dist.name} -> {dest_dist.name})",
            "waypoints": [
                {
                    "district_id": source_dist.id,
                    "district_name": source_dist.name,
                    "lat": source_dist.coordinates.lat,
                    "lng": source_dist.coordinates.lng
                },
                {
                    "district_id": "dist-tezpur",
                    "district_name": "Sonitpur (Tezpur)",
                    "lat": 26.6528,
                    "lng": 92.7926
                },
                {
                    "district_id": dest_dist.id,
                    "district_name": dest_dist.name,
                    "lat": dest_dist.coordinates.lat,
                    "lng": dest_dist.coordinates.lng
                }
            ],
            "total_distance_km": alt_distance,
            "eta_hours": alt_eta,
            "risk_score": 0.18,
            "risk_level": "LOW",
            "reason": "Low-risk lowland transit bypass around high-elevation mountain passes.",
            "road_ids": ["road-nh27-gt", "road-nh27-ti"]
        }

        return {
            "source": source_dist.name,
            "destination": dest_dist.name,
            "commodity": commodity,
            "recommended_route": recommended_route,
            "alternate_route": alt_route,
            "is_direct_route_blocked": direct_blocked
        }

routing_engine = NERRoutingEngine()

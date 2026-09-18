"""
Core data models for NER-SHIELD Route Optimization & ETA Engine.
"""

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import List, Dict, Optional, Any


class CommodityPriority(Enum):
    """
    Categories of transported goods in the North Eastern Region.
    Higher priority items (e.g. MEDICINE) carry higher risk-aversion penalties
    to ensure safer, low-disruption routing even if geographical distance is longer.
    """
    MEDICINE = "MEDICINE"
    FOOD = "FOOD"
    AGRICULTURAL = "AGRICULTURAL"
    CONSTRUCTION = "CONSTRUCTION"
    GENERAL = "GENERAL"

    @property
    def risk_weight_multiplier(self) -> float:
        """
        Sensitivity multiplier for disruption risk penalty.
        Essential emergency goods (MEDICINE) heavily penalize high-risk corridors.
        """
        multipliers = {
            CommodityPriority.MEDICINE: 3.5,
            CommodityPriority.FOOD: 2.2,
            CommodityPriority.AGRICULTURAL: 1.5,
            CommodityPriority.CONSTRUCTION: 1.0,
            CommodityPriority.GENERAL: 1.0,
        }
        return multipliers.get(self, 1.0)

    @property
    def delay_sensitivity_factor(self) -> float:
        """
        Factor for dynamic ETA buffer calculation due to disruption risk.
        """
        factors = {
            CommodityPriority.MEDICINE: 1.8,
            CommodityPriority.FOOD: 1.4,
            CommodityPriority.AGRICULTURAL: 1.2,
            CommodityPriority.CONSTRUCTION: 1.0,
            CommodityPriority.GENERAL: 1.0,
        }
        return factors.get(self, 1.0)


class RoadStatus(Enum):
    """
    Real-time accessibility status of a road segment.
    """
    OPEN = "OPEN"
    RESTRICTED = "RESTRICTED"
    HIGH_RISK_WARNING = "HIGH_RISK_WARNING"
    BLOCKED = "BLOCKED"

    @property
    def is_traversable(self) -> bool:
        return self != RoadStatus.BLOCKED


class RoadCondition(Enum):
    """
    Physical condition of road surface affecting travel speed and vehicle strain.
    """
    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"
    SEVERE_DAMAGE = "SEVERE_DAMAGE"

    @property
    def speed_factor(self) -> float:
        """
        Fraction of design speed limit achievable under this condition.
        """
        factors = {
            RoadCondition.EXCELLENT: 1.0,
            RoadCondition.GOOD: 0.85,
            RoadCondition.FAIR: 0.70,
            RoadCondition.POOR: 0.50,
            RoadCondition.SEVERE_DAMAGE: 0.30,
        }
        return factors.get(self, 1.0)

    @property
    def condition_penalty_score(self) -> float:
        """
        Additive penalty for cost calculation.
        """
        penalties = {
            RoadCondition.EXCELLENT: 0.0,
            RoadCondition.GOOD: 0.1,
            RoadCondition.FAIR: 0.3,
            RoadCondition.POOR: 0.7,
            RoadCondition.SEVERE_DAMAGE: 1.5,
        }
        return penalties.get(self, 0.0)


@dataclass
class Node:
    """
    Represents an intersection, hub, or landmark location in the road network.
    """
    id: str
    name: str
    lat: float
    lon: float
    district: str = "Unknown"
    state: str = "Assam"
    elevation_m: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "lat": self.lat,
            "lon": self.lon,
            "district": self.district,
            "state": self.state,
            "elevation_m": self.elevation_m,
        }


@dataclass
class Edge:
    """
    Represents a road segment connecting two nodes.

    Extended with GIS / AI operational fields used by the dynamic cost model.
    Geometry coordinates, when present, are GeoJSON [longitude, latitude].
    """
    id: str
    source: str
    target: str
    distance_km: float
    speed_limit_kmh: float
    disruption_risk: float  # Normalized 0.0 (safe) to 1.0 (imminent landslide/flood)
    status: RoadStatus = RoadStatus.OPEN
    road_condition: RoadCondition = RoadCondition.GOOD
    name: str = ""
    is_bidirectional: bool = True
    landslide_prone: bool = False
    flood_prone: bool = False

    # Identity / topology
    road_id: Optional[str] = None
    from_node_id: Optional[str] = None
    to_node_id: Optional[str] = None
    road_class: Optional[str] = None
    geometry: Optional[Dict[str, Any]] = None  # GeoJSON LineString
    length_meters: Optional[float] = None

    # Operational road state
    road_status: Optional[str] = None  # OPEN | DISRUPTED | BLOCKED | CLOSED
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    risk_penalty: Optional[float] = None  # AI primary penalty [0,1]
    route_eligible: Optional[bool] = None
    routing_recommendation: Optional[str] = None
    incident_ids: List[str] = field(default_factory=list)
    suggested_status: Optional[str] = None
    suggested_risk_penalty: Optional[float] = None  # GIS supplement [0,1]
    gis_penalty_applied: bool = False  # True when GIS fills missing AI detail

    # Future segment prediction
    closure_probability: Optional[float] = None
    predicted_delay_minutes: Optional[float] = None
    predicted_speed_kmh: Optional[float] = None
    eta_multiplier: Optional[float] = None
    edge_cost_multiplier: Optional[float] = None
    prediction_confidence: Optional[float] = None
    prediction_horizon_minutes: Optional[int] = None

    # Provenance / freshness
    freshness_seconds: Optional[float] = None
    stale: bool = False
    data_mode: Optional[str] = None
    traversable: Optional[bool] = None
    exclusion_reasons: List[str] = field(default_factory=list)

    # Cost debug contributors (populated during cost evaluation)
    last_cost_breakdown: Dict[str, float] = field(default_factory=dict)

    @property
    def base_travel_time_hrs(self) -> float:
        """
        Theoretical base travel time at speed limit.
        """
        if self.speed_limit_kmh <= 0:
            return 999.0
        return self.distance_km / self.speed_limit_kmh

    @property
    def base_travel_time_seconds(self) -> float:
        return self.base_travel_time_hrs * 3600.0

    @property
    def effective_speed_kmh(self) -> float:
        """
        Speed adjusted for road surface condition and optional prediction.
        """
        base = max(5.0, self.speed_limit_kmh * self.road_condition.speed_factor)
        if self.predicted_speed_kmh is not None and self.predicted_speed_kmh > 0:
            return max(5.0, min(base, self.predicted_speed_kmh))
        return base

    @property
    def adjusted_travel_time_hrs(self) -> float:
        """
        Realistic travel time under present road surface condition,
        AI ETA multiplier, and prediction edge-cost multiplier.

        When ETA and prediction multipliers are identical (common from
        to_routing_edge_cost), apply once to avoid double-counting.
        """
        speed = self.effective_speed_kmh
        base = self.distance_km / speed if speed > 0 else 999.0
        eta_mult = self.eta_multiplier if self.eta_multiplier and self.eta_multiplier > 0 else None
        pred_mult = (
            self.edge_cost_multiplier
            if self.edge_cost_multiplier and self.edge_cost_multiplier > 0
            else None
        )
        combined = 1.0
        if eta_mult is not None and pred_mult is not None:
            if abs(eta_mult - pred_mult) < 1e-9:
                combined = min(eta_mult, 50.0)
            else:
                combined = min(eta_mult * pred_mult, 50.0)
        elif eta_mult is not None:
            combined = min(eta_mult, 50.0)
        elif pred_mult is not None:
            combined = min(pred_mult, 50.0)
        delay_hrs = 0.0
        if self.predicted_delay_minutes and self.predicted_delay_minutes > 0:
            delay_hrs = self.predicted_delay_minutes / 60.0
        return (base * combined) + delay_hrs

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "edge_id": self.id,
            "road_id": self.road_id or self.id,
            "source": self.source,
            "target": self.target,
            "from_node_id": self.from_node_id or self.source,
            "to_node_id": self.to_node_id or self.target,
            "distance_km": self.distance_km,
            "length_meters": self.length_meters or round(self.distance_km * 1000.0, 1),
            "speed_limit_kmh": self.speed_limit_kmh,
            "average_speed_kmh": round(self.effective_speed_kmh, 2),
            "disruption_risk": self.disruption_risk,
            "status": self.status.value,
            "road_status": self.road_status or self.status.value,
            "road_condition": self.road_condition.value,
            "road_class": self.road_class,
            "name": self.name,
            "is_bidirectional": self.is_bidirectional,
            "landslide_prone": self.landslide_prone,
            "flood_prone": self.flood_prone,
            "geometry": self.geometry,
            "base_travel_time_hrs": round(self.base_travel_time_hrs, 3),
            "base_travel_time_seconds": round(self.base_travel_time_seconds, 1),
            "adjusted_travel_time_hrs": round(self.adjusted_travel_time_hrs, 3),
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "risk_penalty": self.risk_penalty,
            "route_eligible": self.route_eligible,
            "routing_recommendation": self.routing_recommendation,
            "incident_ids": list(self.incident_ids or []),
            "suggested_status": self.suggested_status,
            "suggested_risk_penalty": self.suggested_risk_penalty,
            "closure_probability": self.closure_probability,
            "predicted_delay_minutes": self.predicted_delay_minutes,
            "predicted_speed_kmh": self.predicted_speed_kmh,
            "eta_multiplier": self.eta_multiplier,
            "edge_cost_multiplier": self.edge_cost_multiplier,
            "prediction_confidence": self.prediction_confidence,
            "freshness_seconds": self.freshness_seconds,
            "stale": self.stale,
            "data_mode": self.data_mode,
            "traversable": self.traversable,
            "exclusion_reasons": list(self.exclusion_reasons or []),
        }


@dataclass
class RouteRequest:
    """
    Input request for route planning.
    """
    source_id: str
    destination_id: str
    commodity: CommodityPriority = CommodityPriority.GENERAL
    max_risk_tolerance: float = 1.0
    avoid_blocked: bool = True
    traffic_factor: float = 1.0  # 1.0 = normal, >1.0 = heavy traffic slowdown


@dataclass
class RouteResult:
    """
    Computed path metrics for a single route.
    """
    path_nodes: List[str]
    path_edges: List[Edge]
    total_distance_km: float
    base_travel_time_hrs: float
    adjusted_travel_time_hrs: float
    eta_hrs: float
    route_cost: float
    average_risk: float
    max_risk: float
    risk_level: str  # LOW, MODERATE, HIGH, SEVERE
    bottlenecks: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "path_nodes": self.path_nodes,
            "edge_ids": [e.id for e in self.path_edges],
            "total_distance_km": round(self.total_distance_km, 2),
            "base_travel_time_hrs": round(self.base_travel_time_hrs, 2),
            "adjusted_travel_time_hrs": round(self.adjusted_travel_time_hrs, 2),
            "eta_hrs": round(self.eta_hrs, 2),
            "route_cost": round(self.route_cost, 2),
            "average_risk": round(self.average_risk, 3),
            "max_risk": round(self.max_risk, 3),
            "risk_level": self.risk_level,
            "bottlenecks": self.bottlenecks,
        }


@dataclass
class RoutingResponse:
    """
    Final output contract containing primary and alternate routes with human-readable rationale.
    """
    recommended: Optional[RouteResult]
    alternate: Optional[RouteResult]
    estimated_travel_time_hrs: float
    risk_level: str
    reason: str
    is_prototype_estimate: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "recommended": self.recommended.to_dict() if self.recommended else None,
            "alternate": self.alternate.to_dict() if self.alternate else None,
            "estimated_travel_time_hrs": round(self.estimated_travel_time_hrs, 2),
            "risk_level": self.risk_level,
            "reason": self.reason,
            "is_prototype_estimate": self.is_prototype_estimate,
        }

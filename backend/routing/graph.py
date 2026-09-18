"""
Graph representation of the road network for NER-SHIELD.
Manages nodes and edges with dynamic GIS/AI attributes and revision tracking.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from .eligibility import apply_eligibility_to_edge
from .models import Edge, Node, RoadCondition, RoadStatus


def _clone_edge_attrs(edge: Edge, **overrides: Any) -> Dict[str, Any]:
    """Copy GIS/AI fields from an edge for reverse-edge construction."""
    fields = {
        "distance_km": edge.distance_km,
        "speed_limit_kmh": edge.speed_limit_kmh,
        "disruption_risk": edge.disruption_risk,
        "status": edge.status,
        "road_condition": edge.road_condition,
        "is_bidirectional": edge.is_bidirectional,
        "landslide_prone": edge.landslide_prone,
        "flood_prone": edge.flood_prone,
        "road_id": edge.road_id,
        "road_class": edge.road_class,
        "geometry": edge.geometry,
        "length_meters": edge.length_meters,
        "road_status": edge.road_status,
        "risk_score": edge.risk_score,
        "risk_level": edge.risk_level,
        "risk_penalty": edge.risk_penalty,
        "route_eligible": edge.route_eligible,
        "routing_recommendation": edge.routing_recommendation,
        "incident_ids": list(edge.incident_ids or []),
        "suggested_status": edge.suggested_status,
        "suggested_risk_penalty": edge.suggested_risk_penalty,
        "gis_penalty_applied": edge.gis_penalty_applied,
        "closure_probability": edge.closure_probability,
        "predicted_delay_minutes": edge.predicted_delay_minutes,
        "predicted_speed_kmh": edge.predicted_speed_kmh,
        "eta_multiplier": edge.eta_multiplier,
        "edge_cost_multiplier": edge.edge_cost_multiplier,
        "prediction_confidence": edge.prediction_confidence,
        "prediction_horizon_minutes": edge.prediction_horizon_minutes,
        "source": edge.source,
        "freshness_seconds": edge.freshness_seconds,
        "stale": edge.stale,
        "data_mode": edge.data_mode,
        "traversable": edge.traversable,
        "exclusion_reasons": list(edge.exclusion_reasons or []),
    }
    fields.update(overrides)
    return fields


class RoadNetwork:
    """
    Graph data structure representing the NER transport network.
    Supports dynamic updating of road conditions, blockage status, and AI risk outputs.
    """

    def __init__(self) -> None:
        self.nodes: Dict[str, Node] = {}
        self.edges: Dict[str, Edge] = {}
        self.adj: Dict[str, List[Edge]] = {}
        self.diagnostics: List[Dict[str, Any]] = []
        self.road_state_updated_at: Optional[str] = None
        self.risk_calculated_at: Optional[str] = None
        self.state_revision: int = 0
        self.graph_status: str = "empty"
        self.data_mode: Optional[str] = None
        self.source_status: Optional[str] = None
        self.stale: bool = False

    def bump_revision(self, reason: str = "state_change") -> int:
        self.state_revision += 1
        self.road_state_updated_at = datetime.now(timezone.utc).isoformat()
        self.diagnostics.append({"type": "revision", "reason": reason, "revision": self.state_revision})
        return self.state_revision

    def invalidate(self, reason: str = "invalidate") -> None:
        """Deterministic test-friendly graph invalidation."""
        self.bump_revision(reason)
        self.graph_status = "invalidated"

    def add_node(self, node: Node) -> None:
        self.nodes[node.id] = node
        if node.id not in self.adj:
            self.adj[node.id] = []

    def add_edge(self, edge: Edge, *, skip_invalid_geometry: bool = True) -> bool:
        """
        Add a road segment. Returns False if skipped due to invalid geometry/endpoints.
        """
        if edge.source not in self.nodes or edge.target not in self.nodes:
            self.diagnostics.append(
                {
                    "type": "skip_edge",
                    "edge_id": edge.id,
                    "reason": "missing_endpoint_nodes",
                    "source": edge.source,
                    "target": edge.target,
                }
            )
            return False

        if edge.geometry is not None:
            from backend.geospatial.geojson_utils import validate_geojson

            if not validate_geojson(edge.geometry):
                self.diagnostics.append(
                    {
                        "type": "skip_edge" if skip_invalid_geometry else "warn_geometry",
                        "edge_id": edge.id,
                        "reason": "invalid_geometry",
                    }
                )
                if skip_invalid_geometry:
                    edge.geometry = None
                # Still allow topological edge without geometry for routing

        edge.from_node_id = edge.from_node_id or edge.source
        edge.to_node_id = edge.to_node_id or edge.target
        edge.road_id = edge.road_id or edge.id
        if edge.length_meters is None:
            edge.length_meters = edge.distance_km * 1000.0

        apply_eligibility_to_edge(edge)

        self.edges[edge.id] = edge
        self.adj[edge.source].append(edge)

        if edge.is_bidirectional:
            reverse_id = f"{edge.id}_rev"
            rev_attrs = _clone_edge_attrs(
                edge,
                id=reverse_id,
                source=edge.target,
                target=edge.source,
                name=f"{edge.name} (Reverse)" if edge.name else reverse_id,
                from_node_id=edge.target,
                to_node_id=edge.source,
            )
            # Reverse geometry coordinates if present
            if edge.geometry and isinstance(edge.geometry.get("coordinates"), list):
                rev_geom = {
                    "type": "LineString",
                    "coordinates": list(reversed(edge.geometry["coordinates"])),
                }
                rev_attrs["geometry"] = rev_geom
            reverse_edge = Edge(**rev_attrs)
            apply_eligibility_to_edge(reverse_edge)
            self.edges[reverse_id] = reverse_edge
            self.adj[edge.target].append(reverse_edge)

        if self.graph_status in ("empty", "invalidated"):
            self.graph_status = "ready"
        return True

    def get_node(self, node_id: str) -> Optional[Node]:
        return self.nodes.get(node_id)

    def get_edge(self, edge_id: str) -> Optional[Edge]:
        return self.edges.get(edge_id)

    def get_neighbors(self, node_id: str) -> List[Edge]:
        return self.adj.get(node_id, [])

    def _pair_ids(self, edge_id: str) -> List[str]:
        ids = [edge_id]
        if edge_id.endswith("_rev"):
            ids.append(edge_id[:-4])
        else:
            ids.append(f"{edge_id}_rev")
        return ids

    def update_edge_status(self, edge_id: str, new_status: RoadStatus) -> bool:
        edge = self.edges.get(edge_id)
        if not edge:
            return False
        for eid in self._pair_ids(edge_id):
            e = self.edges.get(eid)
            if e:
                e.status = new_status
                e.road_status = new_status.value
                apply_eligibility_to_edge(e)
        self.bump_revision(f"status:{edge_id}={new_status.value}")
        return True

    def update_edge_risk(self, edge_id: str, new_risk: float) -> bool:
        edge = self.edges.get(edge_id)
        if not edge:
            return False
        clamped = max(0.0, min(1.0, new_risk))
        for eid in self._pair_ids(edge_id):
            e = self.edges.get(eid)
            if e:
                e.disruption_risk = clamped
                if e.risk_score is None:
                    e.risk_score = clamped
        self.bump_revision(f"risk:{edge_id}")
        return True

    def update_edge_condition(self, edge_id: str, new_condition: RoadCondition) -> bool:
        edge = self.edges.get(edge_id)
        if not edge:
            return False
        for eid in self._pair_ids(edge_id):
            e = self.edges.get(eid)
            if e:
                e.road_condition = new_condition
        self.bump_revision(f"condition:{edge_id}")
        return True

    def apply_edge_state(self, edge_id: str, **fields: Any) -> bool:
        """Apply arbitrary GIS/AI field updates to both directions."""
        edge = self.edges.get(edge_id)
        if not edge:
            # Also try by road_id
            for e in self.edges.values():
                if e.road_id == edge_id and not e.id.endswith("_rev"):
                    edge_id = e.id
                    edge = e
                    break
        if not edge:
            return False

        allowed = {
            "disruption_risk",
            "status",
            "road_condition",
            "road_status",
            "risk_score",
            "risk_level",
            "risk_penalty",
            "route_eligible",
            "routing_recommendation",
            "incident_ids",
            "suggested_status",
            "suggested_risk_penalty",
            "gis_penalty_applied",
            "closure_probability",
            "predicted_delay_minutes",
            "predicted_speed_kmh",
            "eta_multiplier",
            "edge_cost_multiplier",
            "prediction_confidence",
            "prediction_horizon_minutes",
            "source",
            "freshness_seconds",
            "stale",
            "data_mode",
            "traversable",
        }
        for eid in self._pair_ids(edge_id):
            e = self.edges.get(eid)
            if not e:
                continue
            for k, v in fields.items():
                if k not in allowed:
                    continue
                if k == "status" and isinstance(v, str):
                    try:
                        v = RoadStatus(v.upper() if v.upper() in RoadStatus.__members__ else v)
                    except Exception:
                        mapping = {
                            "BLOCKED": RoadStatus.BLOCKED,
                            "CLOSED": RoadStatus.BLOCKED,
                            "DISRUPTED": RoadStatus.RESTRICTED,
                            "RESTRICTED": RoadStatus.RESTRICTED,
                            "OPEN": RoadStatus.OPEN,
                            "HIGH_RISK_WARNING": RoadStatus.HIGH_RISK_WARNING,
                        }
                        v = mapping.get(str(v).upper(), e.status)
                if k == "road_condition" and isinstance(v, str):
                    try:
                        v = RoadCondition(v)
                    except Exception:
                        continue
                setattr(e, k, v)
            apply_eligibility_to_edge(e)

        self.bump_revision(f"state:{edge_id}")
        self.risk_calculated_at = datetime.now(timezone.utc).isoformat()
        return True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nodes": [n.to_dict() for n in self.nodes.values()],
            "edges": [
                e.to_dict()
                for edge_id, e in self.edges.items()
                if not e.id.endswith("_rev")
            ],
            "state_revision": self.state_revision,
            "road_state_updated_at": self.road_state_updated_at,
            "risk_calculated_at": self.risk_calculated_at,
            "graph_status": self.graph_status,
            "diagnostics": list(self.diagnostics),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RoadNetwork":
        network = cls()
        for nd in data.get("nodes", []):
            node = Node(
                id=nd["id"],
                name=nd["name"],
                lat=nd["lat"],
                lon=nd["lon"],
                district=nd.get("district", "Unknown"),
                state=nd.get("state", "Assam"),
                elevation_m=nd.get("elevation_m", 0.0),
            )
            network.add_node(node)

        for ed in data.get("edges", []):
            edge = Edge(
                id=ed["id"],
                source=ed["source"],
                target=ed["target"],
                distance_km=float(ed["distance_km"]),
                speed_limit_kmh=float(ed["speed_limit_kmh"]),
                disruption_risk=float(ed["disruption_risk"]),
                status=RoadStatus(ed.get("status", "OPEN")),
                road_condition=RoadCondition(ed.get("road_condition", "GOOD")),
                name=ed.get("name", ""),
                is_bidirectional=ed.get("is_bidirectional", True),
                landslide_prone=ed.get("landslide_prone", False),
                flood_prone=ed.get("flood_prone", False),
                road_id=ed.get("road_id"),
                geometry=ed.get("geometry"),
                risk_penalty=ed.get("risk_penalty"),
                suggested_risk_penalty=ed.get("suggested_risk_penalty"),
                suggested_status=ed.get("suggested_status"),
                route_eligible=ed.get("route_eligible"),
                closure_probability=ed.get("closure_probability"),
                traversable=ed.get("traversable"),
            )
            network.add_edge(edge)

        network.graph_status = "ready" if network.edges else "empty"
        return network

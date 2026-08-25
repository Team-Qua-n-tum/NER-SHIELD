"""
Graph representation of the road network for NER-SHIELD.
Manages nodes (intersections/locations) and edges (road segments) with dynamic attributes.
"""

from typing import Dict, List, Optional, Set, Any
from .models import Node, Edge, RoadStatus, RoadCondition


class RoadNetwork:
    """
    Graph data structure representing the transport network of North Eastern Region.
    Supports dynamic updating of road conditions, blockage status, and AI risk outputs.
    """

    def __init__(self) -> None:
        self.nodes: Dict[str, Node] = {}
        self.edges: Dict[str, Edge] = {}
        self.adj: Dict[str, List[Edge]] = {}

    def add_node(self, node: Node) -> None:
        """Add a location/intersection node to the graph."""
        self.nodes[node.id] = node
        if node.id not in self.adj:
            self.adj[node.id] = []

    def add_edge(self, edge: Edge) -> None:
        """
        Add a road segment edge to the graph.
        If bidirectional, adds both forward and reverse representations.
        """
        if edge.source not in self.nodes or edge.target not in self.nodes:
            raise ValueError(
                f"Cannot add edge '{edge.id}': source '{edge.source}' or target '{edge.target}' does not exist."
            )

        self.edges[edge.id] = edge
        self.adj[edge.source].append(edge)

        if edge.is_bidirectional:
            # Create dynamic reverse edge if bidirectional
            reverse_id = f"{edge.id}_rev"
            reverse_edge = Edge(
                id=reverse_id,
                source=edge.target,
                target=edge.source,
                distance_km=edge.distance_km,
                speed_limit_kmh=edge.speed_limit_kmh,
                disruption_risk=edge.disruption_risk,
                status=edge.status,
                road_condition=edge.road_condition,
                name=f"{edge.name} (Reverse)",
                is_bidirectional=True,
                landslide_prone=edge.landslide_prone,
                flood_prone=edge.flood_prone,
            )
            self.edges[reverse_id] = reverse_edge
            self.adj[edge.target].append(reverse_edge)

    def get_node(self, node_id: str) -> Optional[Node]:
        return self.nodes.get(node_id)

    def get_edge(self, edge_id: str) -> Optional[Edge]:
        return self.edges.get(edge_id)

    def get_neighbors(self, node_id: str) -> List[Edge]:
        """Return all outgoing edges from node_id."""
        return self.adj.get(node_id, [])

    def update_edge_status(self, edge_id: str, new_status: RoadStatus) -> bool:
        """
        Dynamically update accessibility status (e.g., mark road as BLOCKED or OPEN).
        Updates both directions if bidirectional edge.
        """
        edge = self.edges.get(edge_id)
        if not edge:
            return False

        edge.status = new_status
        rev_id = f"{edge_id}_rev" if not edge_id.endswith("_rev") else edge_id[:-4]
        if rev_id in self.edges:
            self.edges[rev_id].status = new_status

        return True

    def update_edge_risk(self, edge_id: str, new_risk: float) -> bool:
        """
        Update disruption risk score (0.0 to 1.0) coming from AI/GIS telemetry.
        """
        edge = self.edges.get(edge_id)
        if not edge:
            return False

        clamped_risk = max(0.0, min(1.0, new_risk))
        edge.disruption_risk = clamped_risk

        rev_id = f"{edge_id}_rev" if not edge_id.endswith("_rev") else edge_id[:-4]
        if rev_id in self.edges:
            self.edges[rev_id].disruption_risk = clamped_risk

        return True

    def update_edge_condition(self, edge_id: str, new_condition: RoadCondition) -> bool:
        """
        Update physical road surface condition.
        """
        edge = self.edges.get(edge_id)
        if not edge:
            return False

        edge.road_condition = new_condition
        rev_id = f"{edge_id}_rev" if not edge_id.endswith("_rev") else edge_id[:-4]
        if rev_id in self.edges:
            self.edges[rev_id].road_condition = new_condition

        return True

    def to_dict(self) -> Dict[str, Any]:
        """Serialize graph to dictionary structure."""
        return {
            "nodes": [n.to_dict() for n in self.nodes.values()],
            "edges": [
                e.to_dict()
                for edge_id, e in self.edges.items()
                if not e.id.endswith("_rev")
            ],
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RoadNetwork":
        """Build RoadNetwork instance from dictionary data."""
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
            )
            network.add_edge(edge)

        return network

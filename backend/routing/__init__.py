"""backend/routing package — GIS/AI-aware risk routing."""

from .config import ROUTING_ENGINE_VERSION, get_routing_engine_mode
from .graph_builder import invalidate_network_cache, simulate_road_closure

__all__ = [
    "ROUTING_ENGINE_VERSION",
    "get_routing_engine_mode",
    "invalidate_network_cache",
    "simulate_road_closure",
]

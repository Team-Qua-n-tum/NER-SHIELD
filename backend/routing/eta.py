"""
Dynamic ETA Engine for NER-SHIELD.
Calculates realistic estimated travel time factoring in road surface conditions, traffic,
and potential disruption delays (e.g. monsoons, hill delays, high risk corridors).
"""

from typing import Dict, Any, List
from .models import RouteResult, CommodityPriority, RoadStatus, RoadCondition


class ETAEngine:
    """
    Computes prototype Estimated Time of Arrival (ETA) with breakdown analysis.
    """

    PROTOTYPE_DISCLAIMER: str = (
        "PROTOTYPE ESTIMATE: Travel times are calculated using baseline road speeds, "
        "surface degradation factors, traffic multipliers, and AI disruption risk buffers."
    )

    def compute_route_eta(
        self,
        route: RouteResult,
        commodity: CommodityPriority = CommodityPriority.GENERAL,
        traffic_factor: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Calculate refined ETA with explicit delay component breakdown.
        """
        if not route.path_edges:
            return {
                "base_travel_time_hrs": 0.0,
                "surface_delay_hrs": 0.0,
                "traffic_delay_hrs": 0.0,
                "disruption_risk_buffer_hrs": 0.0,
                "total_eta_hrs": 0.0,
                "is_prototype_estimate": True,
                "disclaimer": self.PROTOTYPE_DISCLAIMER,
            }

        total_base_time = sum(e.base_travel_time_hrs for e in route.path_edges)
        total_surface_adjusted_time = sum(e.adjusted_travel_time_hrs for e in route.path_edges)

        # 1. Surface condition slowdown
        surface_delay = max(0.0, total_surface_adjusted_time - total_base_time)

        # 2. Traffic slowdown delay
        traffic_multiplier = max(1.0, traffic_factor)
        traffic_delay = total_surface_adjusted_time * (traffic_multiplier - 1.0)

        # 3. Disruption risk delay buffer (higher for sensitive goods like MEDICINE)
        disruption_risk_buffer = 0.0
        for edge in route.path_edges:
            edge_time = edge.adjusted_travel_time_hrs
            # Delays increase non-linearly on high-risk mountain/monsoon edges
            risk_delay = edge_time * (edge.disruption_risk ** 1.5) * 0.40 * commodity.delay_sensitivity_factor
            disruption_risk_buffer += risk_delay

        total_eta_hrs = total_surface_adjusted_time + traffic_delay + disruption_risk_buffer

        # Update ETA on the route result object as well
        route.eta_hrs = round(total_eta_hrs, 2)

        return {
            "base_travel_time_hrs": round(total_base_time, 2),
            "surface_delay_hrs": round(surface_delay, 2),
            "traffic_delay_hrs": round(traffic_delay, 2),
            "disruption_risk_buffer_hrs": round(disruption_risk_buffer, 2),
            "total_eta_hrs": round(total_eta_hrs, 2),
            "is_prototype_estimate": True,
            "disclaimer": self.PROTOTYPE_DISCLAIMER,
        }

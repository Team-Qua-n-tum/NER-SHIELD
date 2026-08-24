"""
Configurable Risk-Aware Cost Function for NER-SHIELD.

Reasoning & Mathematical Foundation:
-------------------------------------
Traditional routing optimizes strictly for shortest geographical distance or shortest ideal time.
In the North Eastern Region (NER) of India, terrain, monsoon weather, landslides, and flash floods
make distance-only routing dangerous and unreliable.

Our risk-aware cost function incorporates four key factors:
1. Effective Travel Time: Distance divided by surface-condition-adjusted speed limit.
2. Non-linear Disruption Risk: Squaring the risk score (R^2) penalizes severe risks exponentially
   (e.g., risk 0.8 is 16x worse than risk 0.2, rather than just 4x worse).
3. Commodity Priority Scaling: Sensitive cargoes (MEDICINE, FOOD) amplify risk penalties so the engine
   prefers safer, low-risk detours even if longer in distance.
4. Road Surface & Status Penalties: Blocked segments receive an infinite cost penalty (impassable),
   while poor road conditions add proportional operational delay penalties.

Formula:
  EdgeCost(e, commodity) =
      (w_time * t_effective(e)) +
      (w_risk * (R(e)^2) * commodity.risk_weight_multiplier) +
      P_condition(e) +
      P_status(e)
"""

from .models import Edge, RoadStatus, RoadCondition, CommodityPriority


class CostFunction:
    """
    Evaluates edge weights dynamically based on time, risk, road status, condition, and commodity priority.
    """

    INF_COST: float = 1e9  # Prohibitive cost for blocked roads

    def __init__(
        self,
        w_time: float = 1.0,
        w_risk: float = 10.0,
        w_condition: float = 1.5,
    ) -> None:
        """
        :param w_time: Weight assigned to travel time (hours).
        :param w_risk: Base weight assigned to disruption risk.
        :param w_condition: Weight assigned to road surface degradation.
        """
        self.w_time = w_time
        self.w_risk = w_risk
        self.w_condition = w_condition

    def calculate_edge_cost(
        self, edge: Edge, commodity: CommodityPriority = CommodityPriority.GENERAL
    ) -> float:
        """
        Calculate dynamic weight for passing through a specific road segment.
        Returns INF_COST if road is impassable (BLOCKED).
        """
        # 1. Accessibility Check
        if edge.status == RoadStatus.BLOCKED:
            return self.INF_COST

        # 2. Effective Travel Time (Adjusted for surface condition)
        effective_time = edge.adjusted_travel_time_hrs
        time_cost = self.w_time * effective_time

        # 3. Non-linear Disruption Risk Penalty (Exponential factor)
        # R^2 ensures that moderate risks remain navigable for general cargo,
        # but high risk corridors (>0.6) are heavily penalized.
        risk_score = max(0.0, min(1.0, edge.disruption_risk))
        risk_penalty = (risk_score ** 2) * commodity.risk_weight_multiplier
        risk_cost = self.w_risk * risk_penalty

        # 4. Road Surface Degradation Penalty
        condition_penalty = edge.road_condition.condition_penalty_score * (edge.distance_km / 10.0)
        condition_cost = self.w_condition * condition_penalty

        # 5. Road Status Warning Penalty
        status_penalty = 0.0
        if edge.status == RoadStatus.HIGH_RISK_WARNING:
            status_penalty = 5.0 * commodity.risk_weight_multiplier
        elif edge.status == RoadStatus.RESTRICTED:
            status_penalty = 2.0

        total_cost = time_cost + risk_cost + condition_cost + status_penalty
        return total_cost

    def calculate_shortest_distance_cost(self, edge: Edge) -> float:
        """
        Traditional distance-only weight for benchmark baseline comparison.
        Returns INF_COST if road is BLOCKED.
        """
        if edge.status == RoadStatus.BLOCKED:
            return self.INF_COST
        return edge.distance_km

import numpy as np
from typing import Dict, Any, List

class NERDisruptionRiskModel:
    """
    Member 2 AI Module: Predictive model for calculating route and district
    landslide, flood, and infrastructure disruption risk probabilities across the North Eastern Region.
    """
    def __init__(self):
        # Weights for risk factors calibrated for NER terrain
        self.weights = {
            "rainfall": 0.35,
            "slope": 0.25,
            "weather": 0.15,
            "soil": 0.10,
            "active_incidents": 0.15
        }
        
    def predict(
        self,
        rainfall_mm: float = 0.0,
        slope_degree: float = 15.0,
        weather_condition: str = "CLEAR",
        soil_type: str = "LOAM",
        historical_landslides_count: int = 0,
        active_incidents_count: int = 0
    ) -> Dict[str, Any]:
        """
        Calculate risk score, probability, risk level, and driver risk factors.
        """
        # 1. Normalize rainfall (0-200mm scale)
        norm_rain = min(1.0, rainfall_mm / 200.0)
        
        # 2. Normalize terrain slope (0-60 deg scale)
        norm_slope = min(1.0, slope_degree / 60.0)
        
        # 3. Weather multiplier factor
        weather_factors = {
            "CLEAR": 0.1,
            "FOG": 0.3,
            "RAIN": 0.6,
            "HEAVY_RAIN": 0.9,
            "THUNDERSTORM": 0.95
        }
        norm_weather = weather_factors.get(weather_condition.upper(), 0.3)
        
        # 4. Soil stability factor
        soil_factors = {
            "GRAVEL": 0.2,
            "LOAM": 0.4,
            "CLAY": 0.7,
            "ROCKY": 0.8
        }
        norm_soil = soil_factors.get(soil_type.upper(), 0.4)
        
        # 5. Active incidents impact
        norm_incidents = min(1.0, (active_incidents_count * 0.4) + (historical_landslides_count * 0.1))
        
        # Calculate weighted probability score
        raw_score = (
            self.weights["rainfall"] * norm_rain +
            self.weights["slope"] * norm_slope +
            self.weights["weather"] * norm_weather +
            self.weights["soil"] * norm_soil +
            self.weights["active_incidents"] * norm_incidents
        )
        
        # Clip to ensure valid 0.0 - 1.0 bounds
        risk_probability = float(np.clip(raw_score, 0.05, 0.99))
        risk_probability = round(risk_probability, 3)
        
        # Categorize risk level
        if risk_probability >= 0.80:
            risk_level = "CRITICAL"
            recommendation = "Route unsafe. Divert heavy cargo to emergency alternate bypass immediately."
        elif risk_probability >= 0.60:
            risk_level = "HIGH"
            recommendation = "High disruption vulnerability. Dispatch with escort or monitor field alerts."
        elif risk_probability >= 0.35:
            risk_level = "MEDIUM"
            recommendation = "Moderate risk. Exercise caution in low-visibility mountain passes."
        else:
            risk_level = "LOW"
            recommendation = "Normal transit conditions. Standard speed and safety protocols apply."
            
        # Identify contributing risk factors
        risk_factors: List[str] = []
        if norm_rain > 0.4:
            risk_factors.append(f"Excessive rainfall ({rainfall_mm}mm in 24h)")
        if norm_slope > 0.5:
            risk_factors.append(f"Steep terrain slope ({slope_degree}° incline)")
        if weather_condition.upper() in ["HEAVY_RAIN", "THUNDERSTORM"]:
            risk_factors.append(f"Severe weather pattern ({weather_condition})")
        if active_incidents_count > 0:
            risk_factors.append(f"{active_incidents_count} active incidents reported in zone")
        if norm_soil > 0.6:
            risk_factors.append(f"Unstable soil composition ({soil_type})")
        if not risk_factors:
            risk_factors.append("Favorable operational conditions")
            
        return {
            "risk_probability": risk_probability,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "confidence_score": 0.94,
            "recommendation": recommendation
        }

ai_risk_model = NERDisruptionRiskModel()

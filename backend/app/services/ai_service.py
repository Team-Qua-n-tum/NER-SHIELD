from backend.ai.risk.model import ai_risk_model
from backend.app.schemas.risk import RiskPredictionRequest, RiskPredictionResponse

class AIService:
    @staticmethod
    def predict_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
        result = ai_risk_model.predict(
            rainfall_mm=request.rainfall_mm,
            slope_degree=request.slope_degree,
            weather_condition=request.weather_condition,
            soil_type=request.soil_type,
            historical_landslides_count=request.historical_landslides_count,
            active_incidents_count=request.active_incidents_count
        )
        return RiskPredictionResponse(**result)

ai_service = AIService()

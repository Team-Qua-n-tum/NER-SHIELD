from fastapi import APIRouter
from backend.app.schemas.risk import RiskPredictionRequest, RiskPredictionResponse
from backend.app.services.ai_service import ai_service

router = APIRouter()

@router.post("/risk/predict", response_model=RiskPredictionResponse, summary="Predict disruption risk probability via AI model")
def predict_risk(request: RiskPredictionRequest):
    return ai_service.predict_risk(request)

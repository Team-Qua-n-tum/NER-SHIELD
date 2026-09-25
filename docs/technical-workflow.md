# Technical Workflow & Contributing

## Code Organization
- **`/backend`**: FastAPI application, domain services, AI modules, and geospatial utilities.
- **`/frontend`**: React + Vite SPA with Leaflet integration.
- **`/tests`**: Comprehensive test suites (Pytest and Vitest).
- **`/data`**: GeoJSON, synthetic mock telemetry, and AI training datasets.

## Development Loop
1. Ensure `DEMO_MODE=true` in backend `.env` during UI/UX work to skip DB dependencies.
2. Run tests via `pytest tests/` and `npm run test` in the frontend directory.
3. Validate routing logic changes using the mock provider before switching to OSRM.

## AI Model Updates
- Place updated `.joblib` or `.pkl` files in `backend/ml/models/`.
- The `ETAPredictor` and `RiskEngine` will automatically load models if paths are configured in environment variables.

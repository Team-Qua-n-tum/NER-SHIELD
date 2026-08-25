# NER-SHIELD API Reference

Base Path: `/api/v1`

## Health & Telemetry
- `GET /health` : Core system health.
- `GET /api/v1/health` : Detailed V1 health & connection status.

## Field Incidents
- `GET /incidents` : List all active incidents.
- `POST /incidents` : Report new field incident.
- `GET /incidents/{id}` : Get incident details.
- `PATCH /incidents/{id}/status` : Update resolution status.

## Geographic Data
- `GET /districts` : NER administrative districts.
- `GET /roads` : Strategic road corridors.

## Logistics & Fleet
- `GET /vehicles` : Active logistics vehicles telemetry.
- `GET /alerts` : System alerts and hazard warnings.
- `GET /dashboard` : Aggregated statistics.

## AI & Routing
- `POST /risk/predict` : Run localized AI risk inference.
- `POST /routes/recommend` : Computes safe logistics routes factoring terrain and hazards.
- `POST /routes/plan` : Alias for route recommendation.

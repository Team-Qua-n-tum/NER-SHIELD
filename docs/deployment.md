# NER-SHIELD Deployment Guide

## Prerequisites
- Node.js v18+
- Python 3.10+
- (Optional) PostgreSQL 13+ with PostGIS

## Local Development (Demo Mode)

Use the documented [local development flow](local-development.md). The
repeatable Docker command is:

```bash
docker compose up --build
```

It exposes the frontend on port 5173 and the backend on port 8000.

## Production Deployment (Docker Compose)
A `docker-compose.yml` file is provided for isolated production builds.
```bash
docker compose up --build -d
```
This spins up:
- FastAPI Backend (Port 8000)
- React/Nginx Frontend (Port 5173)

The default compose file is demo-only and does not start a database.

## Environment Variables
See `.env.example` and `frontend/.env.example` for configurable variables.
`VITE_API_URL` always includes `/api/v1`; backend-only settings must not use
the `VITE_` prefix.

## Live-pilot prerequisites

Set `DEMO_MODE=false` only after providing `DATABASE_URL`,
`WEATHER_API_URL`, and `ROUTING_API_URL`, and configure CORS for the deployed
frontend origin. The repository currently requires the live ORM models
package before database persistence can be initialized. No synthetic fallback
is used in frontend live mode.

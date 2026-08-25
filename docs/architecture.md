# NER-SHIELD Architecture

## Overview
NER-SHIELD is an AI-based Smart Logistics & Accessibility Intelligence Platform for the North Eastern Region of India.

The platform relies on a distributed but tightly coupled architecture featuring:
1. **Frontend**: React (Vite) + React Leaflet for GIS Operations Map
2. **Backend**: FastAPI + Python for high-performance geospatial processing
3. **Database**: PostgreSQL with PostGIS (Optional / Demo Mode fallback to in-memory store)
4. **AI/ML Engine**: Scikit-Learn based Risk modeling + Heuristic/ML ETA prediction
5. **Routing Engine**: Custom Dijkstra graph-search + Mock/OSRM external provider integration

## Core Components
- **API Gateway**: FastAPI handles routing and validation.
- **Service Layer**: Coordinates business logic and repository access.
- **Geospatial Utilities**: Pure-Python WGS-84 operations (`coordinate_utils`, `hazard_buffer`, `spatial_queries`).
- **Resilient Frontend**: Automatically falls back to offline/local data when the backend goes down (`ApiClient`).

## Data Flow
1. Field officers submit incidents via Frontend.
2. Backend API validates and normalizes coordinates.
3. Incidents update the shared Database or DataStore.
4. Logistics engine replans routes factoring in new hazard zones using AI risk scoring.
5. The Operations Map fetches new telemetry and live-updates the view.

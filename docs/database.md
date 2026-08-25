# NER-SHIELD Database Schema

The platform supports two modes of data persistence:

1. **DEMO_MODE=true**: Uses an in-memory singleton `DataStore`. This avoids complex setups during evaluations or demonstrations.
2. **DEMO_MODE=false**: Uses SQLAlchemy ORM with PostgreSQL and PostGIS.

## ORM Models

- **Road**: Represents strategic highway corridors (includes `GeoAlchemy2` LINESTRING).
- **Incident**: Geo-tagged field reports (landslides, roadblocks) with POINT geometry.
- **Vehicle**: Live logistics fleet tracking.
- **WeatherObservation**: Historic and active meteorological data.
- **RiskRecord**: AI prediction audit trail.
- **RouteRecord**: Re-playable logistics routing plans.

## Migration

In non-demo mode, the database initializes tables on startup via `Base.metadata.create_all(bind=engine)`.

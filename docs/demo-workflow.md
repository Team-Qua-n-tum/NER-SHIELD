# NER-SHIELD Demo Workflow

This document outlines the ideal flow for presenting NER-SHIELD to evaluators.

## 1. Dashboard Overview

- Open the application at `http://localhost:5173`.
- Highlight the **Live GIS Map** tracking the North Eastern Region.
- Note the top KPI indicators: Total Corridors, Active Incidents, Fleet Status.

## 2. Field Incident Reporting

- Click the "Report Incident" or "Submit Ground Report" button.
- Fill out a simulated Landslide in "Dima Hasao" on NH-27.
- Emphasize the offline-first/resilience capability (works in low-bandwidth).
- Submit the report and watch it appear instantly on the Operations Map.

## 3. AI Risk Assessment & Routing

- Select the affected corridor on the map.
- Show the **AI Hazard Assessment** calculating in real-time.
- Demonstrate how the system automatically flags the route as "🔴 Primary (Blocked)" and calculates a "🟢 AI-Safe Bypass".
- Point out the dynamic **ETA Predictions** that factor in terrain slope, vehicle type, and rainfall data.

## 4. Resilience (Demo Mode)

- Explain that the app is running in `DEMO_MODE=true` seamlessly without a complex database backend, but is fully enterprise-ready with PostgreSQL/PostGIS.

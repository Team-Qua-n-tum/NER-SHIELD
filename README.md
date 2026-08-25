# NER-SHIELD

## AI-Based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region (NER)

**SIH Problem Statement:** SIH26002
**Theme:** Smart Automation
**Category:** Software

## About

NER-SHIELD is an AI-powered platform designed to improve logistics and transportation accessibility across the North Eastern Region of India.

It monitors road accessibility, weather conditions, incidents, vehicle movement, and disruption risks to help users identify safer routes and respond to logistics disruptions.

## Key Features

* 🗺️ GIS-based road and accessibility monitoring
* 🤖 AI-based disruption and risk prediction
* 🚚 Vehicle and logistics tracking
* 🛣️ Risk-aware alternate route recommendations
* 🌧️ Weather and incident analysis
* 🚨 Automated disruption alerts
* 📍 Geo-tagged field incident reporting
* 📊 Centralized logistics dashboard
* 📱 Support for low-connectivity/offline field reporting

## Technology Stack

### Frontend

* React / Next.js
* TypeScript
* Tailwind CSS
* Leaflet

### Backend

* Python
* FastAPI

### AI/ML

* Python
* Pandas
* NumPy
* Scikit-learn

### Database

* PostgreSQL
* PostGIS

### Tools

* GitHub
* Docker
* OpenStreetMap

## Documentation

For deep-dives into the architecture, deployment, and APIs, refer to our detailed documentation:
- [Architecture](docs/architecture.md)
- [Database Schema](docs/database.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)
- [Demo Workflow](docs/demo-workflow.md)

## Quick Start (Demo Mode)

The platform is designed to be easily testable without a complex PostGIS setup using `DEMO_MODE=true`.

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Workflow

```text
Weather / Incidents / Road Data
              ↓
       AI Risk Analysis
              ↓
    Road Accessibility Status
              ↓
    Risk-Aware Route Planning
              ↓
        ETA Prediction
              ↓
     Vehicle & Logistics Alerts
              ↓
       GIS Dashboard
```

## Team

### Team Quantum

Developed for **Smart India Hackathon 2026 — SIH26002**.

> *From disruption detection to intelligent logistics decisions.*

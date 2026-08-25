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

---

## 🛠️ DevOps & QA Guide

### 🚀 Running the Project (Minimal Setup)

#### Method 1: Using Docker Compose (Recommended)
You can launch both the frontend and backend with a single command:
```bash
docker-compose up --build
```
Once started:
- **Frontend Dashboard:** [http://localhost](http://localhost) (also mapped to [http://localhost:5173](http://localhost:5173))
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)

#### Method 2: Running Locally (Without Docker)

**Backend Setup:**
1. Navigate to the backend folder and create a virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   ```
2. Activate the virtual environment:
   - **Windows:** `.venv\Scripts\activate`
   - **macOS/Linux:** `source .venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

**Frontend Setup:**
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

---

### ⚙️ Environment Configuration
Copy the `.env.example` file in the root directory to `.env`:
```bash
cp .env.example .env
```
Key configuration settings:
- `VITE_API_URL`: Path to backend API router (e.g. `http://localhost:8000/api/v1`).
- `DEMO_MODE`: Set to `true` (default) to run the platform on pre-populated thread-safe in-memory GIS seed data. Set to `false` to attempt connection to external live telemetry APIs.

---

### 🧪 Running Tests & Validation

#### 1. Backend Test Suite (Pytest)
Run unit and algorithmic tests:
```bash
python -m pytest
```

#### 2. E2E Integration Flow Test
Verify the complete user journey (dashboard loading, risk checking, route optimizer recommendations, and ETA response):
```bash
python -m pytest tests/test_integration_flow.py -v
```

#### 3. Health Check Script
Run the automated system-wide diagnostics script to verify availability of frontend, backend, AI models, and database mock connections:
```bash
python tests/health_check.py
```

---

### 🗺️ Architecture Overview
NER-SHIELD is split into two isolated services:
1. **Frontend (Vite/React/Leaflet):** Renders interactive map, district accessibility metrics, and route compared views. Deploys statically (compiled and served via Nginx in Docker, or via Vercel).
2. **Backend (FastAPI/Scikit-learn/Joblib):** Drives the GIS querying, real-road OSRM routing cost solver, and ML-based disruption probability calculations.

---

### ⚠️ Known Limitations & Hacks
- **Database Persistence:** By default, backend state (such as registered vehicles and submitted incident reports) uses a thread-safe in-memory store. Restarting the backend service resets dynamic updates. Set up Spanner, Spanner PostgreSQL, or standard Postgres for persistent storage.
- **Routing Source:** Alternates between synthetic route waypoints and cartographic real-road networks for fallback capability.


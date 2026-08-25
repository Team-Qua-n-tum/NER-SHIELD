# NER-SHIELD Deployment Guide

## Prerequisites
- Node.js v18+
- Python 3.10+
- (Optional) PostgreSQL 13+ with PostGIS

## Local Development (Demo Mode)
1. **Clone and Install Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
2. **Clone and Install Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Production Deployment (Docker Compose)
A `docker-compose.yml` file is provided for isolated production builds.
```bash
docker-compose up --build -d
```
This spins up:
- FastAPI Backend (Port 8000)
- React Frontend (Port 80)
- PostgreSQL Database (Port 5432)

## Environment Variables
See `.env.example` for all configurable variables including `DATABASE_URL`, `DEMO_MODE`, and `WEATHER_API_URL`.

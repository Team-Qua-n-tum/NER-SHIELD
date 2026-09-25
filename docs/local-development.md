# Local development and demo

## Fastest demo (Docker)

From the repository root:

```powershell
docker compose up --build
```

Open the frontend at <http://127.0.0.1:5173>, the backend at
<http://127.0.0.1:8000>, and API documentation at
<http://127.0.0.1:8000/docs>. The compose demo sets `DEMO_MODE=true`, uses
the in-memory seed store, and does not require Postgres, Firebase Admin
credentials, weather keys, or routing keys.

## Local processes

Configure the Python environment, then run the backend from the repository
root so the `backend.app` package resolves:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

The frontend convention is `VITE_API_URL=http://localhost:8000/api/v1`.
Every API wrapper passes a path relative to that prefix; do not append
`/api/v1` to individual wrapper paths. Vite reads `.env` values at startup,
so restart the dev server after changing them.

## Demo accounts

Demo accounts are synthetic UI sessions only. They do not authenticate with
the backend and must not be used for production access. The login page labels
the session as demo mode and the backend responses identify their `data_mode`
as `demo`.

## Validation

```powershell
.\.venv\Scripts\python.exe -m pytest tests\api tests\routing tests\ai tests\geospatial -v --tb=short
cd frontend
npm test -- --run
npm run build
npm run lint
```

# Troubleshooting

## Frontend shows API 404s

Confirm the backend is running on port 8000 and that
`frontend/.env` contains exactly:

```text
VITE_API_URL=http://localhost:8000/api/v1
```

Restart Vite after changing the file. Requests such as
`/routes/plan` should resolve to `/api/v1/routes/plan`; a repeated
`/api/v1/api/v1` indicates that the prefix was added to a wrapper path.

## CORS errors

Set `BACKEND_CORS_ORIGINS` to a comma-separated list of the actual browser
origins, including both `http://localhost:5173` and
`http://127.0.0.1:5173` when both are used. Do not use `*` with credentialed
requests.

## Live mode is unavailable

`DEMO_MODE=false` requires `DATABASE_URL`, `WEATHER_API_URL`, and
`ROUTING_API_URL`. The backend reports `degraded` or `unavailable` rather than
silently returning synthetic data. The current repository does not include
the live ORM models package, so database persistence remains a known
live-pilot prerequisite.

## Map or notifications do not load

The map falls back to OpenStreetMap when no commercial tile configuration is
provided. Firebase notification permission is requested only after a user
action. Leave Firebase variables blank to disable FCM; login and dashboards
continue to work. The service worker receives browser-safe Firebase
configuration at runtime and contains no committed credentials.

## Deep-link refresh returns 404

The Vite dev server and the bundled Nginx configuration both fall back to
`index.html`. For another static host, configure its SPA history fallback to
serve `index.html` for `/login` and `/app/*`.

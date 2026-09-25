# NER-SHIELD Supabase Live-Pilot Plan

**Status:** Plan only — no Supabase init, migrations, or frontend Supabase client in this audit.  
**Target architecture:** `React/Vite → FastAPI → Supabase PostgreSQL/PostGIS`

---

## Explicit rule: frontend must not query operational Supabase tables directly

| Allowed | Forbidden |
|---------|-----------|
| Browser → FastAPI (`VITE_API_URL` / `/api/v1`) | Browser → Supabase PostgREST for roads/incidents/vehicles/routes |
| Supabase Auth JWT **validated by FastAPI** (if chosen) | Embedding service-role keys in Vite |
| Map tiles / Firebase messaging as today | Direct SQL from the client |

**Evidence today:** zero Supabase SDK usage under `frontend/`. Keep it that way for operational data.

---

## Present vs missing vs proposed

| Area | Present | Missing | Proposed |
|------|---------|---------|----------|
| FastAPI surface + Pydantic schemas | Yes | Auth routes | Keep BFF |
| In-memory `DataStore` demo | Yes | — | Retain behind `DEMO_MODE=true` |
| SQLAlchemy engine scaffold | Yes (`database.py`) | ORM models on disk; migrations; `init_db` on startup | Restore models; Alembic or SQL init; wire services |
| Logistics CRUD → DB | Docs claim live | Always `db_store` | Repositories + service switch |
| Operational bbox lists | Demo uses store; live returns `[]` | PostGIS queries | Wire geospatial repo |
| Notifications DB path | Repo exists | Auth on send | Gate + Supabase DB |
| Frontend auth UI | AuthContext + demo | Backend `/auth/*` | Implement + stop silent mock in live |
| Server JWT / roles / district scope | — | Entirely | Required for pilot |
| Compose PostGIS | — | No postgres service in demo compose | External Supabase or local PostGIS |

---

## Authentication recommendation

### Option A — Supabase Auth + FastAPI JWT validation

- Supabase issues JWTs; FastAPI verifies JWKS / secret; maps `sub` → `profiles`.
- Pros: hosted login, refresh, less custom password storage.
- Cons: another vendor surface; frontend must not use Supabase for **data**.

### Option B — FastAPI-issued JWT

- `POST /api/v1/auth/login` as already assumed by `authApi.js`.
- Pros: matches existing frontend contract; single trust boundary.
- Cons: password/reset/MFA to build or integrate.

### Recommendation (based on code evidence)

**Prefer Option B (FastAPI JWT) for the first live-pilot**, because:

1. Frontend already codes against `/auth/login|logout|refresh|me`.
2. Backend has **no** Supabase client or auth settings today.
3. Keeps one authorization middleware on all ops routes.

Revisit Supabase Auth later if DoNER SSO/hosted IdP is required — still validate tokens only in FastAPI; still no direct table access from React.

---

## Required tables / models

| Table | Purpose |
|-------|---------|
| `profiles` | User id, email, name, status |
| `role_assignments` | user ↔ role |
| `district_assignments` | user ↔ district_ids |
| `vehicle_assignments` | user ↔ vehicle_ids |
| `roads` | Road segments + status + PostGIS geometry |
| `incidents` | Reports, verification, geometry/point |
| `road_status_events` | Append-only status history |
| `vehicles` | Fleet + last known position |
| `weather_observations` | Weather inputs for risk |
| `risk_records` | Scored risk per road/time |
| `route_records` | Planned/recalculated routes + metadata |
| `alerts` | Alert payloads + audience |
| `audit_logs` | Who/what/when for mutations |
| `notification_devices` | FCM tokens (repo already sketched) |

Docs/tests reference ORM names (`Road`, `Incident`, `Vehicle`, …) but **`backend/app/models/` is empty/missing on disk** — restore before live-pilot.

---

## PostGIS requirements and spatial indexes

- Enable `CREATE EXTENSION postgis;`
- Geometry columns: roads (LineString), incidents/vehicles (Point), optional district polygons
- Indexes: `GIST` on geometries; btree on `district_id`, `status`, `updated_at`
- API: bbox queries (`ST_MakeEnvelope` + `ST_Intersects`) for map layers
- Keep coordinate contract: GeoJSON `[lon, lat]`

---

## Migration plan: demo / in-memory → live-pilot

1. **Restore ORM models** and ensure git tracks `backend/app/models/`.
2. **Point `DATABASE_URL`** at Supabase Postgres (pooler or direct); enable PostGIS.
3. **Migrations** (Alembic preferred) creating tables + indexes.
4. **Wire services** when `DEMO_MODE=false`:
   - `logistics_service` → repositories (stop forever-`db_store`)
   - `operational_service` / `risk_context_service` → real queries (stop empty lists)
5. **Auth middleware** on mutating + sensitive GETs; attach role/district claims.
6. **Frontend:** set `DEMO_MODE=false` in `demoUsers.js` only when `/auth/login` works; **disable ApiClient mock fallback** in live builds; hydrate AppContext from APIs; attach `Authorization` header.
7. **IA fix** (nested routes) so ops demos are navigable.
8. **Pilot acceptance tests** (below) before declaring live.

---

## Seed / import plan

| Dataset | Source | Notes |
|---------|--------|-------|
| Districts | Current `db_store` / GeoJSON seeds | Stable IDs (`dist-guwahati`, …) |
| Roads | Seed corridors NH-6 / NH-27 etc. | Status open by default |
| Demo incidents/vehicles | Optional pilot fixtures | Tag `seed=true` |
| Users | Admin-created profiles + assignments | No demo passwords in prod |
| Risk/weather | Provider-backed after roads exist | |

Keep seed scripts idempotent; never overwrite live incident history on redeploy.

---

## Demo-mode fallback policy

| Mode | Backend | Frontend |
|------|---------|----------|
| `DEMO_MODE=true` | In-memory store OK | Explicit DEMO badge; mock fallback **allowed** and labelled |
| `DEMO_MODE=false` | Postgres/PostGIS required | **No** silent mock substitution; errors visible; auth required |

Mixing live UI with mock route geometry is **forbidden** for pilot demos to evaluators.

---

## Rollback plan

1. Set `DEMO_MODE=true` on API; redeploy previous image.  
2. Frontend env: point to demo API; re-enable demo login flag if needed.  
3. Do not drop Supabase schemas on rollback — only switch app flag.  
4. Keep DB backups before migration apply.  
5. Feature-flag route planner if graph unstable.

---

## Security model

- TLS to API; CORS allowlist pilot origins only.
- Bearer JWT on all ops endpoints; reject missing/invalid.
- Enforce role + district/vehicle scope in services (not only UI).
- Service-role Supabase key **only** on server.
- Firebase admin credentials server-only; web config public OK; SW should not hardcode forever — inject at build/runtime safely.
- Audit log for verify, road status, route dispatch, alert broadcast.
- Rate-limit auth and incident POST.
- Viewer payloads scrubbed of sensitive GPS precision if required by policy.

---

## Acceptance tests for live-pilot

1. Unauthenticated `GET /incidents` → **401/403** (not 200 with data).  
2. Field officer login → create incident → appears in district queue for assigned district only.  
3. Other district officer cannot verify foreign incident.  
4. Logistics recommend → `success` with geometry; after closure → alternate or `no_route` **without** fake polyline.  
5. Map bbox returns subset; full dump not required for first paint.  
6. Frontend with stopped API shows **error**, not mock fleet.  
7. Notification register requires auth; token not logged.  
8. `DEMO_MODE=false` without DB fails fast at startup (already partially validated in settings).  
9. Logout clears session; protected routes redirect to `/login`.  
10. Public `/` shows no live layers.

---

## Minimum backend work checklist

- [ ] Restore models + migrations + PostGIS  
- [ ] Implement auth login/me/refresh/logout + JWT dependency  
- [ ] Scope repositories by assignment  
- [ ] Switch logistics/operational/risk off empty/`db_store` in live  
- [ ] Persist incidents, road status events, routes, audit  
- [ ] Protect notifications send/register  
- [ ] Document env vars (names only): `DATABASE_URL`, `DEMO_MODE`, JWT secret, weather/routing, Firebase admin, `VITE_API_URL` (**include `/api/v1`**)

---

## Frontend work (FastAPI-only) for pilot readiness

- [ ] Fix AppShell routes vs `App.jsx` registration (see IA doc)  
- [ ] Hydrate from APIs; remove silent live fallback  
- [ ] Attach Bearer token in `ApiClient`  
- [ ] Unify route response adapter to `RouteResponse`  
- [ ] Gate AppContext operational data behind auth  
)

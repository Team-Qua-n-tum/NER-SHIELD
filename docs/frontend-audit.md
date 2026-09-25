# NER-SHIELD Frontend Architecture Audit

**Audit date:** 2026-09-25  
**Branch:** `feature/frontend`  
**Scope:** Read-only frontend/product architecture audit. No UI redesign. No backend mutations. No Supabase migration.

**Working tree at audit start:** dirty — modified `.gitignore`, `package-lock.json` (left untouched).

---

## Executive summary

The frontend is a **partial dual-generation SPA**: a newer AuthContext + RoleRoute + AppShell stack sits beside an older Navbar/Sidebar + `activeTab` dashboard stack. Both share **AppContext seeded with static mock operational data**.

Users perceive “all navbar links go to the same place” because of **three compounding defects**:

1. **AppShell advertises nested URLs that are not registered** (`/app/admin/map`, `/app/field/report`, …). Unmatched paths hit `path="*"` → `/` → authenticated Home redirects back to the role home — **bounce to the same dashboard**.
2. **In-page `activeTab` switching** changes content without changing the URL on Admin/Field/District/Logistics and legacy dashboards.
3. **Legacy `common/Navbar` links use `/admin`, `/driver`, …** which redirect to `/app/*`, while **active-state checks compare the pre-redirect path**, and role switching calls a **no-op `setRole`**.

Public `/` and `/login` correctly avoid live operational chrome. However, **AppProvider mounts mock vehicles/incidents/alerts for the entire tree**, backend APIs have **no JWT/role/district authorization**, and **ApiClient silently substitutes mock data on any failure** even when not in a deliberate demo session. The product therefore feels vibe-coded: polished chrome, disconnected navigation, synthetic data that masks backend failure, and demos that cannot become a live pilot without structural rebuild of routing IA, data hydration, and server auth.

---

## Current frontend architecture map

```
React 19 + Vite 8
├── main.jsx
│   ├── firebase.js (env-based init side-effect)
│   └── App.jsx
│       ├── AuthProvider (sessionStorage, demo/live login)
│       └── AppProvider (ALWAYS seeds data/* + mockData)
│           └── BrowserRouter
│               ├── PUBLIC:  /, /login, /denied
│               ├── ROLE:    /app/{admin|district|field|logistics|viewer}
│               ├── OPS:     /app/{map|risk|analyzer|incidents}
│               ├── LEGACY:  /admin|/driver|/officer|/supply|/map|... → Navigate /app/*
│               └── *:       Navigate → /
│
├── Layout generation A (new): AppShell (role-specific nested path Links)
├── Layout generation B (legacy): common/Navbar + common/Sidebar (path Links)
├── Layout generation C (dashboard Sidebar): activeTab buttons only
│
└── Data path
    ├── Intended: lib/api/* → FastAPI /api/v1
    └── Actual dominant: AppContext static imports + ApiClient fallback mocks
```

| Layer | Key files | Notes |
|-------|-----------|-------|
| Router | `frontend/src/App.jsx` | `react-router-dom` v7 `BrowserRouter` + `Routes`/`Route`/`Navigate` |
| Auth | `context/AuthContext.jsx`, `lib/api/authApi.js`, `lib/demoUsers.js` | UI session; `DEMO_MODE=true` hardcoded |
| Ops state | `context/AppContext.jsx` | Mock-first; auth shims; `setRole` no-op |
| Guards | `components/auth/ProtectedRoute.jsx`, `RoleRoute.jsx` | UI-only |
| API | `lib/api/client.js` + domain wrappers | Base includes `/api/v1`; silent fallback |
| Maps | `components/map/*`, `dashboard/OperationsMap.jsx` | Static GeoJSON; OSM fallback |
| Push | `lib/firebase.js`, `public/firebase-messaging-sw.js` | SW hardcodes config |

**No** `createBrowserRouter` / data routers. **No** Vite `server.proxy`. **No** Playwright/e2e folder.

---

## Navigation and route inventory table

### Registered routes (`App.jsx`)

| URL | Component (default export) | Auth |
|-----|----------------------------|------|
| `/` | `Home` | Public |
| `/login` | `Login` | Public |
| `/denied` | `PermissionDenied` | Public |
| `/app/admin` | `AdminDashboard` → `RoleRoute(['admin'])` | Protected |
| `/app/district` | `DistrictOfficerDashboard` → `RoleRoute(['district_officer'])` | Protected |
| `/app/field` | `FieldOfficerDashboard` → `RoleRoute(['field_officer'])` | Protected |
| `/app/logistics` | `LogisticsOperatorDashboard` → `RoleRoute(['logistics_operator'])` | Protected |
| `/app/viewer` | `ViewerDashboard` → `RoleRoute(['viewer'])` | Protected |
| `/app/map` | `MapPage` → `RoleRoute(['admin','district_officer'])` | Protected |
| `/app/risk` | `RiskPage` → `RoleRoute(['admin','district_officer','logistics_operator'])` | Protected |
| `/app/analyzer` | `AnalyzerPage` → `RoleRoute(['admin','district_officer','logistics_operator'])` | Protected |
| `/app/incidents` | `AddIncidentPage` → `RoleRoute(['admin','district_officer','field_officer'])` | Protected |
| `/admin` | `Navigate` → `/app/admin` | Redirect |
| `/driver` | `Navigate` → `/app/field` | Redirect |
| `/officer` | `Navigate` → `/app/district` | Redirect |
| `/supply` | `Navigate` → `/app/logistics` | Redirect |
| `/map` `/risk` `/analyzer` `/incidents` | `Navigate` → `/app/*` | Redirect |
| `*` | `Navigate` → `/` | Catch-all |

**Orphan page modules** (implemented + RoleRoute-wrapped, not mounted as primary routes): `DriverDashboard`, `LocalOfficerDashboard`, `SupplyDashboard` — superseded by `/app/field|district|logistics` but still importable.

### Navbar links (`components/common/Navbar.jsx`)

| Label | Target | After redirect | Issue |
|-------|--------|----------------|-------|
| Home | `/` | `/` or role home if authed | OK for public; authed bounce |
| Admin | `/admin` | `/app/admin` | Works; active check uses `/admin` ≠ `/app/admin` |
| Driver | `/driver` | `/app/field` | Cross-role link always shown |
| Officer | `/officer` | `/app/district` | Cross-role link always shown |
| Supply | `/supply` | `/app/logistics` | Cross-role link always shown |
| GIS Map | `/map` | `/app/map` | Always shown |
| Hazards | `/risk` | `/app/risk` | Always shown |
| AI Analyzer | `/analyzer` | `/app/analyzer` | Always shown |
| Incidents | `/incidents` | `/app/incidents` | Always shown |

Role switcher navigates to legacy paths but `AppContext.setRole` is a **no-op** (`AppContext.jsx`).

### AppShell sidebar links (`components/layout/AppShell.jsx` `getNavItems`)

| Role | Advertised path | Registered? |
|------|-----------------|-------------|
| admin | `/app/admin` | Yes |
| admin | `/app/admin/map`, `/vehicles`, `/incidents`, `/routes`, `/alerts`, `/districts`, `/users`, `/audit` | **No** |
| district_officer | `/app/district` | Yes |
| district_officer | `/app/district/map`, `/incidents`, `/roads`, `/routes`, `/alerts`, `/reports` | **No** |
| field_officer | `/app/field` | Yes |
| field_officer | `/app/field/report`, `/my-reports`, `/map`, `/alerts`, `/notifications` | **No** |
| logistics_operator | `/app/logistics` | Yes |
| logistics_operator | `/app/logistics/routes`, `/alerts`, `/vehicles` | **No** |
| viewer | `/app/viewer` | Yes |
| viewer | `/app/viewer/alerts` | **No** |

### Duplicate / same-target patterns

| Pattern | Evidence |
|---------|----------|
| Many AppShell links → same effective page | Nested path → `*` → `/` → role home |
| Legacy + new dashboards for same role | AdminDashboard vs AppShell admin nav; Driver vs Field; LocalOfficer vs District; Supply vs Logistics |
| Tab IDs vs routes | Field `activeTab: report` vs AppShell `/app/field/report` (disconnected) |
| Two Sidebars | `common/Sidebar.jsx` (path) vs `dashboard/Sidebar.jsx` (`activeTab`) |

---

## Root cause of same-page navigation

### Primary (P0): dead nested routes + catch-all bounce

Evidence:

- `AppShell.jsx` L43–82 emits nested `Link to={item.path}` values such as `/app/admin/map`.
- `App.jsx` registers only flat `/app/admin`, `/app/field`, etc.
- `App.jsx` L92: `<Route path="*" element={<Navigate to="/" replace />} />`.
- `Home.jsx` L99–103: if authenticated, `navigate(getRoleHomePath())`.

**Observed UX loop:** click sidebar item → URL briefly becomes nested path → catch-all sends `/` → Home immediately redirects to the same role dashboard. Feels like “every link returns here.”

### Secondary (P0/P1): `activeTab` without URL

Evidence: `AdminDashboard.jsx`, `FieldOfficerDashboard.jsx`, `DistrictOfficerDashboard.jsx`, `LogisticsOperatorDashboard.jsx`, and legacy dashboards hold `useState('…')` tabs. Content swaps; **browser URL stays constant**. AppShell path links do not drive these tabs.

### Tertiary (P1): legacy Navbar path/active mismatch + no-op role switch

Evidence:

- Navbar `navLinks` use `/admin`… (`Navbar.jsx` L81–91).
- Active: `location.pathname === item.path` → false after redirect to `/app/admin`.
- `handleRoleSwitch` calls `setRole` which is `() => {}` in `AppContext.jsx` L37.

### Why the site feels incomplete / vibe-coded

- Two layout systems and three nav models for one product.
- Mock KPIs, “SAT-NET ACTIVE”, and “Live CartoDB Voyager” labels over static OSM + JSON.
- Nested routes marked “Soon” but still clickable (users/audit).
- API wrappers exist but AppContext does not hydrate from them.
- Failures replaced by mocks → demos look “working” while live mode is empty/authless.

---

## Authentication/authorization exposure analysis

### What `/` shows before login

`Home.jsx`: brand, static capability cards, anonymized aggregate stats, portal CTAs to `/login`. **No** live map, vehicles, incidents, or AppShell/Navbar operational links. Correct public surface.

### Login / session model

| Mechanism | Status | Evidence |
|-----------|--------|----------|
| AuthContext | Present | `AuthContext.jsx` |
| Login form + demo selector | Present | `Login.jsx`; demo only if `DEMO_MODE` |
| `DEMO_MODE` | **Hardcoded `true`** | `demoUsers.js` L16 |
| Backend `/auth/*` | **Missing** | Not in `backend/app/api/v1/api.py` |
| ProtectedRoute | Present | Blocks until `isLoading` false; no flash of children |
| RoleRoute | Present | UI role allow-list |
| JWT on API calls | **Not attached** by `ApiClient.request` | `client.js` — no Authorization header injection |
| Backend auth deps | **None** | Only `Depends(get_db)` on notifications |

### Distinguish layers

| Layer | Reality |
|-------|---------|
| **a. UI-only role hiding** | RoleRoute, RoleBadge, AppShell nav by role |
| **b. Client session / demo mode** | sessionStorage token; `demo-token-*`; DEMO_USERS |
| **c. Real server-side authorization** | **Not implemented** |

### Exposure findings

1. **Unauthenticated users** do not see operational chrome on `/` (good).
2. **Any client that calls FastAPI** can read/write incidents, vehicles, roads, alerts, routes — no JWT.
3. **AppProvider** always initializes operational mock collections in memory for every visitor of any route under App (including public), so any future unbounded component under the same tree can render ops data without auth.
4. **Authenticated Navbar** (legacy pages) shows **all roles’ destinations** regardless of current role — Privilege escalation is UI-only (RoleRoute may deny), but the links are visible and navigable until denial.
5. **Viewer** is a role home with alerts from AppContext mocks — not a true public anonymized feed.

ProtectedRoute prevents protected **page** flash; it does **not** protect APIs or AppContext data.

---

## Screen inventory table

| Screen | Purpose | Target role | URL | Data source | Works? | Unique? |
|--------|---------|-------------|-----|-------------|--------|---------|
| Home | Marketing / portal entry | Public | `/` | Static | Yes | Yes |
| Login | Auth | Public | `/login` | authApi / demo | Demo yes; live auth N/A | Yes |
| AdminDashboard | Command overview + tabs | admin | `/app/admin` | AppContext mock | Demo UI yes | Partial duplicate of AppShell intent |
| DistrictOfficerDashboard | Verify / roads / routes | district_officer | `/app/district` | AppContext + routesApi | Partial | Yes (new) |
| FieldOfficerDashboard | Report / my reports | field_officer | `/app/field` | AppContext + incidentsApi form | Partial | Yes (new) |
| LogisticsOperatorDashboard | Fleet / route planner / no_route | logistics_operator | `/app/logistics` | AppContext + routesApi | Best route UI | Yes (new) |
| ViewerDashboard | Public-ish status | viewer | `/app/viewer` | AppContext alerts | Cosmetic | Thin |
| MapPage | GIS workspace | admin, district | `/app/map` | Static layers | Map renders | Overlaps admin map tab |
| RiskPage | Hazards | admin, district, logistics | `/app/risk` | AppContext alerts | Cosmetic | Overlaps alert tabs |
| AnalyzerPage | Route optimizer panel | admin, district, logistics | `/app/analyzer` | mock routesData + routesApi | Contract mismatch | Overlaps logistics routes |
| AddIncidentPage | Incident form | admin, district, field | `/app/incidents` | AppContext | Cosmetic | Overlaps field report |
| DriverDashboard | Legacy driver | field/admin | unmounted primary | AppContext | Orphan | Duplicate of field |
| LocalOfficerDashboard | Legacy officer | district/admin | unmounted primary | AppContext | Orphan | Duplicate of district |
| SupplyDashboard | Legacy supply | logistics/admin | unmounted primary | AppContext | Orphan | Duplicate of logistics |
| PermissionDenied | Access denied | any | `/denied` | none | Yes | Yes |

### Missing / incomplete user journeys

| Journey | Status |
|---------|--------|
| Field report | Form exists (`FieldReportForm` → POST `/incidents`); list is AppContext-local; weak offline |
| Incident verification | District UI tabs; updates AppContext only (not reliably server) |
| Road-status change | District roads tab; local state; backend PATCH exists but not consistently wired |
| Route planning | Logistics + Analyzer; split contracts |
| Route recalculation | Backend `/routes/recalculate` unused by frontend wrappers |
| No-route escalation | Logistics/District handle `status==='no_route'`; Analyzer/`RouteRecommendations` do **not** |
| Vehicle/fleet monitoring | Mock lists; no live polling hydration in AppContext |
| Notification opt-in | User-click in NotificationPanel; SW config hardcoded |
| Logout / session expiry | Logout works; SessionExpiredBanner exists; no proactive refresh timer wired from AuthContext |

---

## API/fallback/mocking analysis

### Base URL composition

```text
API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
url = `${API_BASE_URL}${endpoint}`  // endpoint like '/routes/recommend'
```

| Source | `VITE_API_URL` value | Result |
|--------|----------------------|--------|
| `client.js` default | (unset) → `…/api/v1` | Correct |
| Root `.env.example` | `http://localhost:8000` **without** `/api/v1` | Calls miss `/api/v1` → 404 → **fallback mocks** |
| docker-compose (per audit) | includes `/api/v1` | Correct |
| Frontend `.env.example` | Firebase only; API URL undocumented | Config drift |

**Duplicate `/api/v1` risk:** if env already ends with `/api/v1` and someone prefixes endpoints with `/api/v1/...` — not present today. **Missing `/api/v1` risk** from root `.env.example` is active.

### Wrappers → endpoints

| Module | Calls | Fallback |
|--------|-------|----------|
| authApi | `/auth/login|logout|refresh|me` | Demo credentials if DEMO_MODE |
| dashboardApi | `/dashboard`, `/health` | mock metrics |
| alertsApi | `/alerts` | mockAlerts; dismiss/add local-only |
| routesApi | `/routes/recommend`, `/risk/predict` | mockRouteRecommendations / fake risk |
| vehiclesApi | `/vehicles` | mockVehicles; status local-only |
| districtsApi | `/districts` | mockDistrictConnectivity |
| incidentsApi | `/incidents` GET/POST | mock / optimistic local |
| NotificationPanel | `/notifications/devices` | via ApiClient |

### Silent failure policy (P0)

`ApiClient.request` on any network/HTTP failure:

1. `console.warn` only
2. Sets `isBackendAvailable = false`
3. Returns `fallbackData` when provided

This runs **regardless of DEMO_MODE / dataMode**. Live-pilot users can see synthetic routes/incidents while believing data is live unless `DataModeBadge` is noticed.

AppContext **does not** call these list APIs on mount — UI shows seed mocks even when backend is healthy.

### Abort / polling

- AbortController + 3.5s timeout on requests; 1.5s on health.
- No systematic polling cleanup in AppContext.
- RouteLayer fetches OSRM per feature independently.

### Contract mismatches

| Area | Frontend expects | Backend provides |
|------|------------------|------------------|
| Auth | `/auth/*` | Missing |
| Route success (Analyzer) | `recommended` / `primary` | `status`, `selected_route`, `routes[]`, enriched fields |
| Route success (Logistics) | `status`, `routes[]` | Enriched `RouteResponse` (aligned better) |
| Recalculate | Not wrapped | `POST /routes/recalculate` |
| Dashboard metrics | `/dashboard` | Exists; unused by AppContext |

---

## GIS/map integration analysis

| Topic | Finding | Evidence |
|-------|---------|----------|
| Map components | `NERMap`, `OperationsMap`, layers | `components/map/*` |
| Tiles | `VITE_MAP_TILE_URL` or OSM; API-key placeholder → OSM warn | `NERMap.jsx` |
| GeoJSON order | GeoJSON `[lng,lat]` via Leaflet GeoJSON | District/Road/Risk layers |
| Marker conversion | Incidents/vehicles swap to Leaflet `[lat,lng]` | IncidentMarkers / VehicleMarkers |
| RouteLayer | Waypoints → OSRM; fail → straight line | Can draw non-engine geometry |
| Role filtering | Layers always compose defaults; no district scope | OperationsMap / NERMap |
| Bbox loading | **Not implemented** — static JSON imports | All layers |
| Empty/error map states | Weak | Limited empty UI |
| Unnecessary rerenders | Layer toggles remount; OSRM refetch risk | RouteLayer |

Backend operational bbox endpoints exist; frontend map stack does not consume them.

---

## Routing UI contract analysis

### Backend

- `POST /api/v1/routes/recommend|plan|recalculate`
- Request: `source_district`, `destination_district`, `commodity`, `constraints`
- Response: `RouteResponse` with `status` (`success|no_route|…`), `selected_route`, `routes`, `alternatives`, risk/ETA/delay/engine/freshness fields (`backend/app/schemas/route.py`)

### Frontend gaps

| Requirement | Logistics UI | Analyzer / RouteRecommendations |
|-------------|--------------|-----------------------------------|
| Selected route | Partial | Uses `recommended`/`primary` mock shape |
| Alternatives | Partial | Mock dual cards |
| Risk / ETA / delay breakdown | Partial | Legacy fields (`eta`, `distanceKm`) |
| Engine / freshness / stale | Missing | Missing |
| `no_route` without fake geometry | **Yes** | **No** — may still present mock geometry via fallback |
| Recalculate endpoint | Not used | Not used |
| Closure → alternate demo | Manual; depends on backend + no silent mock | Broken by fallback mock |

**Required frontend changes for demo narrative (normal → closure → alternate/no-route):**

1. Single route response adapter matching `RouteResponse`.
2. Disable mock fallback when `dataMode !== 'DEMO'` (or never for route planning).
3. Wire recalculate; clear map geometry on `no_route`.
4. Surface `active_alerts`, `routing_engine`, `stale`, delay breakdown.
5. Deep-link `/app/logistics/routes` (or query) after IA fix.

---

## Firebase/notification analysis

| Check | Result |
|-------|--------|
| Public config env-based in app | Yes — `lib/firebase.js` uses `VITE_FIREBASE_*` |
| Service worker runtime-safe config | **No** — hardcoded project keys in `public/firebase-messaging-sw.js` |
| Permission after user action | Yes — NotificationPanel click |
| Token not rendered/logged | Yes — comment + POST only |
| Registration endpoint | `POST /notifications/devices` — exists backend-side; **unauthenticated** |
| Auto-init | `main.jsx` imports firebase for app init only; tests assert no auto permission |

`.env.example` embeds Firebase web config values (normal for client SDK, but SW duplication is a maintenance/security hygiene issue).

---

## Accessibility/responsiveness analysis

| Area | Finding |
|------|---------|
| Landmarks | Home/Login have banner/main/contentinfo; skip links present (recent a11y commit) |
| Labels | Login inputs labelled; many dashboard controls icon-only |
| Focus | Dropdowns lack focus traps / Escape consistency |
| Keyboard | Sidebar buttons OK; map Leaflet limited keyboard |
| Contrast | Recent WCAG work on public pages; dark dashboard density remains risk |
| Reduced motion | Pulse/animate classes without `prefers-reduced-motion` gates in Navbar/AppShell |
| Non-colour status | Some badges + icons; map severity often colour-primary |
| Mobile field report | Field dashboard tabs; AppShell drawer; nested dead links hurt mobile |
| Tablet map | MapPage exists; dual chrome inconsistent |
| Desktop ops | Admin tabs work in-page; not deep-linkable |

---

## Code quality/maintainability analysis

| Issue | Evidence |
|-------|----------|
| Dual generations | AppShell vs Navbar+Sidebar vs dashboard Sidebar |
| God pages | Admin/LocalOfficer/Supply dashboards are large multi-tab files |
| Prop drilling / context | AppContext holds most domain + toast + chat |
| Stale state | Local incident verify never reconciles with server |
| Unused API modules | dashboard/alerts/vehicles/districts APIs unused by context |
| Orphan pages | Driver/LocalOfficer/Supply still in tree |
| Tests | Unit tests for auth, map tiles, no_route, client, FieldReportForm; **no nav/route IA tests** before this audit |
| e2e | None |
| Lint | oxlint configured |

---

## Exact defects ranked P0/P1/P2

### P0

1. AppShell nested nav paths not registered → catch-all bounce to same role home.
2. ApiClient silent mock fallback can present synthetic ops data outside intentional demo.
3. Backend has no authentication/authorization; all mutating APIs open.
4. AppContext mock-first hydration; live APIs unused for primary lists.
5. Route UI contract split; Analyzer ignores `no_route` / enriched fields; recalculate unused.
6. `DEMO_MODE=false` backend still leaves logistics on in-memory store / operational empties (blocks live-pilot).

### P1

7. Legacy Navbar shows all role links; active path mismatch; `setRole` no-op.
8. Dual dashboard generations + orphan pages.
9. Firebase SW hardcoded config; notifications unauthenticated.
10. Map: no bbox loading; all roles see full static layers; OSRM straight-line fallback geometry.
11. Root `.env.example` `VITE_API_URL` missing `/api/v1`.
12. Missing journeys: road status persistence, escalation workflow, session refresh.

### P2

13. Accessibility polish (reduced motion, focus traps, map a11y).
14. Remove cosmetic “Live/SAT” claims when data is static.
15. Deep-linkable tabs; consolidate Sidebars.
16. Expand route/page and e2e coverage.
17. Document `VITE_API_URL` in frontend `.env.example`.

---

## Files responsible for each P0/P1 defect

| ID | Defect | Primary files |
|----|--------|---------------|
| P0-1 | Dead nested routes / bounce | `components/layout/AppShell.jsx`, `App.jsx` |
| P0-2 | Silent API fallback | `lib/api/client.js`, all `lib/api/*Api.js` |
| P0-3 | No server auth | `backend/app/api/v1/endpoints/*`, missing auth module; `lib/api/client.js` |
| P0-4 | Mock-first AppContext | `context/AppContext.jsx`, `data/*`, `lib/mockData.js` |
| P0-5 | Route contract / no_route | `routesApi.js`, `RouteRecommendations.jsx`, `AnalyzerPage.jsx`, `LogisticsOperatorDashboard.jsx` |
| P0-6 | Live DB not wired | `backend/.../logistics_service.py`, `operational_service.py`, missing `models/` |
| P1-7 | Navbar / setRole | `components/common/Navbar.jsx`, `context/AppContext.jsx` |
| P1-8 | Dual generations | `pages/*Dashboard.jsx`, `App.jsx` |
| P1-9 | Firebase SW / notif auth | `public/firebase-messaging-sw.js`, `NotificationPanel.jsx`, notifications endpoints |
| P1-10 | Map bbox / layers | `NERMap.jsx`, `*Layer.jsx`, `OperationsMap.jsx` |
| P1-11 | Env API URL | `.env.example`, `client.js` |
| P1-12 | Journey gaps | District/Field dashboards, missing API wiring |

---

## Navigation test plan / audit test

Vitest file added: `frontend/src/tests/navigation-audit.test.jsx`.

It **does not redesign UI**. It asserts the currently documented inventory:

- Registered route list vs AppShell advertised paths (exposes dead nested targets).
- Navbar legacy targets that rely on redirects.
- Catch-all behavior implication documented via inventory assertions.

Browser/Playwright audit: **not performed** — Playwright not in `package.json`; no `frontend/e2e`. Installing a new e2e framework was out of scope.

---

## Explicit non-goals of this document

No redesign code, no App.jsx rewrite, no component deletion, no Supabase client, no database migrations.
)


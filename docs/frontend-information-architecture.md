# NER-SHIELD Frontend Information Architecture

**Status:** Target IA derived from the 2026-09-25 frontend audit.  
**Rule:** Implement after audit approval. Do not treat current nested AppShell paths as implemented.

---

## User roles

| Role | Description | Typical device |
|------|-------------|----------------|
| `admin` | Regional command; full operational oversight | Desktop |
| `district_officer` | Verify incidents; update road status in assigned districts | Desktop / tablet |
| `field_officer` | Report hazards from the field; track own reports | Mobile-first |
| `logistics_operator` | Fleet view; plan/recalculate commodity routes | Desktop / tablet |
| `driver` | In-cabin telemetry & assigned trip (maps to field-adjacent permissions; may share `field_officer` or dedicated role later) | Mobile |
| `viewer` | Read-only public/agency status (non-sensitive aggregates) | Any |

Current demo aliases (`demoUsers.js`): `driver` → `field_officer`, `officer` → `district_officer`, `supply` → `logistics_operator`.

---

## Role-to-task matrix

| Task | admin | district_officer | field_officer | logistics_operator | driver | viewer |
|------|:-----:|:----------------:|:-------------:|:------------------:|:------:|:------:|
| Situational overview | ● | ● (district) | ○ own area | ● fleet | ○ trip | ○ public |
| Live GIS map (scoped) | ● | ● | ○ | ● | ○ | — |
| Create incident report | ● | ○ | ● | — | ● | — |
| Verify / resolve incident | ● | ● | — | — | — | — |
| Change road status | ● | ● | — | — | — | — |
| Plan route | ● | ○ emergency | — | ● | — | — |
| Recalculate route | ● | ○ | — | ● | ○ request | — |
| No-route escalation | ● | ● | — | ● | ○ notify | — |
| Fleet / vehicle monitor | ● | ○ | — | ● | ○ self | — |
| Alert center | ● | ● | ○ | ● | ○ | ○ public |
| Notification opt-in | ● | ● | ● | ● | ● | ○ |
| User / audit admin | ● | — | — | — | — | — |

● primary · ○ limited/scoped · — none

---

## Public routes

| Path | Purpose | Operational data? |
|------|---------|-------------------|
| `/` | Brand, mission, portal CTAs | **Never** |
| `/login` | Authentication | **Never** |
| `/denied` | Permission denied explanation | **Never** |

**Explicit rule: no operational data before authenticated session.**  
No vehicle positions, road layers, live incidents, route geometry, alert payloads, or district connectivity matrices on public routes. Static marketing copy and anonymized capability stats only.

---

## Protected common routes

Accessible after auth; further gated by role:

| Path | Purpose |
|------|---------|
| `/app` | Optional shell index → redirect to role home |
| `/app/notifications` | Device opt-in / preferences |
| `/app/account` | Profile / logout / session info |
| `/app/map` | Shared GIS workspace (scoped query params) |

---

## Role-specific nested route map

Replace today’s flat `/app/{role}` + dead nested Links with **registered nested routes** (or query/tab routes that exist in the router).

### Admin — home `/app/admin`

| Path | Page purpose | Data scope |
|------|--------------|------------|
| `/app/admin` | Operations overview KPIs | All districts (server-scoped admin) |
| `/app/admin/map` | Regional GIS | All layers, bbox-loaded |
| `/app/admin/vehicles` | Fleet management | All vehicles |
| `/app/admin/incidents` | Incident queue | All incidents |
| `/app/admin/routes` | Route planning oversight | All route records |
| `/app/admin/alerts` | Alert center | All alerts |
| `/app/admin/districts` | Connectivity matrix | All districts |
| `/app/admin/users` | User management | Profiles/assignments |
| `/app/admin/audit` | Audit log | Audit events |

### District officer — home `/app/district`

| Path | Purpose | Data scope |
|------|---------|------------|
| `/app/district` | District dashboard | `district_ids` |
| `/app/district/map` | District GIS | Assigned districts bbox |
| `/app/district/incidents` | Verification queue | Assigned districts |
| `/app/district/roads` | Road status changes | Assigned roads |
| `/app/district/routes` | Emergency routing | Origin in district |
| `/app/district/alerts` | District alerts | Assigned |
| `/app/district/reports` | Field reports inbox | Assigned |

### Field officer — home `/app/field`

| Path | Purpose | Data scope |
|------|---------|------------|
| `/app/field` | My dashboard | Own reports + area alerts |
| `/app/field/report` | New incident form | Create only |
| `/app/field/my-reports` | Status of own reports | `created_by = me` |
| `/app/field/map` | Area map (limited) | Assigned district |
| `/app/field/alerts` | Relevant alerts | Scoped |
| `/app/field/notifications` | Push opt-in | Self |

### Logistics operator — home `/app/logistics`

| Path | Purpose | Data scope |
|------|---------|------------|
| `/app/logistics` | Fleet overview | `vehicle_ids` |
| `/app/logistics/routes` | Route planner / recalculate | Assigned commodities/vehicles |
| `/app/logistics/alerts` | Route-impacting alerts | Fleet corridors |
| `/app/logistics/vehicles` | Vehicle detail | Assigned |

### Driver — home `/app/driver` (recommended dedicated route)

| Path | Purpose | Data scope |
|------|---------|------------|
| `/app/driver` | Active trip | Assigned vehicle/route |
| `/app/driver/map` | Navigation map | Assigned geometry only |
| `/app/driver/alerts` | Trip alerts | Route corridor |
| `/app/driver/report` | Quick hazard report | Create |

*Today `/driver` redirects to `/app/field` — separate when cabin UX diverges.*

### Viewer — home `/app/viewer`

| Path | Purpose | Data scope |
|------|---------|------------|
| `/app/viewer` | Public status summary | Non-sensitive aggregates only |
| `/app/viewer/alerts` | Public advisories | Public severity subset |

---

## Navigation configuration by role

Principles:

1. **One nav source of truth** (config module), consumed by AppShell only.
2. **Every `path` must match a registered `Route`.**
3. **No cross-role destination links** in primary nav (admin may use explicit “impersonation” later, not default).
4. **Legacy paths** (`/admin`, `/officer`, …) remain redirects only during transition.
5. **Tabs are routes** (or `?tab=` synchronized with the router) — never silent `activeTab` alone.

| Role | Primary nav items (labels → paths) |
|------|-------------------------------------|
| admin | Overview → `/app/admin`; Map → `…/map`; Vehicles → `…/vehicles`; Incidents → `…/incidents`; Routes → `…/routes`; Alerts → `…/alerts`; Districts → `…/districts` |
| district_officer | Dashboard → `/app/district`; Map; Incidents; Roads; Routes; Alerts; Reports |
| field_officer | Dashboard → `/app/field`; Report (highlight); My reports; Map; Alerts; Notifications |
| logistics_operator | Fleet → `/app/logistics`; Route planner (highlight); Alerts; Vehicles |
| driver | Trip → `/app/driver`; Map; Alerts; Report |
| viewer | Status → `/app/viewer`; Public alerts |

---

## Page purpose and data scope for every route

See nested tables above. Cross-cutting rules:

- **Server is source of truth** for incidents, roads, vehicles, alerts, routes.
- Frontend filters are convenience only; **API must enforce** `district_ids` / `vehicle_ids` / role.
- Maps request **bbox + since** where backend supports it; do not dump full NER GeoJSON to every client.
- Viewer never receives exact vehicle GPS or unverified PII.

---

## Core user flows

### a. Field officer incident report

1. Auth → `/app/field`  
2. Nav → `/app/field/report`  
3. Capture type, severity, GPS, optional photo, notes  
4. `POST /api/v1/incidents` with Bearer token  
5. Success → `/app/field/my-reports` with server id  
6. States: locating GPS, submitting, success, validation error, offline queue (future), 403

### b. District officer verification / closure

1. Auth → `/app/district/incidents`  
2. Open unverified item (scoped list)  
3. Verify or reject; optionally `PATCH` road status  
4. Broadcast/alert side-effect server-side  
5. States: empty queue, conflict/stale, permission denied

### c. Logistics operator route planning / recalculation

1. Auth → `/app/logistics/routes`  
2. Select origin, destination, commodity, constraints  
3. `POST /routes/recommend` → render `RouteResponse`  
4. On road closure event → `POST /routes/recalculate`  
5. Display selected, alternatives, risk, ETA, delay breakdown, engine, freshness  
6. On `no_route`: **clear geometry**, show escalation CTA  
7. States: calculating, degraded, stale, no_route, graph_unavailable

### d. Admin situational oversight

1. Auth → `/app/admin`  
2. KPI + alert strip from live `/dashboard` + `/alerts`  
3. Drill to map/incidents/fleet via **real routes**  
4. No demo-only role switcher in production builds

### e. No-safe-route escalation

1. Planner receives `status: no_route`  
2. UI: reason_code, message, active_alerts — **no polyline**  
3. Actions: notify district/admin, change commodity priority, widen constraints, open incident  
4. Audit log entry server-side

---

## Required UI states

Every protected operational view must define:

| State | Behavior |
|-------|----------|
| Loading | Skeleton / spinner; no fake metrics |
| Error | Visible error; retry; **no silent mock** in live mode |
| Empty | Explicit empty copy + next action |
| Offline | Banner; disable mutating actions or queue |
| Stale | Badge when `stale` / `LIVE_STALE` / old `*_updated_at` |
| Permission denied | `/denied` or inline; do not flash forbidden data |

Auth gate: wait for session hydrate (`isLoading`) before rendering protected children (already in ProtectedRoute).

---

## Accessibility / responsive principles

- One `main` landmark per view; labelled nav.
- All icon buttons have accessible names.
- Focus management on route changes and modal/drawer open/close.
- Keyboard access to primary actions; map alternatives for critical tasks (tables/lists).
- Status not by colour alone (icon + text).
- Honor `prefers-reduced-motion`.
- **Mobile:** field report flow first-class (large taps, GPS, minimal chrome).
- **Tablet:** map + side inspector.
- **Desktop:** multi-panel ops without duplicating entire dashboards per tab hack.

---

## Explicit rule: no operational data before authenticated session

1. Public bundle may ship static marketing assets only.  
2. Do not mount AppContext operational seeds for anonymous trees — or gate provider behind auth.  
3. Do not call ops APIs without Bearer token in live mode.  
4. Do not render map layers, vehicle tables, or alert lists on `/` or `/login`.  
5. Demo mode must be **explicitly labelled** (`DataModeBadge` / banner) and never silently pretend to be live.
)

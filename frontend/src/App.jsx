/**
 * NER-SHIELD App Router
 *
 * Full routing architecture:
 *
 * Public Routes:
 *   /              → Public landing page (no live operational data)
 *   /access        → Access request portal & role credential directory
 *   /login         → Authentication (email/password & demo role selector)
 *   /privacy       → Data security and privacy policy
 *   /unauthorized  → Permission denied explanation
 *   /not-found     → 404 unmapped route page
 *
 * Protected Layout Route (/app) with AppShell:
 *   /app           → Role-aware redirect (admin, district_officer, field_officer, logistics_operator, viewer)
 *   /app/profile   → User profile & session details
 *   /app/notifications → Notification settings & alert feed
 *   /app/help      → Operations manual & emergency hotlines
 *
 * Admin Routes:
 *   /app/admin/overview   → Regional command overview KPIs
 *   /app/admin/map        → All-districts GIS operational map
 *   /app/admin/incidents  → Regional incident queue
 *   /app/admin/roads      → Arterial road status & clearance
 *   /app/admin/fleet      → Fleet management table
 *   /app/admin/users      → User access directory
 *   /app/admin/data-health→ Telemetry sync health & latency
 *   /app/admin/audit      → System audit log
 *
 * District Officer Routes:
 *   /app/district/overview → District overview KPIs
 *   /app/district/map      → District GIS map
 *   /app/district/reports  → Field reports inbox
 *   /app/district/roads    → District road clearance status
 *   /app/district/routing  → Emergency routing bypass
 *   /app/district/alerts   → District hazard advisories
 *
 * Field Officer Routes:
 *   /app/field/home        → Field officer home & active sector
 *   /app/field/report/new  → Submit new hazard report
 *   /app/field/reports     → Submitted reports status timeline
 *   /app/field/map         → Area map
 *   /app/field/safety      → Safety SOP & emergency guidelines
 *
 * Logistics Operator Routes:
 *   /app/logistics/overview       → Fleet overview
 *   /app/logistics/routes/new     → AI route optimization planner
 *   /app/logistics/routes/history → Calculated route logs
 *   /app/logistics/fleet          → Assigned vehicles & cargo
 *   /app/logistics/alerts         → Corridor alerts
 *   /app/logistics/map            → Logistics GIS map
 *
 * Viewer Routes:
 *   /app/viewer/overview  → Read-only public status
 *   /app/viewer/alerts    → Cleared public advisories
 *
 * ⚠️ SECURITY NOTE: ProtectedRoute and RoleRoute are UI-layer guards only.
 *    The backend MUST enforce authorization and scoping on every API request independently.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Layout & Guards
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import AccessPage from './pages/public/AccessPage';
import PrivacyPage from './pages/public/PrivacyPage';
import UnauthorizedPage from './pages/public/UnauthorizedPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Common pages
import ProfilePage from './pages/common/ProfilePage';
import NotificationsPage from './pages/common/NotificationsPage';
import HelpPage from './pages/common/HelpPage';

// Admin pages
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminMapPage from './pages/admin/AdminMapPage';
import AdminIncidentsPage from './pages/admin/AdminIncidentsPage';
import AdminRoadsPage from './pages/admin/AdminRoadsPage';
import AdminFleetPage from './pages/admin/AdminFleetPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminDataHealthPage from './pages/admin/AdminDataHealthPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';

// District pages
import DistrictOverviewPage from './pages/district/DistrictOverviewPage';
import DistrictMapPage from './pages/district/DistrictMapPage';
import DistrictReportsPage from './pages/district/DistrictReportsPage';
import DistrictRoadsPage from './pages/district/DistrictRoadsPage';
import DistrictRoutingPage from './pages/district/DistrictRoutingPage';
import DistrictAlertsPage from './pages/district/DistrictAlertsPage';

// Field pages
import FieldHomePage from './pages/field/FieldHomePage';
import FieldReportNewPage from './pages/field/FieldReportNewPage';
import FieldReportsPage from './pages/field/FieldReportsPage';
import FieldMapPage from './pages/field/FieldMapPage';
import FieldSafetyPage from './pages/field/FieldSafetyPage';

// Logistics pages
import LogisticsOverviewPage from './pages/logistics/LogisticsOverviewPage';
import LogisticsRouteNewPage from './pages/logistics/LogisticsRouteNewPage';
import LogisticsRouteHistoryPage from './pages/logistics/LogisticsRouteHistoryPage';
import LogisticsFleetPage from './pages/logistics/LogisticsFleetPage';
import LogisticsAlertsPage from './pages/logistics/LogisticsAlertsPage';
import LogisticsMapPage from './pages/logistics/LogisticsMapPage';

// Viewer pages
import ViewerOverviewPage from './pages/viewer/ViewerOverviewPage';
import ViewerAlertsPage from './pages/viewer/ViewerAlertsPage';

import './App.css';

/**
 * Role-aware /app index redirector
 */
export function AppIndexRedirect() {
  const { user } = useAuth();
  const role = user?.role;
  switch (role) {
    case 'admin':
      return <Navigate to="/app/admin/overview" replace />;
    case 'district_officer':
      return <Navigate to="/app/district/overview" replace />;
    case 'field_officer':
      return <Navigate to="/app/field/home" replace />;
    case 'logistics_operator':
      return <Navigate to="/app/logistics/overview" replace />;
    case 'viewer':
      return <Navigate to="/app/viewer/overview" replace />;
    default:
      return <Navigate to="/app/viewer/overview" replace />;
  }
}

export function AppRoutes() {
  return (
    <Routes>

            {/* ── Public Routes (no AppShell or live operational data) ─ */}
            <Route path="/" element={<Home />} />
            <Route path="/access" element={<AccessPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/not-found" element={<NotFoundPage />} />
            <Route path="/denied" element={<Navigate to="/unauthorized" replace />} />

            {/* ── Protected Nested Routes under /app with AppShell Layout */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Role-aware /app index */}
              <Route index element={<AppIndexRedirect />} />

              {/* Common authenticated routes */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="help" element={<HelpPage />} />

              {/* Admin nested routes */}
              <Route path="admin" element={<RoleRoute allowedRoles={['admin']} />}>
                <Route index element={<Navigate to="/app/admin/overview" replace />} />
                <Route path="overview" element={<AdminOverviewPage />} />
                <Route path="map" element={<AdminMapPage />} />
                <Route path="incidents" element={<AdminIncidentsPage />} />
                <Route path="roads" element={<AdminRoadsPage />} />
                <Route path="fleet" element={<AdminFleetPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="data-health" element={<AdminDataHealthPage />} />
                <Route path="audit" element={<AdminAuditPage />} />
              </Route>

              {/* District Officer nested routes */}
              <Route path="district" element={<RoleRoute allowedRoles={['district_officer', 'admin']} />}>
                <Route index element={<Navigate to="/app/district/overview" replace />} />
                <Route path="overview" element={<DistrictOverviewPage />} />
                <Route path="map" element={<DistrictMapPage />} />
                <Route path="reports" element={<DistrictReportsPage />} />
                <Route path="roads" element={<DistrictRoadsPage />} />
                <Route path="routing" element={<DistrictRoutingPage />} />
                <Route path="alerts" element={<DistrictAlertsPage />} />
              </Route>

              {/* Field Officer nested routes */}
              <Route path="field" element={<RoleRoute allowedRoles={['field_officer', 'admin']} />}>
                <Route index element={<Navigate to="/app/field/home" replace />} />
                <Route path="home" element={<FieldHomePage />} />
                <Route path="report/new" element={<FieldReportNewPage />} />
                <Route path="reports" element={<FieldReportsPage />} />
                <Route path="map" element={<FieldMapPage />} />
                <Route path="safety" element={<FieldSafetyPage />} />
              </Route>

              {/* Logistics Operator nested routes */}
              <Route path="logistics" element={<RoleRoute allowedRoles={['logistics_operator', 'admin']} />}>
                <Route index element={<Navigate to="/app/logistics/overview" replace />} />
                <Route path="overview" element={<LogisticsOverviewPage />} />
                <Route path="routes/new" element={<LogisticsRouteNewPage />} />
                <Route path="routes/history" element={<LogisticsRouteHistoryPage />} />
                <Route path="fleet" element={<LogisticsFleetPage />} />
                <Route path="alerts" element={<LogisticsAlertsPage />} />
                <Route path="map" element={<LogisticsMapPage />} />
              </Route>

              {/* Viewer nested routes */}
              <Route path="viewer" element={<RoleRoute allowedRoles={['viewer', 'admin']} />}>
                <Route index element={<Navigate to="/app/viewer/overview" replace />} />
                <Route path="overview" element={<ViewerOverviewPage />} />
                <Route path="alerts" element={<ViewerAlertsPage />} />
              </Route>

              {/* Deprecated /app/* shortcuts preserved for backward-compatibility */}
              <Route path="map" element={<Navigate to="/app/admin/map" replace />} />
              <Route path="risk" element={<Navigate to="/app/district/alerts" replace />} />
              <Route path="analyzer" element={<Navigate to="/app/logistics/routes/new" replace />} />
              <Route path="incidents" element={<Navigate to="/app/admin/incidents" replace />} />
            </Route>

            {/* ── Deprecated Legacy Root Aliases ──────────────────────── */}
            <Route path="/admin" element={<Navigate to="/app/admin/overview" replace />} />
            <Route path="/driver" element={<Navigate to="/app/field/home" replace />} />
            <Route path="/officer" element={<Navigate to="/app/district/overview" replace />} />
            <Route path="/supply" element={<Navigate to="/app/logistics/overview" replace />} />
            <Route path="/map" element={<Navigate to="/app/admin/map" replace />} />
            <Route path="/risk" element={<Navigate to="/app/district/alerts" replace />} />
            <Route path="/analyzer" element={<Navigate to="/app/logistics/routes/new" replace />} />
            <Route path="/incidents" element={<Navigate to="/app/field/report/new" replace />} />

            {/* ── Wildcard: Route to /not-found (never to /) ──────────── */}
            <Route path="*" element={<Navigate to="/not-found" replace />} />

          </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;

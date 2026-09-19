/**
 * NER-SHIELD App Router
 *
 * Route structure:
 *   PUBLIC  /                     → Landing page (no live data before login)
 *   PUBLIC  /login                → Login (email/password, demo mode)
 *
 *   PROTECTED (admin)             /app/admin
 *   PROTECTED (district_officer)  /app/district
 *   PROTECTED (field_officer)     /app/field
 *   PROTECTED (logistics_operator) /app/logistics
 *   PROTECTED (viewer)            /app/viewer
 *   PROTECTED (admin)             /app/map, /app/risk, /app/analyzer, /app/incidents
 *
 *   LEGACY REDIRECTS: /admin → /app/admin, /driver → /app/field, etc.
 *   /denied → PermissionDenied (public, no auth needed to view)
 *
 * ⚠️  SECURITY NOTE: ProtectedRoute and RoleRoute are UI-layer guards only.
 *     The backend MUST enforce authorization on every API request independently.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';

// Protected role pages (default exports are ProtectedXxx wrappers)
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import LocalOfficerDashboard from './pages/LocalOfficerDashboard';
import SupplyDashboard from './pages/SupplyDashboard';
import FieldOfficerDashboard from './pages/FieldOfficerDashboard';
import LogisticsOperatorDashboard from './pages/LogisticsOperatorDashboard';
import DistrictOfficerDashboard from './pages/DistrictOfficerDashboard';
import ViewerDashboard from './pages/ViewerDashboard';

// Legacy pages (still wrapped internally with ProtectedRoute via RoleRoute in their file)
import MapPage from './pages/MapPage';
import RiskPage from './pages/RiskPage';
import AnalyzerPage from './pages/AnalyzerPage';
import AddIncidentPage from './pages/AddIncidentPage';

// Auth components
import { PermissionDenied } from './components/auth/PermissionDenied';

import './App.css';

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>

            {/* ── Public Routes (no auth required) ───────────────────── */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            {/* PermissionDenied is public so authenticated users can be redirected here */}
            <Route path="/denied" element={<PermissionDenied />} />

            {/* ── New Protected Role Routes ───────────────────────────── */}
            {/* Default exports are role-guarded wrappers */}
            <Route path="/app/admin" element={<AdminDashboard />} />
            <Route path="/app/district" element={<DistrictOfficerDashboard />} />
            <Route path="/app/field" element={<FieldOfficerDashboard />} />
            <Route path="/app/logistics" element={<LogisticsOperatorDashboard />} />
            <Route path="/app/viewer" element={<ViewerDashboard />} />

            {/* Dedicated operational pages */}
            <Route path="/app/map" element={<MapPage />} />
            <Route path="/app/risk" element={<RiskPage />} />
            <Route path="/app/analyzer" element={<AnalyzerPage />} />
            <Route path="/app/incidents" element={<AddIncidentPage />} />

            {/* ── Legacy Redirect Aliases (backward compat) ───────────── */}
            <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
            <Route path="/driver" element={<Navigate to="/app/field" replace />} />
            <Route path="/officer" element={<Navigate to="/app/district" replace />} />
            <Route path="/supply" element={<Navigate to="/app/logistics" replace />} />
            <Route path="/map" element={<Navigate to="/app/map" replace />} />
            <Route path="/risk" element={<Navigate to="/app/risk" replace />} />
            <Route path="/analyzer" element={<Navigate to="/app/analyzer" replace />} />
            <Route path="/incidents" element={<Navigate to="/app/incidents" replace />} />

            {/* Also keep old /driver, /officer pages as aliases for compatibility */}
            {/* (Already using /app/* paths above) */}

            {/* ── Fallback ────────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;

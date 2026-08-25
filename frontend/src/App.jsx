import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import {
  Home,
  Login,
  AdminDashboard,
  DriverDashboard,
  LocalOfficerDashboard,
  SupplyDashboard,
  MapPage,
  RiskPage,
  AnalyzerPage,
  AddIncidentPage,
} from './pages';
import './App.css';

export function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Main Landing & Marketing Page */}
          <Route path="/" element={<Home />} />

          {/* Authentication & Role Selection */}
          <Route path="/login" element={<Login />} />

          {/* Role-Based Intelligence Dashboards */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/officer" element={<LocalOfficerDashboard />} />
          <Route path="/supply" element={<SupplyDashboard />} />

          {/* Dedicated Core Operational Pages */}
          <Route path="/map" element={<MapPage />} />
          <Route path="/risk" element={<RiskPage />} />
          <Route path="/analyzer" element={<AnalyzerPage />} />
          <Route path="/incidents" element={<AddIncidentPage />} />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

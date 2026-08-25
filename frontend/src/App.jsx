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
} from './pages';
import './App.css';

export function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Main Landing Page */}
          <Route path="/" element={<Home />} />

          {/* Authentication & Role Selection */}
          <Route path="/login" element={<Login />} />

          {/* Role-Based Dashboards */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/officer" element={<LocalOfficerDashboard />} />
          <Route path="/supply" element={<SupplyDashboard />} />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

import React, { useState } from "react";
import { NERMap } from "./components/map";
import { Layers, MapPin, Truck, AlertTriangle, ShieldAlert, Navigation, Info, Activity } from "lucide-react";
import "./App.css";

function App() {
  // Layer Visibility States
  const [showDistricts, setShowDistricts] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showRisks, setShowRisks] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Active Selection Info State
  const [selectedItem, setSelectedItem] = useState({
    type: "System Notice",
    data: {
      title: "NER GIS Module Ready",
      description: "Click on any district, road line, incident marker, or logistics vehicle to view detailed geospatial telemetry.",
    },
  });

  const [selectedRouteId, setSelectedRouteId] = useState(undefined);

  return (
    <div className="dashboard-app">
      {/* Header Bar */}
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-icon-wrapper">
            <Navigation className="brand-icon" />
          </div>
          <div className="brand-details">
            <div className="brand-title-row">
              <h1>NER-SHIELD</h1>
              <span className="badge badge-sih">SIH26002</span>
              <span className="badge badge-gis">GIS Module</span>
            </div>
            <p className="brand-subtitle">
              Smart Logistics & Accessibility Intelligence Platform — North Eastern Region (NER)
            </p>
          </div>
        </div>

        {/* Prototype Data Banner Tag */}
        <div className="prototype-banner">
          <Info className="info-icon" />
          <span>
            <strong>PROTOTYPE DATA:</strong> GeoJSON synthetic telemetry representing Assam, Meghalaya, Nagaland & Manipur
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="dashboard-content">
        {/* Left Control Sidebar */}
        <aside className="dashboard-sidebar">
          {/* Quick Metrics */}
          <div className="card metrics-card">
            <h2 className="card-title">
              <Activity className="card-title-icon text-emerald" />
              GIS Overview
            </h2>
            <div className="metrics-grid">
              <div className="metric-box">
                <div className="metric-label">Districts</div>
                <div className="metric-val text-white">6 Covered</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">Road Corridors</div>
                <div className="metric-val text-emerald">5 Major</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">Active Incidents</div>
                <div className="metric-val text-rose">4 Field</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">Logistics Fleet</div>
                <div className="metric-val text-blue">4 Active</div>
              </div>
            </div>
          </div>

          {/* Layer Control Panel */}
          <div className="card controls-card">
            <h2 className="card-title">
              <Layers className="card-title-icon text-emerald" />
              Geospatial Layers
            </h2>
            <div className="layer-options-list">
              <label className="layer-checkbox-label">
                <span className="layer-checkbox-text">
                  <span className="layer-indicator district-indicator"></span>
                  District Boundaries
                </span>
                <input
                  type="checkbox"
                  checked={showDistricts}
                  onChange={(e) => setShowDistricts(e.target.checked)}
                  className="custom-checkbox"
                />
              </label>

              <label className="layer-checkbox-label">
                <span className="layer-checkbox-text">
                  <span className="layer-indicator road-indicator"></span>
                  Road Corridors
                </span>
                <input
                  type="checkbox"
                  checked={showRoads}
                  onChange={(e) => setShowRoads(e.target.checked)}
                  className="custom-checkbox"
                />
              </label>

              <label className="layer-checkbox-label">
                <span className="layer-checkbox-text">
                  <AlertTriangle className="layer-checkbox-icon text-rose" />
                  Incident Markers
                </span>
                <input
                  type="checkbox"
                  checked={showIncidents}
                  onChange={(e) => setShowIncidents(e.target.checked)}
                  className="custom-checkbox"
                />
              </label>

              <label className="layer-checkbox-label">
                <span className="layer-checkbox-text">
                  <Truck className="layer-checkbox-icon text-blue" />
                  Vehicle Locations
                </span>
                <input
                  type="checkbox"
                  checked={showVehicles}
                  onChange={(e) => setShowVehicles(e.target.checked)}
                  className="custom-checkbox"
                />
              </label>

              <label className="layer-checkbox-label">
                <span className="layer-checkbox-text">
                  <ShieldAlert className="layer-checkbox-icon text-purple" />
                  Risk Hazard Zones
                </span>
                <input
                  type="checkbox"
                  checked={showRisks}
                  onChange={(e) => setShowRisks(e.target.checked)}
                  className="custom-checkbox"
                />
              </label>

              <label className="layer-checkbox-label">
                <span className="layer-checkbox-text">
                  <Navigation className="layer-checkbox-icon text-emerald" />
                  Route Visualization
                </span>
                <input
                  type="checkbox"
                  checked={showRoutes}
                  onChange={(e) => setShowRoutes(e.target.checked)}
                  className="custom-checkbox"
                />
              </label>
            </div>
          </div>

          {/* Route Filter Selector */}
          <div className="card routes-card">
            <h2 className="card-title">Route Filter Focus</h2>
            <div className="route-buttons-list">
              <button
                onClick={() => setSelectedRouteId(undefined)}
                className={`route-btn ${selectedRouteId === undefined ? "route-btn-active active-all" : ""}`}
              >
                Show All Routes
              </button>
              <button
                onClick={() => setSelectedRouteId("ROUTE-PRIMARY")}
                className={`route-btn ${selectedRouteId === "ROUTE-PRIMARY" ? "route-btn-active active-blocked" : ""}`}
              >
                🔴 Primary Route (Blocked)
              </button>
              <button
                onClick={() => setSelectedRouteId("ROUTE-ALTERNATE")}
                className={`route-btn ${selectedRouteId === "ROUTE-ALTERNATE" ? "route-btn-active active-safe" : ""}`}
              >
                🟢 AI-Recommended Safe Route
              </button>
            </div>
          </div>
        </aside>

        {/* Center/Right Map Display & Inspector */}
        <section className="dashboard-main">
          {/* Map Container */}
          <div className="map-view-wrapper">
            <NERMap
              showDistricts={showDistricts}
              showRoads={showRoads}
              showIncidents={showIncidents}
              showVehicles={showVehicles}
              showRisks={showRisks}
              showRoutes={showRoutes}
              selectedRouteId={selectedRouteId}
              onDistrictSelect={(data) => setSelectedItem({ type: "District", data })}
              onRoadSelect={(data) => setSelectedItem({ type: "Road Segment", data })}
              onIncidentSelect={(data) => setSelectedItem({ type: "Field Incident", data })}
              onVehicleSelect={(data) => setSelectedItem({ type: "Logistics Vehicle", data })}
              onRiskSelect={(data) => setSelectedItem({ type: "Hazard Risk Zone", data })}
              onRouteSelect={(data) => setSelectedItem({ type: "Logistics Route", data })}
              className="gis-map-container"
            />
          </div>

          {/* Interactive Inspection Panel */}
          {selectedItem && (
            <div className="card inspector-card">
              <div className="inspector-header">
                <div className="inspector-title">
                  <MapPin className="inspector-icon" />
                  <span>Geospatial Inspector — {selectedItem.type}</span>
                </div>
                <button onClick={() => setSelectedItem(null)} className="clear-selection-btn">
                  Clear Selection
                </button>
              </div>

              <div className="inspector-grid">
                {Object.entries(selectedItem.data).map(([key, value]) => (
                  <div key={key} className="inspector-box">
                    <div className="inspector-label">{key.replace(/([A-Z])/g, " $1")}</div>
                    <div className="inspector-value" title={typeof value === "object" ? JSON.stringify(value) : String(value)}>
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;

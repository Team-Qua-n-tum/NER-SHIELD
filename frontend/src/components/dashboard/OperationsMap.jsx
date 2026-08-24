import React, { useState } from 'react';
import {
  Layers,
  MapPin,
  Eye,
  EyeOff,
  Navigation,
  AlertTriangle,
  Truck,
  ShieldAlert,
  Info,
  Maximize2,
  X,
  ExternalLink,
} from 'lucide-react';
import { NERMap } from '../map';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const OperationsMap = ({
  selectedRouteId,
  onSelectRouteId,
  onInspectItem,
  inspectedItem,
  onClearInspection,
  height = '560px',
  className = '',
}) => {
  // Layer toggles
  const [showDistricts, setShowDistricts] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showRisks, setShowRisks] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSelection = (type, data) => {
    if (onInspectItem) {
      onInspectItem({ type, data });
    }
  };

  return (
    <div className={`operations-map-container ${isFullscreen ? 'map-fullscreen-mode' : ''} ${className}`}>
      {/* Map Control Header Bar */}
      <div className="map-toolbar">
        <div className="map-toolbar-left">
          <div className="map-title-row">
            <Navigation className="map-title-icon text-emerald" />
            <h3 className="map-title">NER GIS Operational Geospatial Surface</h3>
            <Badge variant="success" size="sm">Live CartoDB Voyager</Badge>
          </div>
        </div>

        {/* Route Filter Focus Pills */}
        <div className="map-route-pills">
          <button
            onClick={() => onSelectRouteId && onSelectRouteId(undefined)}
            className={`map-route-pill ${selectedRouteId === undefined ? 'pill-active-all' : ''}`}
          >
            All Corridors
          </button>
          <button
            onClick={() => onSelectRouteId && onSelectRouteId('ROUTE-PRIMARY')}
            className={`map-route-pill ${selectedRouteId === 'ROUTE-PRIMARY' ? 'pill-active-blocked' : ''}`}
          >
            🔴 Primary (Blocked)
          </button>
          <button
            onClick={() => onSelectRouteId && onSelectRouteId('ROUTE-ALTERNATE')}
            className={`map-route-pill ${selectedRouteId === 'ROUTE-ALTERNATE' ? 'pill-active-safe' : ''}`}
          >
            🟢 AI-Safe Bypass
          </button>
        </div>

        <div className="map-toolbar-right">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="map-fullscreen-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            <Maximize2 className="fullscreen-icon" />
          </button>
        </div>
      </div>

      {/* Layer Visibility Quick Controls */}
      <div className="map-layer-toggles-bar">
        <span className="layer-bar-label">Active Layers:</span>
        <button
          onClick={() => setShowDistricts(!showDistricts)}
          className={`layer-toggle-btn ${showDistricts ? 'layer-btn-on' : 'layer-btn-off'}`}
        >
          <span className="layer-indicator district-indicator" />
          Districts
        </button>
        <button
          onClick={() => setShowRoads(!showRoads)}
          className={`layer-toggle-btn ${showRoads ? 'layer-btn-on' : 'layer-btn-off'}`}
        >
          <span className="layer-indicator road-indicator" />
          Roads
        </button>
        <button
          onClick={() => setShowIncidents(!showIncidents)}
          className={`layer-toggle-btn ${showIncidents ? 'layer-btn-on' : 'layer-btn-off'}`}
        >
          <AlertTriangle className="layer-toggle-icon text-rose" />
          Incidents
        </button>
        <button
          onClick={() => setShowVehicles(!showVehicles)}
          className={`layer-toggle-btn ${showVehicles ? 'layer-btn-on' : 'layer-btn-off'}`}
        >
          <Truck className="layer-toggle-icon text-blue" />
          Fleet
        </button>
        <button
          onClick={() => setShowRisks(!showRisks)}
          className={`layer-toggle-btn ${showRisks ? 'layer-btn-on' : 'layer-btn-off'}`}
        >
          <ShieldAlert className="layer-toggle-icon text-purple" />
          Hazard Zones
        </button>
        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className={`layer-toggle-btn ${showRoutes ? 'layer-btn-on' : 'layer-btn-off'}`}
        >
          <Navigation className="layer-toggle-icon text-emerald" />
          Routes
        </button>
      </div>

      {/* Map Body */}
      <div className="map-embed-wrapper" style={{ height: isFullscreen ? 'calc(100vh - 120px)' : height }}>
        <NERMap
          showDistricts={showDistricts}
          showRoads={showRoads}
          showIncidents={showIncidents}
          showVehicles={showVehicles}
          showRisks={showRisks}
          showRoutes={showRoutes}
          selectedRouteId={selectedRouteId}
          onDistrictSelect={(data) => handleSelection('District', data)}
          onRoadSelect={(data) => handleSelection('Road Corridor', data)}
          onIncidentSelect={(data) => handleSelection('Field Incident', data)}
          onVehicleSelect={(data) => handleSelection('Logistics Vehicle', data)}
          onRiskSelect={(data) => handleSelection('Hazard Risk Zone', data)}
          onRouteSelect={(data) => handleSelection('Logistics Route', data)}
          className="gis-map-container"
        />
      </div>

      {/* Interactive Feature Inspector Panel */}
      {inspectedItem && inspectedItem.data && (
        <div className="map-inspector-drawer">
          <div className="drawer-header">
            <div className="drawer-title-row">
              <MapPin className="drawer-icon" />
              <span>Inspector: {inspectedItem.type}</span>
            </div>
            <button onClick={onClearInspection} className="drawer-close-btn" aria-label="Close Inspector">
              <X className="drawer-close-icon" />
            </button>
          </div>

          <div className="drawer-grid">
            {Object.entries(inspectedItem.data).map(([key, value]) => {
              if (key === 'waypoints' || key === 'coordinates') return null;
              return (
                <div key={key} className="drawer-item">
                  <div className="drawer-item-key">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div
                    className="drawer-item-val"
                    title={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  >
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsMap;

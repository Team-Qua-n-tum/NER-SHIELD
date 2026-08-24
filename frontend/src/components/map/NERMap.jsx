import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { DistrictLayer } from "./DistrictLayer";
import { RoadLayer } from "./RoadLayer";
import { IncidentMarkers } from "./IncidentMarkers";
import { VehicleMarkers } from "./VehicleMarkers";
import { RiskLayer } from "./RiskLayer";
import { RouteLayer } from "./RouteLayer";

const DEFAULT_NER_CENTER = [25.8, 92.5];
const DEFAULT_NER_ZOOM = 7;

export const NERMap = ({
  center = DEFAULT_NER_CENTER,
  zoom = DEFAULT_NER_ZOOM,
  showDistricts = true,
  showRoads = true,
  showIncidents = true,
  showVehicles = true,
  showRisks = true,
  showRoutes = true,
  districtData,
  roadData,
  incidentData,
  vehicleData,
  riskData,
  routeData,
  selectedRouteId,
  onDistrictSelect,
  onRoadSelect,
  onIncidentSelect,
  onVehicleSelect,
  onRiskSelect,
  onRouteSelect,
  className = "gis-map-container",
  children,
}) => {
  return (
    <div className={`relative-map-wrapper ${className}`} style={{ position: "relative" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="leaflet-map-element"
        style={{ height: "100%", width: "100%" }}
      >
        {/* Dark CartoDB basemap — shows road network clearly */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Geospatial Layers */}
        <DistrictLayer data={districtData} visible={showDistricts} onDistrictSelect={onDistrictSelect} />
        <RiskLayer data={riskData} visible={showRisks} onRiskSelect={onRiskSelect} />
        <RoadLayer data={roadData} visible={showRoads} onRoadSelect={onRoadSelect} />
        <RouteLayer
          data={routeData}
          visible={showRoutes}
          selectedRouteId={selectedRouteId}
          onRouteSelect={onRouteSelect}
        />
        <IncidentMarkers data={incidentData} visible={showIncidents} onIncidentSelect={onIncidentSelect} />
        <VehicleMarkers data={vehicleData} visible={showVehicles} onVehicleSelect={onVehicleSelect} />

        {children}
      </MapContainer>

      {/* OSRM Attribution Badge */}
      {showRoutes && (
        <div className="osrm-notice-badge">
          🛣️ Routes: Real-road via OSRM / OpenStreetMap
        </div>
      )}
    </div>
  );
};

export default NERMap;

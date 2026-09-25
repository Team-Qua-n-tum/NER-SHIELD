import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { DistrictLayer } from "./DistrictLayer";
import { RoadLayer } from "./RoadLayer";
import { IncidentMarkers } from "./IncidentMarkers";
import { VehicleMarkers } from "./VehicleMarkers";
import { RiskLayer } from "./RiskLayer";
import { RouteLayer } from "./RouteLayer";

const DEFAULT_NER_CENTER = [25.8, 92.5];
const DEFAULT_NER_ZOOM = 7;
const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const MapSizeObserver = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const refreshSize = () => map.invalidateSize({ pan: false });
    refreshSize();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(refreshSize);

    observer.observe(container);

    return () => observer.disconnect();
  }, [map]);

  return null;
};

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
  let tileUrl = import.meta.env.VITE_MAP_TILE_URL;
  let attribution = import.meta.env.VITE_MAP_ATTRIBUTION || OSM_ATTRIBUTION;
  const apiKey = import.meta.env.VITE_MAP_API_KEY;

  if (!tileUrl) {
    tileUrl = OSM_TILE_URL;
    attribution = OSM_ATTRIBUTION;
  } else if (tileUrl.includes("apiKey") || tileUrl.includes("accessToken") || tileUrl.includes("API_KEY") || tileUrl.includes("api_key")) {
    if (!apiKey) {
      console.warn("Commercial map provider key is missing. Falling back to OpenStreetMap.");
      tileUrl = OSM_TILE_URL;
      attribution = OSM_ATTRIBUTION;
    } else {
      tileUrl = tileUrl.replace(/\{(apiKey|accessToken|API_KEY|api_key)\}/gi, apiKey);
    }
  }

  return (
    <div className={`relative-map-wrapper ${className}`} style={{ position: "relative", minHeight: "320px" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="leaflet-map-element"
        style={{ height: "100%", width: "100%" }}
      >
        <MapSizeObserver />
        <TileLayer
          attribution={attribution}
          url={tileUrl}
          maxZoom={20}
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

"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { DistrictLayer } from "./DistrictLayer";
import { RoadLayer } from "./RoadLayer";
import { IncidentMarkers } from "./IncidentMarkers";
import { VehicleMarkers } from "./VehicleMarkers";
import { RiskLayer } from "./RiskLayer";
import { RouteLayer } from "./RouteLayer";

export interface NERMapProps {
  center?: [number, number];
  zoom?: number;
  showDistricts?: boolean;
  showRoads?: boolean;
  showIncidents?: boolean;
  showVehicles?: boolean;
  showRisks?: boolean;
  showRoutes?: boolean;
  districtData?: any;
  roadData?: any;
  incidentData?: any;
  vehicleData?: any;
  riskData?: any;
  routeData?: any;
  selectedRouteId?: string;
  onDistrictSelect?: (district: any) => void;
  onRoadSelect?: (road: any) => void;
  onIncidentSelect?: (incident: any) => void;
  onVehicleSelect?: (vehicle: any) => void;
  onRiskSelect?: (risk: any) => void;
  onRouteSelect?: (route: any) => void;
  className?: string;
  children?: React.ReactNode;
}

// Fixed center for North Eastern Region (NER), India: Assam / Meghalaya focus
const DEFAULT_NER_CENTER: [number, number] = [25.8, 92.5];
const DEFAULT_NER_ZOOM = 7;

export const NERMap: React.FC<NERMapProps> = ({
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
  className = "w-full h-full min-h-[500px] rounded-lg shadow-lg overflow-hidden",
  children,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 text-slate-300 font-sans ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium tracking-wide">Initializing NER GIS Geospatial Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Geospatial Layers */}
        <DistrictLayer data={districtData} visible={showDistricts} onDistrictSelect={onDistrictSelect} />
        <RiskLayer data={riskData} visible={showRisks} onRiskSelect={onRiskSelect} />
        <RoadLayer data={roadData} visible={showRoads} onRoadSelect={onRoadSelect} />
        <RouteLayer data={routeData} visible={showRoutes} selectedRouteId={selectedRouteId} onRouteSelect={onRouteSelect} />
        <IncidentMarkers data={incidentData} visible={showIncidents} onIncidentSelect={onIncidentSelect} />
        <VehicleMarkers data={vehicleData} visible={showVehicles} onVehicleSelect={onVehicleSelect} />

        {children}
      </MapContainer>
    </div>
  );
};

export default NERMap;

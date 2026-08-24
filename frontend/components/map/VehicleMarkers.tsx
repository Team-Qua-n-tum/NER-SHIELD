"use client";

import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import defaultVehicles from "@/data/geojson/vehicles.json";

interface VehicleMarkersProps {
  data?: any;
  visible?: boolean;
  onVehicleSelect?: (properties: any) => void;
}

const createVehicleIcon = (vehicleType: string) => {
  let bgColor = "#2563eb"; // Blue for logistics trucks
  let iconChar = "🚚";

  if (vehicleType?.includes("Emergency") || vehicleType?.includes("Relief")) {
    iconChar = "🚑";
    bgColor = "#dc2626";
  } else if (vehicleType?.includes("Tanker")) {
    iconChar = "🚛";
    bgColor = "#d97706";
  }

  const html = `
    <div style="
      background-color: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      ${iconChar}
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-vehicle-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const VehicleMarkers: React.FC<VehicleMarkersProps> = ({
  data = defaultVehicles,
  visible = true,
  onVehicleSelect,
}) => {
  if (!visible || !data || !data.features) return null;

  return (
    <>
      {data.features.map((feature: any, index: number) => {
        const coords = feature.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;

        const position: [number, number] = [coords[1], coords[0]];
        const props = feature.properties || {};
        const icon = createVehicleIcon(props.vehicleType);

        return (
          <Marker
            key={feature.id || index}
            position={position}
            icon={icon}
            eventHandlers={{
              click: () => onVehicleSelect && onVehicleSelect(props),
            }}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", padding: "4px", minWidth: "200px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "14px", color: "#1e293b" }}>
                    {props.vehicleId || "Vehicle"}
                  </span>
                  <span
                    style={{
                      backgroundColor: "#3b82f6",
                      color: "#fff",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {props.speedKmH || 0} km/h
                  </span>
                </div>

                <div style={{ fontSize: "12px", lineHeight: "1.5", color: "#334155" }}>
                  <div><strong>Type:</strong> {props.vehicleType || "Logistics Truck"}</div>
                  <div><strong>Driver:</strong> {props.driverName || "N/A"}</div>
                  <div><strong>Cargo:</strong> {props.cargo || "General Goods"}</div>
                  <div><strong>Route:</strong> {props.origin || "?"} ➔ {props.destination || "?"}</div>
                  <div><strong>Status:</strong> <span style={{ color: "#2563eb", fontWeight: "600" }}>{props.status || "In Transit"}</span></div>
                  <div style={{ marginTop: "4px", fontSize: "10px", color: "#94a3b8" }}>
                    Signal: {props.lastSignal || "Live"}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

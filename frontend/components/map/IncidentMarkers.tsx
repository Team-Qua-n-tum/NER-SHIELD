"use client";

import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import defaultIncidents from "@/data/geojson/incidents.json";

interface IncidentMarkersProps {
  data?: any;
  visible?: boolean;
  onIncidentSelect?: (properties: any) => void;
}

const createIncidentIcon = (severity: string, type: string) => {
  let bgColor = "#ef4444"; // Red for critical/high
  let iconChar = "⚠️";

  if (type === "Landslide") {
    iconChar = "⛰️";
    bgColor = severity === "Critical" ? "#b91c1c" : "#f97316";
  } else if (type === "Flood") {
    iconChar = "🌊";
    bgColor = "#0284c7";
  } else if (type === "Weather") {
    iconChar = "🌫️";
    bgColor = "#eab308";
  } else if (type === "Roadwork") {
    iconChar = "🚧";
    bgColor = "#f59e0b";
  }

  const html = `
    <div style="
      background-color: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9), 0 4px 10px rgba(0,0,0,0.3);
      border: 2px solid white;
      animation: pulse 2s infinite;
    ">
      ${iconChar}
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-incident-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const IncidentMarkers: React.FC<IncidentMarkersProps> = ({
  data = defaultIncidents,
  visible = true,
  onIncidentSelect,
}) => {
  if (!visible || !data || !data.features) return null;

  return (
    <>
      {data.features.map((feature: any, index: number) => {
        const coords = feature.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;

        // GeoJSON is [lng, lat], Leaflet Marker expects [lat, lng]
        const position: [number, number] = [coords[1], coords[0]];
        const props = feature.properties || {};

        const icon = createIncidentIcon(props.severity, props.type);

        return (
          <Marker
            key={feature.id || index}
            position={position}
            icon={icon}
            eventHandlers={{
              click: () => onIncidentSelect && onIncidentSelect(props),
            }}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", padding: "4px", minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span
                    style={{
                      backgroundColor: props.severity === "Critical" ? "#ef4444" : "#f97316",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: "bold",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    {props.severity || "Warning"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{props.type || "Incident"}</span>
                </div>

                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "14px" }}>
                  {props.title || "Road Incident"}
                </h4>

                <div style={{ fontSize: "12px", lineHeight: "1.5", color: "#334155" }}>
                  <div><strong>Location:</strong> {props.location || "N/A"}</div>
                  <div><strong>Impact:</strong> {props.impact || "N/A"}</div>
                  <div><strong>Est. Clearance:</strong> {props.estimatedClearance || "TBD"}</div>
                  <div style={{ marginTop: "4px", fontSize: "11px", color: "#94a3b8" }}>
                    Reported by: {props.verifiedBy || "System"}
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

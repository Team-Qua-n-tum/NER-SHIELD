import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import defaultIncidents from "../../data/incidents.json";

const createIncidentIcon = (severity, type) => {
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
    <div class="custom-gis-pulse-marker" style="background-color: ${bgColor};">
      ${iconChar}
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-incident-marker-container",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const IncidentMarkers = ({
  data = defaultIncidents,
  visible = true,
  onIncidentSelect,
}) => {
  if (!visible || !data || !data.features) return null;

  return (
    <>
      {data.features.map((feature, index) => {
        const coords = feature.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;

        const position = [coords[1], coords[0]];
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
              <div class="gis-popup-content" style={{ minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span
                    class="gis-badge"
                    style={{
                      backgroundColor: props.severity === "Critical" ? "#ef4444" : "#f97316",
                    }}
                  >
                    {props.severity || "Warning"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>{props.type || "Incident"}</span>
                </div>

                <h4>{props.title || "Road Incident"}</h4>

                <div class="gis-popup-info">
                  <div><strong>Location:</strong> {props.location || "N/A"}</div>
                  <div><strong>Impact:</strong> {props.impact || "N/A"}</div>
                  <div><strong>Est. Clearance:</strong> {props.estimatedClearance || "TBD"}</div>
                  <div style={{ marginTop: "4px", fontSize: "11px", color: "#64748b" }}>
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

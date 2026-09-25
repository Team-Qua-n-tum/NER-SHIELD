import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import defaultVehicles from "../../data/vehicles.json";

const createVehicleIcon = (vehicleType) => {
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
    <div class="custom-gis-vehicle-badge" style="background-color: ${bgColor};">
      ${iconChar}
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-vehicle-marker-container",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const VehicleMarkers = ({
  data = defaultVehicles,
  visible = true,
  onVehicleSelect,
}) => {
  if (!visible || !data || !data.features) return null;

  return (
    <>
      {data.features.map((feature, index) => {
        const coords = feature.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;

        const position = [coords[1], coords[0]];
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
              <div class="gis-popup-content" style={{ minWidth: "200px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "14px", color: "#f8fafc" }}>
                    {props.vehicleId || "Vehicle"}
                  </span>
                  <span class="gis-badge font-mono" style={{ backgroundColor: "#2563eb" }}>
                    {props.speedKmH || 0} km/h
                  </span>
                </div>

                <div class="gis-popup-info">
                  <div><strong>Type:</strong> {props.vehicleType || "Logistics Truck"}</div>
                  <div><strong>Driver:</strong> {props.driverName || "N/A"}</div>
                  <div><strong>Cargo:</strong> {props.cargo || "General Goods"}</div>
                  <div><strong>Route:</strong> {props.origin || "?"} ➔ {props.destination || "?"}</div>
                  <div><strong>Status:</strong> <span style={{ color: "#3b82f6", fontWeight: "600" }}>{props.status || "In Transit"}</span></div>
                  <div style={{ marginTop: "4px", fontSize: "10px", color: "#64748b" }}>
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

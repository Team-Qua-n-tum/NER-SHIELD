import React from "react";
import { GeoJSON } from "react-leaflet";
import defaultRoads from "../../data/roads.json";

export const RoadLayer = ({
  data = defaultRoads,
  visible = true,
  onRoadSelect,
}) => {
  if (!visible || !data) return null;

  const styleFeature = (feature) => {
    const status = feature.properties?.status || "Clear";
    let color = "#10b981"; // Emerald Green
    let weight = 4;
    let dashArray = undefined;

    if (status === "Blocked") {
      color = "#dc2626"; // Crimson Red
      weight = 5;
      dashArray = "4, 8";
    } else if (status === "Warning") {
      color = "#f59e0b"; // Amber Yellow
      weight = 4;
      dashArray = "8, 6";
    }

    return {
      color,
      weight,
      opacity: 0.9,
      dashArray,
    };
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const tooltipText = `<b>${props.code || props.name}</b>: ${props.segment || ""}<br/>Status: <b>${props.status || "Clear"}</b>`;
    layer.bindTooltip(tooltipText, { sticky: true });

    const popupContent = `
      <div class="gis-popup-content">
        <h4>${props.name || "Highway"}</h4>
        <div class="gis-popup-info">
          <div><strong>Segment:</strong> ${props.segment || "N/A"}</div>
          <div><strong>Status:</strong> <span style="font-weight: bold; color: ${
            props.status === "Blocked" ? "#dc2626" : props.status === "Warning" ? "#d97706" : "#059669"
          }">${props.status || "Clear"}</span></div>
          <div><strong>Surface:</strong> ${props.surface || "Asphalt"}</div>
          <div><strong>Speed Limit:</strong> ${props.speedLimitKmH || 50} km/h</div>
          ${props.remarks ? `<div style="margin-top: 4px; font-style: italic; color: #94a3b8;">"${props.remarks}"</div>` : ""}
        </div>
      </div>
    `;
    layer.bindPopup(popupContent);

    layer.on({
      click: () => {
        if (onRoadSelect) {
          onRoadSelect(props);
        }
      },
    });
  };

  return <GeoJSON key={JSON.stringify(data)} data={data} style={styleFeature} onEachFeature={onEachFeature} />;
};

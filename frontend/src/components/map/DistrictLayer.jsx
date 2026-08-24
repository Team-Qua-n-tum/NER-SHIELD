import React from "react";
import { GeoJSON } from "react-leaflet";
import defaultDistricts from "../../data/districts.json";

export const DistrictLayer = ({
  data = defaultDistricts,
  visible = true,
  onDistrictSelect,
}) => {
  if (!visible || !data) return null;

  const styleFeature = (feature) => {
    const riskScore = feature.properties?.riskScore || 0;
    const riskLevel = feature.properties?.riskLevel || "Low";

    let color = "#22c55e"; // Low risk green
    let fillOpacity = 0.2;

    if (riskLevel === "Critical" || riskScore >= 80) {
      color = "#ef4444"; // Red
      fillOpacity = 0.4;
    } else if (riskLevel === "High" || riskScore >= 60) {
      color = "#f97316"; // Orange
      fillOpacity = 0.35;
    } else if (riskLevel === "Moderate" || riskScore >= 40) {
      color = "#eab308"; // Yellow
      fillOpacity = 0.25;
    }

    return {
      fillColor: color,
      weight: 2,
      opacity: 0.8,
      color: color,
      dashArray: "3",
      fillOpacity: fillOpacity,
    };
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const tooltipText = `<b>${props.name || "District"}</b> (${props.state || "NER"})<br/>Status: ${props.accessibilityStatus || "Unknown"}`;
    layer.bindTooltip(tooltipText, { sticky: true });

    const popupContent = `
      <div class="gis-popup-content">
        <h4>${props.name || "District"}</h4>
        <div class="gis-popup-info">
          <div><strong>State:</strong> ${props.state || "NER"}</div>
          <div><strong>Headquarters:</strong> ${props.headquarters || "N/A"}</div>
          <div><strong>Risk Level:</strong> <span style="font-weight: bold; color: ${
            props.riskLevel === "Critical" ? "#ef4444" : props.riskLevel === "High" ? "#f97316" : "#22c55e"
          }">${props.riskLevel || "Low"} (${props.riskScore || 0}/100)</span></div>
          <div><strong>Status:</strong> ${props.accessibilityStatus || "Normal"}</div>
          <div><strong>Incidents:</strong> ${props.activeIncidents ?? 0} active</div>
        </div>
      </div>
    `;
    layer.bindPopup(popupContent);

    layer.on({
      click: () => {
        if (onDistrictSelect) {
          onDistrictSelect(props);
        }
      },
    });
  };

  return <GeoJSON key={JSON.stringify(data)} data={data} style={styleFeature} onEachFeature={onEachFeature} />;
};

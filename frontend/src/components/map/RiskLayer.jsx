import React from "react";
import { GeoJSON } from "react-leaflet";
import defaultRisks from "../../data/risks.json";

export const RiskLayer = ({
  data = defaultRisks,
  visible = true,
  onRiskSelect,
}) => {
  if (!visible || !data) return null;

  const styleFeature = (feature) => {
    const threat = feature.properties?.threatLevel || "High";
    let color = "#ef4444"; // Red
    let opacity = 0.18;

    if (threat === "Critical") {
      color = "#dc2626";
      opacity = 0.22;
    } else if (threat === "High") {
      color = "#f97316";
      opacity = 0.17;
    }

    return {
      fillColor: color,
      weight: 2,
      opacity: 0.9,
      color: color,
      dashArray: "6, 6",
      fillOpacity: opacity,
    };
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const tooltipText = `⚠️ <b>Hazard Zone:</b> ${props.zoneName || "Risk Corridor"}`;
    layer.bindTooltip(tooltipText, { sticky: true });

    const popupContent = `
      <div class="gis-popup-content" style={{ minWidth: "190px" }}>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span class="gis-badge" style="background-color: #dc2626;">
            ${props.threatLevel || "Hazard"}
          </span>
          <span style="font-size: 11px; color: #94a3b8;">${props.riskCategory || "Disruption Zone"}</span>
        </div>
        <h4>${props.zoneName || "Vulnerability Area"}</h4>
        <div class="gis-popup-info">
          <div><strong>Risk Score:</strong> ${props.vulnerabilityScore || 80}/100</div>
          <div class="gis-alert-box">
            ${props.advisory || "Caution advised"}
          </div>
        </div>
      </div>
    `;
    layer.bindPopup(popupContent);

    layer.on({
      click: () => onRiskSelect && onRiskSelect(props),
    });
  };

  return <GeoJSON key={JSON.stringify(data)} data={data} style={styleFeature} onEachFeature={onEachFeature} />;
};

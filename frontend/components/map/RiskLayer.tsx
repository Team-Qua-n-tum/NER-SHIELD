"use client";

import React from "react";
import { GeoJSON } from "react-leaflet";
import defaultRisks from "@/data/geojson/risks.json";

interface RiskLayerProps {
  data?: any;
  visible?: boolean;
  onRiskSelect?: (properties: any) => void;
}

export const RiskLayer: React.FC<RiskLayerProps> = ({
  data = defaultRisks,
  visible = true,
  onRiskSelect,
}) => {
  if (!visible || !data) return null;

  const styleFeature = (feature: any) => {
    const threat = feature.properties?.threatLevel || "High";
    let color = "#ef4444"; // Red
    let opacity = 0.4;

    if (threat === "Critical") {
      color = "#dc2626";
      opacity = 0.45;
    } else if (threat === "High") {
      color = "#f97316";
      opacity = 0.35;
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

  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties || {};
    const tooltipText = `⚠️ <b>Hazard Zone:</b> ${props.zoneName || "Risk Corridor"}`;
    layer.bindTooltip(tooltipText, { sticky: true });

    const popupContent = `
      <div style="font-family: sans-serif; padding: 4px; min-width: 190px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span style="background-color: #dc2626; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
            ${props.threatLevel || "Hazard"}
          </span>
          <span style="font-size: 11px; color: #64748b;">${props.riskCategory || "Disruption Zone"}</span>
        </div>
        <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 13px;">${props.zoneName || "Vulnerability Area"}</h4>
        <div style="font-size: 12px; color: #334155; line-height: 1.4;">
          <div><strong>Risk Score:</strong> ${props.vulnerabilityScore || 80}/100</div>
          <div style="margin-top: 4px; padding: 4px; background-color: #fef2f2; border-left: 3px solid #ef4444; border-radius: 2px; font-size: 11px; color: #991b1b;">
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

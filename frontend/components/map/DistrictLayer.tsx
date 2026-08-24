"use client";

import React from "react";
import { GeoJSON } from "react-leaflet";
import defaultDistricts from "@/data/geojson/districts.json";

interface DistrictLayerProps {
  data?: any;
  visible?: boolean;
  onDistrictSelect?: (properties: any) => void;
}

export const DistrictLayer: React.FC<DistrictLayerProps> = ({
  data = defaultDistricts,
  visible = true,
  onDistrictSelect,
}) => {
  if (!visible || !data) return null;

  const styleFeature = (feature: any) => {
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

  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties || {};
    const tooltipText = `<b>${props.name || "District"}</b> (${props.state || "NER"})<br/>Status: ${props.accessibilityStatus || "Unknown"}`;
    layer.bindTooltip(tooltipText, { sticky: true });

    const popupContent = `
      <div style="font-family: sans-serif; padding: 4px; min-width: 180px;">
        <h4 style="margin: 0 0 6px 0; color: #1e293b; font-size: 14px;">${props.name || "District"}</h4>
        <div style="font-size: 12px; line-height: 1.5; color: #475569;">
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

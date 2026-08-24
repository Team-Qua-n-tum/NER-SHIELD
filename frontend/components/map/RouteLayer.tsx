"use client";

import React from "react";
import { GeoJSON } from "react-leaflet";
import defaultRoutes from "@/data/geojson/routes.json";

interface RouteLayerProps {
  data?: any;
  visible?: boolean;
  selectedRouteId?: string;
  onRouteSelect?: (properties: any) => void;
}

export const RouteLayer: React.FC<RouteLayerProps> = ({
  data = defaultRoutes,
  visible = true,
  selectedRouteId,
  onRouteSelect,
}) => {
  if (!visible || !data) return null;

  const styleFeature = (feature: any) => {
    const isSelected = selectedRouteId ? feature.id === selectedRouteId : true;
    const props = feature.properties || {};
    const isAlternate = props.routeType?.includes("Alternate") || props.color === "#10b981";

    const baseColor = props.color || (isAlternate ? "#10b981" : "#ef4444");

    return {
      color: baseColor,
      weight: isSelected ? 6 : 3,
      opacity: isSelected ? 0.95 : 0.4,
      dashArray: isAlternate ? undefined : "6, 8",
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties || {};
    const tooltipText = `🛣️ <b>${props.routeName || "Route"}</b><br/>Distance: ${props.distanceKm || 0} km | ETA: ${props.estimatedTimeHours || 0} hrs`;
    layer.bindTooltip(tooltipText, { sticky: true });

    const popupContent = `
      <div style="font-family: sans-serif; padding: 4px; min-width: 210px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="background-color: ${props.color || "#10b981"}; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; borderRadius: 4px;">
            ${props.routeType || "Route Option"}
          </span>
          <span style="font-size: 11px; font-weight: bold; color: ${props.status === "Blocked" ? "#dc2626" : "#059669"};">
            ${props.status || "Clear"}
          </span>
        </div>
        <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 13px;">${props.routeName || "Logistics Route"}</h4>
        <div style="font-size: 12px; color: #334155; line-height: 1.5;">
          <div><strong>Distance:</strong> ${props.distanceKm || 0} km</div>
          <div><strong>Est. Duration:</strong> ${props.estimatedTimeHours || 0} hours</div>
          <div style="margin-top: 4px; font-size: 11px; color: #475569; background: #f8fafc; padding: 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
            ${props.description || ""}
          </div>
        </div>
      </div>
    `;
    layer.bindPopup(popupContent);

    layer.on({
      click: () => onRouteSelect && onRouteSelect(props),
    });
  };

  return <GeoJSON key={JSON.stringify(data) + (selectedRouteId || "")} data={data} style={styleFeature} onEachFeature={onEachFeature} />;
};

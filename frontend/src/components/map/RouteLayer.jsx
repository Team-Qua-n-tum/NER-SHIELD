import React from "react";
import { GeoJSON } from "react-leaflet";
import defaultRoutes from "../../data/routes.json";

export const RouteLayer = ({
  data = defaultRoutes,
  visible = true,
  selectedRouteId,
  onRouteSelect,
}) => {
  if (!visible || !data) return null;

  const styleFeature = (feature) => {
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

  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const tooltipText = `🛣️ <b>${props.routeName || "Route"}</b><br/>Distance: ${props.distanceKm || 0} km | ETA: ${props.estimatedTimeHours || 0} hrs`;
    layer.bindTooltip(tooltipText, { sticky: true });

    const popupContent = `
      <div class="gis-popup-content" style="min-width: 210px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span class="gis-badge" style="background-color: ${props.color || "#10b981"};">
            ${props.routeType || "Route Option"}
          </span>
          <span style="font-size: 11px; font-weight: bold; color: ${props.status === "Blocked" ? "#dc2626" : "#059669"};">
            ${props.status || "Clear"}
          </span>
        </div>
        <h4>${props.routeName || "Logistics Route"}</h4>
        <div class="gis-popup-info">
          <div><strong>Distance:</strong> ${props.distanceKm || 0} km</div>
          <div><strong>Est. Duration:</strong> ${props.estimatedTimeHours || 0} hours</div>
          <div class="gis-desc-box">
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

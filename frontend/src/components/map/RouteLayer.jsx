import React, { useEffect, useState, useRef } from "react";
import { Polyline, Tooltip, Popup, useMap } from "react-leaflet";
import { fetchOSRMRoute } from "../../utils/osrm";
import defaultRoutes from "../../data/routes.json";

/**
 * RouteLayer — Renders logistics route overlays using real road geometry from OSRM.
 *
 * For each feature in the routes dataset, waypoints are used to fetch the
 * actual OpenStreetMap road path from the OSRM public routing API.
 * Falls back to straight-line waypoints if OSRM is unavailable.
 *
 * Props:
 *  - data:             GeoJSON FeatureCollection with waypoints in properties
 *  - visible:          boolean — whether to show this layer
 *  - selectedRouteId:  feature id string to highlight one route
 *  - onRouteSelect:    callback(properties) when user clicks a route
 */
export const RouteLayer = ({
  data = defaultRoutes,
  visible = true,
  selectedRouteId,
  onRouteSelect,
}) => {
  // routeGeometries: { [featureId]: { positions: [[lat, lng], ...], loaded: bool, error: bool } }
  const [routeGeometries, setRouteGeometries] = useState({});
  const fetchedRef = useRef(new Set());

  useEffect(() => {
    if (!visible || !data || !data.features) return;

    const fetchAll = async () => {
      for (const feature of data.features) {
        const id = feature.id;
        if (fetchedRef.current.has(id)) continue;
        fetchedRef.current.add(id);

        const waypoints = feature.properties?.waypoints;

        if (!waypoints || waypoints.length < 2) {
          // Fallback: use straight-line coords from geometry if available
          const coords = feature.geometry?.coordinates || [];
          setRouteGeometries((prev) => ({
            ...prev,
            [id]: {
              positions: coords.map(([lng, lat]) => [lat, lng]),
              loaded: true,
              error: false,
            },
          }));
          continue;
        }

        // Mark as loading
        setRouteGeometries((prev) => ({
          ...prev,
          [id]: { positions: [], loaded: false, error: false },
        }));

        const result = await fetchOSRMRoute(waypoints);

        if (result && result.coordinates.length > 0) {
          // OSRM returns [lng, lat]; Leaflet Polyline expects [lat, lng]
          const positions = result.coordinates.map(([lng, lat]) => [lat, lng]);
          setRouteGeometries((prev) => ({
            ...prev,
            [id]: { positions, loaded: true, error: false },
          }));
        } else {
          // Fallback to raw waypoints as straight lines
          const positions = waypoints.map(([lng, lat]) => [lat, lng]);
          setRouteGeometries((prev) => ({
            ...prev,
            [id]: { positions, loaded: true, error: true },
          }));
        }
      }
    };

    fetchAll();
  }, [data, visible]);

  if (!visible || !data || !data.features) return null;

  return (
    <>
      {data.features.map((feature) => {
        const id = feature.id;
        const props = feature.properties || {};
        const geo = routeGeometries[id];
        const isSelected = selectedRouteId ? id === selectedRouteId : true;

        if (!geo || !geo.loaded || geo.positions.length < 2) {
          // Still loading — skip rendering (no spinner on map needed)
          return null;
        }

        const baseColor = props.color || "#10b981";
        const isAlternate = props.routeType?.includes("Alternate");
        const weight = isSelected ? 6 : 3;
        const opacity = isSelected ? 0.95 : 0.4;
        const dashArray = isAlternate ? null : "10, 8";

        const tooltipText = `🛣️ ${props.routeName || "Route"}  |  Status: ${props.status || "Clear"}  |  ${props.distanceKm || "?"} km`;

        const popupContent = `
          <div class="gis-popup-content" style="min-width: 220px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span class="gis-badge" style="background-color: ${baseColor};">
                ${props.routeType || "Route"}
              </span>
              <span style="font-size: 11px; font-weight: bold; color: ${props.status === "Blocked" ? "#dc2626" : "#059669"};">
                ${props.status || "Clear"}
              </span>
            </div>
            <h4 style="font-size: 13px; margin: 0 0 6px 0; color: #0f172a;">${props.routeName || "Logistics Route"}</h4>
            <div class="gis-popup-info">
              <div><strong>Distance:</strong> ${props.distanceKm || "?"} km</div>
              <div><strong>Est. Time:</strong> ${props.estimatedTimeHours || "?"} hours</div>
              <div><strong>Risk Level:</strong> ${props.riskLevel || "N/A"}</div>
              ${geo.error ? `<div style="color:#f59e0b; font-size: 11px; margin-top: 4px;">⚠️ Showing fallback route (OSRM unavailable)</div>` : `<div style="color:#10b981; font-size: 10px; margin-top: 4px;">✅ Real road via OpenStreetMap / OSRM</div>`}
              <div class="gis-desc-box">${props.description || ""}</div>
            </div>
          </div>
        `;

        return (
          <Polyline
            key={`${id}-${isSelected}`}
            positions={geo.positions}
            pathOptions={{
              color: baseColor,
              weight,
              opacity,
              dashArray,
              lineCap: "round",
              lineJoin: "round",
            }}
            eventHandlers={{
              click: () => onRouteSelect && onRouteSelect(props),
            }}
          >
            <Tooltip sticky>{tooltipText}</Tooltip>
            <Popup>
              <div dangerouslySetInnerHTML={{ __html: popupContent }} />
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
};

export default RouteLayer;

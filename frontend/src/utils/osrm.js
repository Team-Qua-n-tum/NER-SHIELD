/**
 * osrm.js — OSRM Public Routing Engine Client
 * Fetches real road-following route geometry from the OSRM public demo server.
 * Uses OpenStreetMap road network data.
 *
 * OSRM API: http://router.project-osrm.org/route/v1/driving/{coords}
 * - coordinates format: lng,lat;lng,lat;...
 * - overview=full returns the full road geometry
 * - geometries=geojson returns GeoJSON LineString format
 */

const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

/**
 * Fetch a real-road route from OSRM given an array of [lng, lat] waypoints.
 * @param {Array<[number, number]>} waypoints - Array of [longitude, latitude] pairs
 * @returns {Promise<{coordinates: Array<[number, number]>, distance: number, duration: number} | null>}
 */
export async function fetchOSRMRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) return null;

  const coordString = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(";");
  const url = `${OSRM_BASE_URL}/${coordString}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[OSRM] Request failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.warn("[OSRM] No route found:", data.code);
      return null;
    }

    const route = data.routes[0];
    return {
      coordinates: route.geometry.coordinates, // Array of [lng, lat]
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  } catch (err) {
    console.error("[OSRM] Fetch error:", err);
    return null;
  }
}

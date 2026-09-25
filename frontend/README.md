# NER-SHIELD Frontend — GIS Module

This directory contains the client-side geospatial dashboard and maps component suite for the **AI-Based Smart Logistics and Accessibility Intelligence Platform for NER**.

It is implemented as a standard **React JS** application powered by **Vite** and styled using **Vanilla CSS** (Normal CSS).

---

## 🗺️ Geospatial Layer Components

All reusable map components are organized in `src/components/map/` and exported via `index.js`. 

Other team members can import them as follows:

```jsx
import { 
  NERMap, 
  DistrictLayer, 
  RoadLayer, 
  IncidentMarkers, 
  VehicleMarkers, 
  RiskLayer, 
  RouteLayer 
} from './components/map';
```

### Components List:
1. **`NERMap`**: Core React Leaflet Map container with OpenStreetMap tiles centered on North Eastern India (`[25.8, 92.5]`, zoom 7).
2. **`DistrictLayer`**: Renders district polygon boundaries color-coded by their risk score level (Critical/High/Moderate/Low).
3. **`RoadLayer`**: Renders major highway polyline networks styled according to accessibility status (Clear, Warning, Blocked).
4. **`IncidentMarkers`**: Renders custom icons for active field incidents (landslides, flash floods, dense fog) with detailed popups.
5. **`VehicleMarkers`**: Renders active tracked vehicles in transit with driver, cargo, speed, and heading info.
6. **`RiskLayer`**: Renders warning zones and buffer polygons highlighting regions of elevated hazard.
7. **`RouteLayer`**: Renders logistics paths, separating primary blocked routes from alternate safe bypasses.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Run Production Build
```bash
npm run build
```

---

## 📊 Sample Datasets
All sample GeoJSON feeds are stored under `src/data/` (e.g. `districts.json`, `roads.json`, `incidents.json`, etc.) and are labeled as **PROTOTYPE / SYNTHETIC DATA** representing the North Eastern Region of India.

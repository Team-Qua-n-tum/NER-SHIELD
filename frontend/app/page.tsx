"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Layers, MapPin, Truck, AlertTriangle, ShieldAlert, Navigation, Info, Activity } from "lucide-react";

// Dynamically import NERMap to prevent SSR window/Leaflet errors in Next.js
const NERMap = dynamic(() => import("@/components/map/NERMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] bg-slate-900 flex flex-col items-center justify-center text-slate-300 rounded-xl border border-slate-800">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-sm font-semibold tracking-wide">Loading NER-SHIELD Interactive GIS Engine...</p>
    </div>
  ),
});

export default function GISDashboardPage() {
  // Layer Visibility States
  const [showDistricts, setShowDistricts] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showRisks, setShowRisks] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Active Selection Info State
  const [selectedItem, setSelectedItem] = useState<{ type: string; data: any } | null>({
    type: "System Notice",
    data: {
      title: "NER GIS Module Ready",
      description: "Click on any district, road line, incident marker, or logistics vehicle to view detailed geospatial telemetry.",
    },
  });

  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(undefined);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">NER-SHIELD</h1>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                SIH26002
              </span>
              <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono">
                GIS Module
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Smart Logistics & Accessibility Intelligence Platform — North Eastern Region (NER)
            </p>
          </div>
        </div>

        {/* Prototype Data Banner Tag */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-lg">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>PROTOTYPE DATA:</strong> GeoJSON synthetic telemetry representing Assam, Meghalaya, Nagaland & Manipur
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6 max-w-[1920px] mx-auto w-full">
        {/* Left Control Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Quick Metrics */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              GIS Overview
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                <div className="text-xs text-slate-400">Districts</div>
                <div className="text-xl font-bold text-slate-100 mt-1">6 Covered</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                <div className="text-xs text-slate-400 font-medium">Road Corridors</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">5 Major</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                <div className="text-xs text-slate-400">Active Incidents</div>
                <div className="text-xl font-bold text-rose-400 mt-1">4 Field</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                <div className="text-xs text-slate-400">Logistics Fleet</div>
                <div className="text-xl font-bold text-blue-400 mt-1">4 Active</div>
              </div>
            </div>
          </div>

          {/* Layer Control Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Geospatial Layer Controls
            </h2>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800 rounded-lg cursor-pointer transition border border-slate-800">
                <span className="flex items-center gap-2.5 text-sm text-slate-200">
                  <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-400"></span>
                  District Boundaries
                </span>
                <input
                  type="checkbox"
                  checked={showDistricts}
                  onChange={(e) => setShowDistricts(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800 rounded-lg cursor-pointer transition border border-slate-800">
                <span className="flex items-center gap-2.5 text-sm text-slate-200">
                  <span className="w-3 h-3 rounded bg-amber-500"></span>
                  Road Corridors
                </span>
                <input
                  type="checkbox"
                  checked={showRoads}
                  onChange={(e) => setShowRoads(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800 rounded-lg cursor-pointer transition border border-slate-800">
                <span className="flex items-center gap-2.5 text-sm text-slate-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Incident Markers
                </span>
                <input
                  type="checkbox"
                  checked={showIncidents}
                  onChange={(e) => setShowIncidents(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800 rounded-lg cursor-pointer transition border border-slate-800">
                <span className="flex items-center gap-2.5 text-sm text-slate-200">
                  <Truck className="w-4 h-4 text-blue-400" />
                  Vehicle Locations
                </span>
                <input
                  type="checkbox"
                  checked={showVehicles}
                  onChange={(e) => setShowVehicles(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800 rounded-lg cursor-pointer transition border border-slate-800">
                <span className="flex items-center gap-2.5 text-sm text-slate-200">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  Risk Hazard Zones
                </span>
                <input
                  type="checkbox"
                  checked={showRisks}
                  onChange={(e) => setShowRisks(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800 rounded-lg cursor-pointer transition border border-slate-800">
                <span className="flex items-center gap-2.5 text-sm text-slate-200">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  Route Visualization
                </span>
                <input
                  type="checkbox"
                  checked={showRoutes}
                  onChange={(e) => setShowRoutes(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Route Filter Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Route Filter Focus
            </h2>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setSelectedRouteId(undefined)}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition ${
                  selectedRouteId === undefined
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Show All Routes
              </button>
              <button
                onClick={() => setSelectedRouteId("ROUTE-PRIMARY")}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition ${
                  selectedRouteId === "ROUTE-PRIMARY"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                }`}
              >
                🔴 Primary Route (Blocked)
              </button>
              <button
                onClick={() => setSelectedRouteId("ROUTE-ALTERNATE")}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition ${
                  selectedRouteId === "ROUTE-ALTERNATE"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                }`}
              >
                🟢 AI-Recommended Safe Route
              </button>
            </div>
          </div>
        </div>

        {/* Center/Right Map Display & Inspector */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          {/* Map Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 h-[620px] shadow-lg relative">
            <NERMap
              showDistricts={showDistricts}
              showRoads={showRoads}
              showIncidents={showIncidents}
              showVehicles={showVehicles}
              showRisks={showRisks}
              showRoutes={showRoutes}
              selectedRouteId={selectedRouteId}
              onDistrictSelect={(data) => setSelectedItem({ type: "District", data })}
              onRoadSelect={(data) => setSelectedItem({ type: "Road Segment", data })}
              onIncidentSelect={(data) => setSelectedItem({ type: "Field Incident", data })}
              onVehicleSelect={(data) => setSelectedItem({ type: "Logistics Vehicle", data })}
              onRiskSelect={(data) => setSelectedItem({ type: "Hazard Risk Zone", data })}
              onRouteSelect={(data) => setSelectedItem({ type: "Logistics Route", data })}
              className="w-full h-full rounded-lg"
            />
          </div>

          {/* Interactive Inspection Panel */}
          {selectedItem && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Geospatial Inspector — {selectedItem.type}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Clear Selection
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {Object.entries(selectedItem.data).map(([key, value]) => (
                  <div key={key} className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</div>
                    <div className="font-semibold text-slate-100 mt-0.5 truncate">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

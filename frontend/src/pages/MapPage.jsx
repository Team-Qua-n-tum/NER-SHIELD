import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar, Sidebar, NotificationPanel, ChatPanel } from '../components/common';
import { OperationsMap } from '../components/dashboard/OperationsMap';
import { Toast } from '../components/ui/Toast';
import {
  Map,
  Compass,
  Layers,
  MapPin,
  Truck,
  AlertTriangle,
  Radio,
  Filter
} from 'lucide-react';

export const MapPage = () => {
  const {
    selectedRouteId,
    setSelectedRouteId,
    inspectedItem,
    setInspectedItem,
    alerts,
    vehicles,
    toast,
    closeToast,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('map');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleSelectRoute = (routeId) => {
    setSelectedRouteId(routeId);
    showToast(
      routeId === 'ROUTE-ALTERNATE'
        ? 'Activated AI-Safe Corridor (NH-27 Nagaon-Dimapur)'
        : 'Displaying Primary Corridor (NH-6 Dima Hasao)',
      'success',
      'Route Filter'
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Universal Navbar */}
      <Navbar
        onToggleNotifications={() => setIsNotificationOpen(!isNotificationOpen)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        unreadAlertsCount={alerts.length}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="GIS Map Command"
        />

        {/* Center Main Work Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto min-w-0">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                  GIS Telemetry Live
                </span>
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span> 8 States Online
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Map className="w-6 h-6 text-cyan-400" />
                NER GIS Geospatial Operations Map
              </h1>
              <p className="text-xs text-slate-400">
                Interactive real-time map displaying terrain slope hazards, road blockades, live truck GPS telemetry, and district vulnerability boundaries.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => handleSelectRoute('ROUTE-ALTERNATE')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                <span>AI Safe Corridor</span>
              </button>
              <button
                onClick={() => setIsChatOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
              >
                <Radio className="w-4 h-4" />
                <span>Dispatch Comms</span>
              </button>
            </div>
          </div>

          {/* Full Screen GIS Map Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden p-1.5 sm:p-2.5 min-w-0">
            <OperationsMap
              selectedRouteId={selectedRouteId}
              onSelectRouteId={handleSelectRoute}
              inspectedItem={inspectedItem}
              onInspectItem={setInspectedItem}
              onClearInspection={() => setInspectedItem(null)}
              height="720px"
            />
          </div>

          {/* Map Layer Legend & Quick Telemetry Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-400" /> Active Freight Vehicles
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300">{vehicles.length} Trucks</span>
              </div>
              <p className="text-[11px] text-slate-400">
                GPS telemetry transmitting location, speed, fuel, and cold-chain container temperatures every 30s.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" /> Active Hazard Corridors
                </span>
                <span className="text-xs font-mono font-bold text-red-400">{alerts.length} Hazards</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Landslide on NH-6 Dima Hasao, monsoon flood on NH-37, fog on Umiam pass.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-400" /> AI Alternate Corridor
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">NH-27 Active</span>
              </div>
              <p className="text-[11px] text-slate-400">
                AI automated bypass routing diverting heavy freight safely around Dima Hasao chokepoint.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Notifications Panel */}
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Chat / Dispatch Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md">
          <Toast
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        </div>
      )}
    </div>
  );
};

export default MapPage;

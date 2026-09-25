import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OperationsMap } from '../../components/dashboard/OperationsMap';
import { Map, Layers, Navigation } from 'lucide-react';

export const AdminMapPage = () => {
  const {
    selectedRouteId,
    setSelectedRouteId,
    inspectedItem,
    setInspectedItem,
    showToast,
  } = useApp();

  const handleInspect = (item) => {
    setInspectedItem(item);
    showToast(`Inspecting ${item.type || 'Feature'}: ${item.data?.name || item.data?.title || 'Selected'}`, 'info');
  };

  const handleSelectRoute = (routeId) => {
    setSelectedRouteId(routeId);
    showToast(
      routeId === 'ROUTE-ALTERNATE'
        ? 'Activated AI Safe Corridor (NH-27 Bypass)'
        : 'Displaying Primary Route (NH-6 Dima Hasao)',
      'info'
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Map className="w-6 h-6 text-cyan-400" />
            <span>Regional GIS Operations Map</span>
          </h1>
          <p className="text-xs text-slate-400">
            Interactive multi-state GIS surface showing district boundaries, highway networks, real-time hazards, and AI alternate corridors.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-2 shadow-2xl overflow-hidden">
        <OperationsMap
          selectedRouteId={selectedRouteId}
          onSelectRouteId={handleSelectRoute}
          inspectedItem={inspectedItem}
          onInspectItem={handleInspect}
          onClearInspection={() => setInspectedItem(null)}
          height="720px"
        />
      </div>
    </div>
  );
};

export default AdminMapPage;

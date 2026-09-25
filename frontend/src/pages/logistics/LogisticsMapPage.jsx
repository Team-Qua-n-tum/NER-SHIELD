import React from 'react';
import { OperationsMap } from '../../components/dashboard/OperationsMap';
import { Map, Truck } from 'lucide-react';

export const LogisticsMapPage = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Map className="w-6 h-6 text-cyan-400" />
          <span>Logistics Corridors & Fleet GIS Map</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time geospatial visualization of highway corridors, active vehicle positions, and high-resilience bypasses.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-2 shadow-2xl overflow-hidden">
        <OperationsMap height="680px" />
      </div>
    </div>
  );
};

export default LogisticsMapPage;

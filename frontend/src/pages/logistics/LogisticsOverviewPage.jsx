import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Route, AlertTriangle, Clock, Activity, CheckCircle2, Navigation } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const LogisticsOverviewPage = () => {
  const { user } = useAuth();
  const { vehicles, alerts } = useApp();

  const myVehicleIds = user?.vehicle_ids || [];
  const assignedVehicles = myVehicleIds.includes('*') || myVehicleIds.length === 0
    ? vehicles
    : vehicles.filter((v) => myVehicleIds.includes(v.id) || myVehicleIds.includes(v.vehicleNumber));

  const transitCount = assignedVehicles.filter((v) => v.status?.includes('Transit')).length;
  const delayedCount = assignedVehicles.filter((v) => v.status?.includes('Delayed') || v.status?.includes('Caution')).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              LOGISTICS & SUPPLY FREIGHT DESK
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            Freight Fleet & Route Command
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active monitoring of {assignedVehicles.length} essential emergency supply convoys and AI corridor bypasses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app/logistics/routes/new"
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-cyan-600/20"
          >
            <Route className="w-4 h-4" />
            <span>Plan Safe Route</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <Truck className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-white">{assignedVehicles.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Assigned Convoys</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <Activity className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-white">{transitCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">En Route</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-white">{delayedCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Delayed / Caution</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-white">{alerts.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Corridor Alerts</div>
        </div>
      </div>

      {/* Quick Nav Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/app/logistics/routes/new"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
        >
          <div className="font-bold text-white text-xs">Route Planner</div>
          <p className="text-[10px] text-slate-400 mt-1">Compute alternate corridors →</p>
        </Link>
        <Link
          to="/app/logistics/routes/history"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
        >
          <div className="font-bold text-white text-xs">Route History</div>
          <p className="text-[10px] text-slate-400 mt-1">Past calculated paths →</p>
        </Link>
        <Link
          to="/app/logistics/fleet"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
        >
          <div className="font-bold text-white text-xs">Fleet Details</div>
          <p className="text-[10px] text-slate-400 mt-1">Truck cargo & drivers →</p>
        </Link>
        <Link
          to="/app/logistics/map"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
        >
          <div className="font-bold text-white text-xs">Network Map</div>
          <p className="text-[10px] text-slate-400 mt-1">Corridor GIS display →</p>
        </Link>
      </div>

      {/* Active Convoys List */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-400" />
            <span>Active Supply Shipments</span>
          </h2>
          <Link to="/app/logistics/fleet" className="text-xs text-cyan-400 hover:underline">
            Manage Fleet →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedVehicles.map((v) => (
            <div key={v.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">{v.vehicleNumber || v.id}</h3>
                  <p className="text-[10px] text-slate-400">{v.type || 'Heavy Carrier'} · Cargo: <strong className="text-slate-200">{v.cargo || 'General'}</strong></p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {v.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                <span>Route: {v.origin} → {v.destination}</span>
                <span className="font-mono text-slate-300">ETA: {v.eta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogisticsOverviewPage;

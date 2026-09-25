import React, { useState } from 'react';
import { Truck, Navigation, Search, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const LogisticsFleetPage = () => {
  const { user } = useAuth();
  const { vehicles } = useApp();
  const [search, setSearch] = useState('');

  const myVehicleIds = user?.vehicle_ids || [];
  const assignedVehicles = myVehicleIds.includes('*') || myVehicleIds.length === 0
    ? vehicles
    : vehicles.filter((v) => myVehicleIds.includes(v.id) || myVehicleIds.includes(v.vehicleNumber));

  const filtered = assignedVehicles.filter((v) =>
    (v.vehicleNumber || v.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.cargo || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan-400" />
            <span>Assigned Freight Vehicles & Convoys</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time convoy telemetry, cargo types, cold-chain battery levels, and driver details.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vehicle or cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((v) => (
          <div key={v.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{v.vehicleNumber || v.id}</h3>
                  <p className="text-[10px] text-slate-400">{v.type || 'Heavy Freight Carrier'}</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  v.status?.includes('Transit')
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {v.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-3">
              <div>
                <span className="text-[10px] text-slate-500 block">Cargo Manifest</span>
                <strong className="text-white">{v.cargo || 'General Medical Aid'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Assigned Driver</span>
                <span className="text-slate-300">{v.driverName || 'Patrol Unit'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Corridor Progress</span>
                <span className="text-slate-400">{v.origin} → {v.destination}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Destination ETA</span>
                <span className="font-mono text-cyan-400 font-bold">{v.eta || 'On Schedule'}</span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-slate-900 rounded-3xl border border-slate-800">
            No assigned vehicles found matching search.
          </div>
        )}
      </div>
    </div>
  );
};

export default LogisticsFleetPage;

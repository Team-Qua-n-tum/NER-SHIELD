import React, { useState } from 'react';
import { Truck, Navigation, Search, Filter, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VehicleTable } from '../../components/common/VehicleTable';

export const AdminFleetPage = () => {
  const { vehicles, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = vehicles.filter((v) =>
    (v.vehicleNumber || v.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.cargo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.destination || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-400" />
            <span>Regional Fleet Operations Desk</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time convoy telemetry, cargo types, cold-chain monitoring, and emergency route transit status.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vehicle, cargo, dest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-64"
          />
        </div>
      </div>

      {/* Fleet Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <VehicleTable vehicles={filteredVehicles.length > 0 ? filteredVehicles : vehicles} />
      </div>
    </div>
  );
};

export default AdminFleetPage;

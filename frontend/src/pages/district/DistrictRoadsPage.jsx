import React, { useState } from 'react';
import { Activity, ShieldCheck, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const DistrictRoadsPage = () => {
  const { user } = useAuth();
  const { showToast } = useApp();

  const [localRoads, setLocalRoads] = useState([
    { id: 'RD-01', name: 'NH-6 Arterial Stretch', status: 'Blocked', condition: 'Debris & mudflow across 2 lanes', crew: 'BRO Task Force 42', eta: '12 Hours' },
    { id: 'RD-02', name: 'Haflong - Jatinga Link Road', status: 'Partially Open', condition: 'Single-lane controlled convoy transit', crew: 'SDRF District Team', eta: '4 Hours' },
    { id: 'RD-03', name: 'Umrangso Industrial Bypass', status: 'Open', condition: 'Clear; surface moisture moderate', crew: 'Patrol Team 2', eta: 'Operational' },
    { id: 'RD-04', name: 'Silchar Northern Feeder', status: 'Open', condition: 'Normal freight capacity', crew: 'Civil Police Patrol', eta: 'Operational' },
  ]);

  const handleUpdate = (id, newStatus) => {
    setLocalRoads((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    showToast(`Road ${id} updated to ${newStatus}.`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-emerald-400" />
          <span>District Road Clearance & Passability</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Direct status controls for highway sectors and feeder links within your district boundary.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localRoads.map((road) => (
          <div key={road.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">{road.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{road.condition}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  road.status === 'Open'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : road.status === 'Blocked'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {road.status}
              </span>
            </div>

            <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span>Crew: <strong className="text-slate-300">{road.crew}</strong></span>
              <span className="font-mono text-cyan-400">{road.eta}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleUpdate(road.id, 'Open')}
                className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-colors text-center"
              >
                Mark Open
              </button>
              <button
                onClick={() => handleUpdate(road.id, 'Partially Open')}
                className="flex-1 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/20 transition-colors text-center"
              >
                Partial
              </button>
              <button
                onClick={() => handleUpdate(road.id, 'Blocked')}
                className="flex-1 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-colors text-center"
              >
                Blocked
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DistrictRoadsPage;

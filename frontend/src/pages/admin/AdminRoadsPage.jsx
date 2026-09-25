import React, { useState } from 'react';
import { Activity, ShieldCheck, AlertTriangle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const INITIAL_CORRIDORS = [
  { id: 'CORR-01', name: 'NH-6 (Barapani — Shillong — Silchar)', state: 'Meghalaya / Assam', status: 'Blocked', reason: 'Multiple landslides around Km 142 (Dima Hasao)', clearanceEta: '14 Hours', bypass: 'NH-27 via Nagaon' },
  { id: 'CORR-02', name: 'NH-27 (Guwahati — Lumding — Silchar Bypass)', state: 'Assam', status: 'Open', reason: 'Designated high-resilience AI freight corridor', clearanceEta: 'Active', bypass: 'None (Primary Safe Corridor)' },
  { id: 'CORR-03', name: 'NH-102 (Imphal — Moreh Border Road)', state: 'Manipur', status: 'Partially Open', reason: 'Single-lane mudflow clearance at Km 48', clearanceEta: '6 Hours', bypass: 'Local hill diversions' },
  { id: 'CORR-04', name: 'NH-29 (Dimapur — Kohima Express)', state: 'Nagaland', status: 'Open', reason: 'BRO reinforcement completed on Pagla Pahar stretch', clearanceEta: 'Active', bypass: 'None' },
  { id: 'CORR-05', name: 'NH-208 (Agartala — Sabroom Corridor)', state: 'Tripura', status: 'Open', reason: 'Clear weather; all culverts inspected', clearanceEta: 'Active', bypass: 'None' },
  { id: 'CORR-06', name: 'NH-10 (Siliguri — Gangtok Lifeline)', state: 'Sikkim / WB', status: 'Partially Open', reason: 'Teesta basin waterlogging; heavy vehicles diverted', clearanceEta: '8 Hours', bypass: 'Lava-Algarah corridor' },
];

export const AdminRoadsPage = () => {
  const [corridors, setCorridors] = useState(INITIAL_CORRIDORS);
  const { showToast } = useApp();

  const handleUpdateStatus = (id, newStatus) => {
    setCorridors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    showToast(`Corridor ${id} status updated to ${newStatus}.`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>Northeast Highway Corridors Status</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time arterial highway passability, clearance ETA, and active bypass routes.
          </p>
        </div>
      </div>

      {/* Corridor Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4">Corridor Name</th>
                <th className="p-4">State</th>
                <th className="p-4">Status</th>
                <th className="p-4">Condition / Reason</th>
                <th className="p-4">Clearance ETA</th>
                <th className="p-4">Active Bypass</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {corridors.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-white whitespace-nowrap">{c.name}</td>
                  <td className="p-4 text-slate-400 whitespace-nowrap">{c.state}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        c.status === 'Open'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : c.status === 'Blocked'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {c.status === 'Open' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 max-w-xs truncate">{c.reason}</td>
                  <td className="p-4 font-mono text-slate-400 whitespace-nowrap">{c.clearanceEta}</td>
                  <td className="p-4 font-medium text-cyan-400 whitespace-nowrap">{c.bypass}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => handleUpdateStatus(c.id, 'Open')}
                        className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-colors"
                      >
                        Set Open
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(c.id, 'Blocked')}
                        className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold transition-colors"
                      >
                        Set Blocked
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRoadsPage;

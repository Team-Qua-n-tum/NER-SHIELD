import React from 'react';
import { Eye, Shield, Globe, Activity, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';

export const ViewerOverviewPage = () => {
  const { alerts } = useApp();
  const publicAlerts = alerts.slice(0, 6);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full min-w-0">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
            PUBLIC STATUS DESK
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
          NER-SHIELD Public Highway & Logistics Overview
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Read-only approved status board across all 8 Northeastern States.
        </p>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <Eye className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          You are viewing authorized public summaries. Exact real-time military and freight vehicle GPS positions,
          operational incident submission controls, and corridor recalculation engines are restricted to accredited personnel.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-red-400">
            {publicAlerts.filter((a) => a.severity === 'Critical' || a.severity === 'High').length}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Active Advisories</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-cyan-400">8 States</div>
          <div className="text-xs text-slate-400 mt-0.5">Regional Coverage</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-emerald-400">24/7</div>
          <div className="text-xs text-slate-400 mt-0.5">Network Uptime</div>
        </div>
      </div>

      {/* Recent Alerts List */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Cleared Public Advisories</span>
          </h2>
          <Link to="/app/viewer/alerts" className="text-xs text-cyan-400 hover:underline">
            View All Advisories →
          </Link>
        </div>

        <div className="space-y-3">
          {publicAlerts.map((a) => (
            <div key={a.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{a.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {a.severity}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{a.location} · {a.time}</p>
              <p className="text-xs text-slate-300 pt-1">{a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewerOverviewPage;

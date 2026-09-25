import React from 'react';
import { Eye, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ViewerAlertsPage = () => {
  const { alerts } = useApp();
  const publicAlerts = alerts.slice(0, 8);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <span>Public Safety & Travel Advisories</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Official regional traffic warnings, weather alerts, and highway corridor restrictions cleared for public release.
        </p>
      </div>

      <div className="space-y-4">
        {publicAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-5 rounded-3xl border ${
              alert.severity === 'Critical'
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{alert.title}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      alert.severity === 'Critical'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{alert.location} · {alert.time}</p>
                <p className="text-xs text-slate-300 mt-2">{alert.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewerAlertsPage;

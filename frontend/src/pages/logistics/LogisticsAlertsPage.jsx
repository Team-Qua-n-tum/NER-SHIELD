import React from 'react';
import { AlertTriangle, Zap, MapPin, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LogisticsAlertsPage = () => {
  const { alerts } = useApp();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-400" />
          <span>Freight Corridor Hazard Advisories</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Active landslides, high rainfall warnings, and road clearances directly impacting scheduled freight deliveries.
        </p>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-5 rounded-3xl border transition-all ${
              alert.severity === 'Critical'
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
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
                {alert.recommendedAction && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-cyan-300 font-mono">
                    Convoy Reroute Advisory: {alert.recommendedAction}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogisticsAlertsPage;

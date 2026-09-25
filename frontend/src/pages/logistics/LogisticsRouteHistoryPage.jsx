import React from 'react';
import { Clock, Route, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const ROUTE_HISTORY = [
  { id: 'RT-2026-904', corridor: 'Guwahati → Silchar (via NH-27 Bypass)', cargo: 'MEDICINE', distance: '385 km', eta: '6h 15m', risk: 'Low', time: 'Today, 10:30 AM', status: 'Dispatched' },
  { id: 'RT-2026-903', corridor: 'Shillong → Silchar (via NH-6 Direct)', cargo: 'FOOD', distance: '240 km', eta: 'Blocked', risk: 'Critical', time: 'Today, 08:15 AM', status: 'Rerouted' },
  { id: 'RT-2026-902', corridor: 'Guwahati → Imphal (via Lumding)', cargo: 'FUEL', distance: '490 km', eta: '11h 20m', risk: 'Medium', time: 'Yesterday, 18:40 PM', status: 'Delivered' },
  { id: 'RT-2026-901', corridor: 'Agartala → Silchar (via NH-8)', cargo: 'GENERAL_FREIGHT', distance: '280 km', eta: '5h 50m', risk: 'Low', time: 'Yesterday, 14:10 PM', status: 'Delivered' },
];

export const LogisticsRouteHistoryPage = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-cyan-400" />
          <span>Route Optimization History & Logs</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Historical record of calculated corridor recommendations, emergency bypass activations, and convoy delivery ETAs.
        </p>
      </div>

      <div className="space-y-4">
        {ROUTE_HISTORY.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400 font-bold text-xs">{item.id}</span>
                <span className="text-xs font-bold text-white">{item.corridor}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full self-start sm:self-center ${
                  item.status === 'Dispatched'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : item.status === 'Rerouted'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {item.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-t border-slate-800/80 pt-3">
              <div>
                <span className="text-slate-500 text-[10px] block">Cargo Type</span>
                <strong className="text-slate-300">{item.cargo}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Distance / ETA</span>
                <span className="font-mono text-slate-300">{item.distance} · {item.eta}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Risk Rating</span>
                <span className={item.risk === 'Low' ? 'text-emerald-400 font-bold' : item.risk === 'Medium' ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>
                  {item.risk}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Calculated At</span>
                <span className="text-slate-400 text-[11px]">{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogisticsRouteHistoryPage;

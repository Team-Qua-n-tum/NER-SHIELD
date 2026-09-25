import React from 'react';

/**
 * RouteSourceCard
 *
 * Displays transparent provenance and routing authority for route recommendations.
 * Ensures demo fallback routes are never labeled with live engines (e.g. OSRM / FastAPI).
 */
export function RouteSourceCard({ routeResult, routeError, dataMode }) {
  if (routeError) {
    return (
      <div
        className="p-3 rounded-xl bg-slate-900/90 border border-red-500/30 text-xs space-y-1"
        data-testid="route-source-card-degraded"
      >
        <div className="flex items-center justify-between text-[11px] font-bold text-red-400">
          <span>Source: Unavailable</span>
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
            Data mode: Degraded
          </span>
        </div>
        <p className="text-slate-400 text-[11px]">Route result: Not available</p>
      </div>
    );
  }

  if (!routeResult) return null;

  const isDemo =
    routeResult.isDemoSession ||
    routeResult.data_mode === 'demo' ||
    routeResult.data_mode === 'Demo — synthetic' ||
    dataMode === 'DEMO';

  const source = isDemo ? 'Local demo fallback' : (routeResult.source || 'NER-SHIELD backend');
  const mode = isDemo ? 'Demo — synthetic' : (routeResult.data_mode || 'Live');
  const authority = isDemo ? 'Demo scenario' : (routeResult.route_authority || 'NER Command Logistics Authority');
  const freshness = isDemo ? 'Not applicable' : (routeResult.freshness || 'Fresh (< 30s)');
  const routingEngine = isDemo
    ? 'Deterministic demo route'
    : (routeResult.routing_engine || 'Advanced GIS/AI-aware graph engine');

  return (
    <div
      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5"
      data-testid="route-source-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Route Authority & Provenance
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
            isDemo
              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          }`}
        >
          Data mode: {mode}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <div>
          <span className="text-slate-500">Source: </span>
          <span className="text-slate-200 font-medium">{source}</span>
        </div>
        <div>
          <span className="text-slate-500">Routing engine: </span>
          <span className="text-slate-200 font-medium">{routingEngine}</span>
        </div>
        <div>
          <span className="text-slate-500">Route authority: </span>
          <span className="text-slate-200 font-medium">{authority}</span>
        </div>
        <div>
          <span className="text-slate-500">Freshness: </span>
          <span className="text-slate-200 font-medium">{freshness}</span>
        </div>
      </div>
    </div>
  );
}

export default RouteSourceCard;

import React, { useState } from 'react';
import { Route, Navigation, AlertTriangle, RefreshCw, CheckCircle2, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { routesApi } from '../../lib/api/routesApi';
import { useApp } from '../../context/AppContext';

const DISTRICT_OPTIONS = [
  { id: 'dist-guwahati', name: 'Guwahati Hub (Assam)' },
  { id: 'dist-silchar', name: 'Silchar Depot (Assam)' },
  { id: 'dist-imphal', name: 'Imphal Valley (Manipur)' },
  { id: 'dist-agartala', name: 'Agartala Central (Tripura)' },
  { id: 'dist-shillong', name: 'Shillong Command (Meghalaya)' },
  { id: 'dist-aizawl', name: 'Aizawl Station (Mizoram)' },
  { id: 'dist-kohima', name: 'Kohima Terminal (Nagaland)' },
];

const COMMODITIES = ['MEDICINE', 'FOOD', 'FUEL', 'GENERAL_FREIGHT'];

export const LogisticsRouteNewPage = () => {
  const { showToast } = useApp();
  const [source, setSource] = useState('dist-guwahati');
  const [destination, setDestination] = useState('dist-silchar');
  const [commodity, setCommodity] = useState('MEDICINE');
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [routeError, setRouteError] = useState(null);

  const handleCalculateRoute = async () => {
    setLoading(true);
    setRouteError(null);
    try {
      const res = await routesApi.recommendRoute({
        source,
        destination,
        commodity,
      });
      setRouteResult(res);
      if (res?.status === 'no_route') {
        showToast('All primary and secondary corridors currently blocked.', 'warning', 'No Route Found');
      } else {
        showToast('Optimal high-resilience corridor calculated.', 'success');
      }
    } catch (err) {
      setRouteError('Route calculation failed. Check network or backend connectivity.');
      showToast('Route calculation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRouteResult(null);
    await handleCalculateRoute();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Route className="w-6 h-6 text-cyan-400" />
          <span>AI Logistics Route Planner & Optimization</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Compute resilient multi-state freight corridors avoiding active landslides, flash floods, and closed passes.
        </p>
      </div>

      {/* Form Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Origin Depot</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {DISTRICT_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Destination Terminal</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {DISTRICT_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Cargo Priority</label>
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {COMMODITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleCalculateRoute}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20"
          >
            <Navigation className="w-4 h-4" />
            <span>{loading ? 'Evaluating Risk Graph...' : 'Calculate Safe Corridor'}</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {routeError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center justify-between">
          <span>{routeError}</span>
          <button onClick={handleRecalculate} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* Results */}
      {routeResult && (
        <div className="space-y-4">
          {routeResult.status === 'no_route' ? (
            <div className="p-6 rounded-3xl bg-red-950/30 border border-red-500/30 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Safe Corridor Available</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  All direct and alternate mountain corridors are blocked due to severe weather and landslide activity.
                  Straight-line traversal is prohibited for safety.
                </p>
              </div>
              <button
                onClick={handleRecalculate}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Recalculate Corridor
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Recommended Alternate Corridor: NH-27 Nagaon Bypass</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Avoids blocked Dima Hasao section (NH-6). Low flood probability.
                  </p>
                </div>
                <button
                  onClick={handleRecalculate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recalculate</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Distance</div>
                  <div className="text-sm font-black text-white font-mono mt-0.5">385 km</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Est. Transit Time</div>
                  <div className="text-sm font-black text-white font-mono mt-0.5">6h 15m</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Risk Index</div>
                  <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">0.18 (LOW)</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Routing Engine</div>
                  <div className="text-sm font-black text-cyan-400 font-mono mt-0.5">FastAPI / OSRM</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LogisticsRouteNewPage;

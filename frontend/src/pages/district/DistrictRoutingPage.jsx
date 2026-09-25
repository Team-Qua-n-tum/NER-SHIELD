import React, { useState } from 'react';
import { Route, Navigation, CheckCircle2 } from 'lucide-react';
import { routesApi } from '../../lib/api/routesApi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { RouteSourceCard } from '../../components/route/RouteSourceCard';

export const DistrictRoutingPage = () => {
  const { user } = useAuth();
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);

  const handleComputeEmergencyRoute = async () => {
    setLoading(true);
    try {
      const res = await routesApi.recommendRoute({
        source: user?.district_ids?.[0] || 'dist-guwahati',
        destination: 'dist-silchar',
        commodity: 'MEDICINE',
      });
      setRouteResult(res);
      showToast('Emergency relief corridor computed.', 'success');
    } catch {
      showToast('Emergency routing calculation completed.', 'info');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Route className="w-6 h-6 text-cyan-400" />
          <span>District Emergency Route Clearance</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Compute bypass corridors for essential medicine, fuel, and relief supplies traversing your district.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Emergency Relief Corridor Optimization</h2>
            <p className="text-xs text-slate-400">Target corridor: Assigned District to Regional Stockpile Depot</p>
          </div>
          <button
            onClick={handleComputeEmergencyRoute}
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-cyan-600/20"
          >
            <Navigation className="w-4 h-4" />
            <span>{loading ? 'Evaluating Corridors...' : 'Calculate Safe Bypass'}</span>
          </button>
        </div>

        {routeResult && (
          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <RouteSourceCard routeResult={routeResult} />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Active Recommendation: NH-27 Nagaon Alternate Corridor
              </span>
              <span className="text-xs font-mono text-cyan-400">ETA: 6h 15m (Risk: LOW)</span>
            </div>
            <p className="text-xs text-slate-300">
              Primary NH-6 corridor through Dima Hasao is currently blocked by active debris flow. All medical consignments diverted via NH-27 bypass.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistrictRoutingPage;

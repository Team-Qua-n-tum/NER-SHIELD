/**
 * LogisticsOperatorDashboard
 *
 * Dashboard for logistics_operator role.
 * Shows:
 *   - Assigned fleet/vehicle list (scoped to user.vehicle_ids)
 *   - Route planner (POST /api/v1/routes/recommend)
 *   - Selected route and alternatives on map
 *   - ETA, base ETA, delay breakdown, risk score, routing engine info
 *   - Route-impact alerts
 *   - Recalculate route button
 *   - No-route state (never draws route when status=no_route)
 *
 * NOT shown: user management, district incident reports, admin controls.
 *
 * ⚠️  SECURITY: Vehicle list filtered client-side by user.vehicle_ids.
 *     Backend must enforce record-level access control independently.
 */
import React, { useState, useCallback } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { RoleRoute } from '../components/auth/RoleRoute';
import { DataModeBadge } from '../components/auth/DataModeBadge';
import { RouteSourceCard } from '../components/route/RouteSourceCard';
import { routesApi } from '../lib/api/routesApi';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Truck, Route, AlertTriangle, RefreshCw,
  Clock, Zap, AlertCircle, Navigation,
  CheckCircle2, Loader2
} from 'lucide-react';

const RISK_CONFIG = {
  LOW: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Low Risk' },
  MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Medium Risk' },
  HIGH: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'High Risk' },
  CRITICAL: { color: 'text-red-500', bg: 'bg-red-600/15 border-red-600/30', label: 'Critical Risk' },
};

const COMMODITIES = ['MEDICINE', 'FOOD', 'FUEL', 'PERISHABLE_AGRI', 'GENERAL_FREIGHT'];

function VehicleCard({ vehicle, isAssigned }) {
  const statusColors = {
    'In Transit': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Available': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Delayed': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Maintenance': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return (
    <div className={`p-3 rounded-xl border ${isAssigned ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">{vehicle.vehicleNumber || vehicle.id}</p>
            <p className="text-[10px] text-slate-500">{vehicle.type || 'Truck'} · {vehicle.cargo || 'General'}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${statusColors[vehicle.status] || statusColors.Available}`}>
          {vehicle.status}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-500">
        <span>⛽ {vehicle.fuelPercent || 80}%</span>
        <span>🚀 {vehicle.speedKmH || 0} km/h</span>
        <span>📍 {vehicle.driverName || 'Unassigned'}</span>
      </div>
    </div>
  );
}

function NoRouteState({ onRecalculate }) {
  return (
    <div
      data-testid="no-route-state"
      className="flex flex-col items-center gap-4 py-10 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white mb-1">No Safe Route Found</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          All known routes between the selected origin and destination are currently blocked or high-risk.
          No route geometry will be displayed.
        </p>
      </div>
      <button
        onClick={onRecalculate}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white font-medium transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Recalculate Route
      </button>
    </div>
  );
}

function RouteCard({ route, isSelected, onSelect }) {
  const risk = RISK_CONFIG[route.risk_level] || RISK_CONFIG.MEDIUM;
  return (
    <button
      onClick={() => onSelect(route)}
      className={`w-full text-left p-4 rounded-2xl border transition-all ${
        isSelected
          ? 'bg-blue-600/15 border-blue-500/30'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">
            {route.route_name || `Route ${route.id}`}
          </p>
          {route.reasoning && (
            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{route.reasoning}</p>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${risk.bg} ${risk.color}`}>
          {risk.label}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        <div className="text-slate-400">
          <span className="text-slate-600 block">ETA</span>
          <span className="font-semibold text-white">{route.eta || '—'}</span>
        </div>
        <div className="text-slate-400">
          <span className="text-slate-600 block">Delay</span>
          <span className={`font-semibold ${route.delay_hours > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {route.delay_hours > 0 ? `+${route.delay_hours}h` : 'On time'}
          </span>
        </div>
        <div className="text-slate-400">
          <span className="text-slate-600 block">Risk Score</span>
          <span className={`font-semibold ${risk.color}`}>{route.risk_score || '—'}</span>
        </div>
      </div>
    </button>
  );
}

function LogisticsDashboardContent() {
  const { user, dataMode } = useAuth();
  const { vehicles, alerts } = useApp();

  const [activeTab, setActiveTab] = useState('fleet');
  const [routeResult, setRouteResult] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [source, setSource] = useState('dist-guwahati');
  const [destination, setDestination] = useState('dist-imphal');
  const [commodity, setCommodity] = useState('MEDICINE');

  // Filter vehicles to assigned ids (UI-layer — backend enforces independently)
  const myVehicleIds = user?.vehicle_ids || [];
  const myVehicles = myVehicleIds.includes('*')
    ? vehicles
    : vehicles.filter(v => myVehicleIds.includes(v.id));

  // Route-impact alerts (all alerts affecting routes)
  const routeAlerts = alerts.filter(a =>
    ['BLOCKED_ROAD', 'FLOOD', 'LANDSLIDE'].includes(a.category)
  );

  const handlePlanRoute = useCallback(async () => {
    setIsRouting(true);
    setRouteError(null);
    setRouteResult(null);
    setSelectedRoute(null);
    try {
      const result = await routesApi.recommendRoute({ source, destination, commodity });
      setRouteResult(result);
      // Auto-select primary route if available and status is not no_route
      if (result.status !== 'no_route' && result.routes?.length > 0) {
        setSelectedRoute(result.routes[0]);
      }
    } catch {
      setRouteError('Failed to retrieve route recommendations. Try again.');
    } finally {
      setIsRouting(false);
    }
  }, [source, destination, commodity]);

  const handleRecalculate = useCallback(() => {
    setRouteResult(null);
    setSelectedRoute(null);
    handlePlanRoute();
  }, [handlePlanRoute]);

  const tabs = [
    { id: 'fleet', label: 'My Fleet', icon: Truck },
    { id: 'routes', label: 'Route Planner', icon: Route },
    { id: 'alerts', label: 'Route Alerts', icon: Zap },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-black text-white">Logistics Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {myVehicles.length} assigned vehicle{myVehicles.length !== 1 ? 's' : ''} · {user?.department}
          </p>
        </div>
        <DataModeBadge mode={dataMode} />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'In Transit', value: myVehicles.filter(v => v.status === 'In Transit').length, icon: Navigation, color: 'text-blue-400' },
          { label: 'Delayed', value: myVehicles.filter(v => v.status === 'Delayed').length, icon: Clock, color: 'text-red-400' },
          { label: 'Available', value: myVehicles.filter(v => v.status === 'Available').length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Route Alerts', value: routeAlerts.length, icon: AlertTriangle, color: 'text-amber-400' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
              <Icon className={`w-4 h-4 ${kpi.color} mx-auto mb-1`} />
              <div className="text-xl font-black text-white">{kpi.value}</div>
              <div className="text-[10px] text-slate-500">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Fleet tab */}
      {activeTab === 'fleet' && (
        <div className="space-y-3">
          {myVehicles.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No vehicles assigned to your account. Contact admin.
            </div>
          ) : (
            myVehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} isAssigned={true} />
            ))
          )}
        </div>
      )}

      {/* Route Planner tab */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          {/* Planner Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300">Plan Route</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Origin District</label>
                <input
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. dist-guwahati"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Destination District</label>
                <input
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. dist-imphal"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Commodity</label>
                <select
                  value={commodity}
                  onChange={e => setCommodity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {COMMODITIES.map(c => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handlePlanRoute}
              disabled={isRouting}
              data-testid="plan-route-btn"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white text-xs font-bold transition-all disabled:opacity-60"
            >
              {isRouting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Route className="w-3.5 h-3.5" />}
              {isRouting ? 'Calculating…' : 'Get Route Recommendations'}
            </button>
          </div>

          {/* Error */}
          {routeError && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {routeError}
              </div>
              <RouteSourceCard routeError={routeError} dataMode={dataMode} />
            </div>
          )}

          {/* Results */}
          {routeResult && (
            <div className="space-y-3">
              <RouteSourceCard routeResult={routeResult} dataMode={dataMode} />

              {/* Data source badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300">Route Recommendations</h3>
                <div className="flex items-center gap-2">
                  {routeResult.routing_engine && (
                    <span className="text-[10px] text-slate-500 font-mono">{routeResult.routing_engine}</span>
                  )}
                  <DataModeBadge mode={routeResult.isDemoSession ? 'DEMO' : dataMode} />
                </div>
              </div>

              {/* No-route state */}
              {routeResult.status === 'no_route' ? (
                <NoRouteState onRecalculate={handleRecalculate} />
              ) : (
                <>
                  {/* Route alternatives */}
                  <div className="space-y-2" data-testid="route-alternatives">
                    {(routeResult.routes || [routeResult]).map((route, idx) => (
                      <RouteCard
                        key={route.id || idx}
                        route={route}
                        isSelected={selectedRoute?.id === route.id}
                        onSelect={setSelectedRoute}
                      />
                    ))}
                  </div>

                  {/* Selected route detail */}
                  {selectedRoute && (
                    <div className="bg-slate-900 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">Selected Route Detail</h4>
                        <button
                          onClick={handleRecalculate}
                          data-testid="recalculate-btn"
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 font-medium transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Recalculate
                        </button>
                      </div>

                      {/* Delay breakdown */}
                      {selectedRoute.delay_breakdown && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Delay Breakdown</p>
                          {Object.entries(selectedRoute.delay_breakdown).map(([factor, val]) => (
                            <div key={factor} className="flex justify-between text-xs">
                              <span className="text-slate-400">{factor.replace(/_/g, ' ')}</span>
                              <span className={`font-semibold ${parseFloat(val) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>{val}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Active alerts on route */}
                      {selectedRoute.active_alerts?.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Alerts on Route</p>
                          {selectedRoute.active_alerts.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-amber-400">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              {a}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Alerts tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300">Route-Impact Alerts</h3>
          {routeAlerts.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-8">No active route alerts.</p>
          ) : (
            routeAlerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-xl border ${
                alert.severity === 'Critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${alert.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'}`} />
                  <div>
                    <p className="text-xs font-semibold text-white">{alert.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{alert.location} · {alert.time}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{alert.recommendedAction}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export const LogisticsOperatorDashboard = () => (
  <RoleRoute allowedRoles={['logistics_operator', 'admin']}>
    <AppShell>
      <LogisticsDashboardContent />
    </AppShell>
  </RoleRoute>
);

export default LogisticsOperatorDashboard;

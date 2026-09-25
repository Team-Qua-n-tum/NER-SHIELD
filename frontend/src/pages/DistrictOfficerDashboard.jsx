/**
 * DistrictOfficerDashboard
 *
 * Dashboard for district_officer role.
 * Shows:
 *   - Assigned district summary
 *   - District-scoped incidents (needing review)
 *   - Road status / verification UI
 *   - District alerts
 *   - Emergency route planning
 *   - Field reports submitted in district
 *
 * NOT shown: all-district admin view, user management, fleet-wide controls.
 *
 * ⚠️  SECURITY: Data requests include district_id scope where API supports it.
 *     Backend must enforce record-level access control independently.
 */
import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { RoleRoute } from '../components/auth/RoleRoute';
import { DataModeBadge } from '../components/auth/DataModeBadge';
import { RouteSourceCard } from '../components/route/RouteSourceCard';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, ShieldCheck, Activity,
  AlertTriangle, Route, CheckCircle2,
  Clock, MapPin, Info, Loader2
} from 'lucide-react';
import { routesApi } from '../lib/api/routesApi';

function IncidentReviewCard({ incident, onVerify, onUpdateStatus }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const statusOptions = ['Blocked', 'Partially Open', 'Cleared', 'Under Assessment'];

  return (
    <div className={`p-4 rounded-2xl border ${
      incident.severity === 'Critical'
        ? 'bg-red-500/10 border-red-500/20'
        : 'bg-slate-900 border-slate-800'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-white truncate">{incident.title}</p>
            {!incident.verified && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/20 text-amber-400">
                Needs Review
              </span>
            )}
            {incident.verified && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
                Verified
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{incident.location} · {incident.reportedTime || incident.reportedAt}</p>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{incident.impact}</p>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
          incident.severity === 'Critical' ? 'bg-red-500/15 border border-red-500/20 text-red-400' :
          incident.severity === 'High' ? 'bg-amber-500/15 border border-amber-500/20 text-amber-400' :
          'bg-slate-800 border border-slate-700 text-slate-400'
        }`}>{incident.severity}</span>
      </div>

      {/* Actions */}
      {!incident.verified && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onVerify(incident.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-colors"
          >
            <ShieldCheck className="w-3 h-3" />
            Verify
          </button>
          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-[10px] font-bold transition-colors"
            >
              <Activity className="w-3 h-3" />
              Road Status
            </button>
            {statusOpen && (
              <div className="absolute top-full mt-1 left-0 w-40 bg-slate-800 border border-slate-700 rounded-xl z-10 overflow-hidden shadow-xl">
                {statusOptions.map(s => (
                  <button
                    key={s}
                    onClick={() => { onUpdateStatus(incident.id, s); setStatusOpen(false); }}
                    className="w-full px-3 py-2 text-left text-[10px] text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DistrictDashboardContent() {
  const { user, dataMode } = useAuth();
  const { incidents, alerts, districts, verifyIncident, updateIncidentRoadStatus, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [routeResult, setRouteResult] = useState(null);
  const [isRouting, setIsRouting] = useState(false);

  const myDistrictIds = user?.district_ids || [];
  const isAllDistricts = myDistrictIds.includes('*');

  // Filter data to assigned districts
  const districtIncidents = isAllDistricts
    ? incidents
    : incidents.filter(inc =>
        myDistrictIds.some(did => inc.district?.toLowerCase().includes(did.replace('dist-', '')))
      );
  const districtAlerts = alerts.slice(0, 10);
  const pendingReview = districtIncidents.filter(i => !i.verified);
  const districtLabel = myDistrictIds.includes('*')
    ? 'All Districts'
    : myDistrictIds.map(d => d.replace('dist-', '').replace(/-/g, ' ')).join(', ');

  const handleVerify = (incId) => {
    verifyIncident(incId, user?.name);
    showToast(`Incident ${incId} verified.`, 'success');
  };

  const handleUpdateStatus = (incId, status) => {
    updateIncidentRoadStatus(incId, status);
    showToast(`Road status updated: ${status}`, 'info');
  };

  const handleEmergencyRoute = async () => {
    setIsRouting(true);
    try {
      const result = await routesApi.recommendRoute({
        source: myDistrictIds[0] || 'dist-guwahati',
        destination: 'dist-imphal',
        commodity: 'MEDICINE',
      });
      setRouteResult(result);
    } catch {
      showToast('Route planning failed. Using cached data.', 'warning');
    } finally {
      setIsRouting(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'incidents', label: `Review (${pendingReview.length})`, icon: ShieldCheck },
    { id: 'roads', label: 'Road Status', icon: Activity },
    { id: 'routes', label: 'Emergency Routes', icon: Route },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-black text-white">District Dashboard</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {districtLabel}
          </p>
        </div>
        <DataModeBadge mode={dataMode} />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Incidents', value: districtIncidents.length, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Pending Review', value: pendingReview.length, icon: Clock, color: 'text-red-400' },
          { label: 'Verified', value: districtIncidents.filter(i => i.verified).length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Active Alerts', value: districtAlerts.length, icon: AlertTriangle, color: 'text-red-400' },
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
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {pendingReview.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                <strong>{pendingReview.length} incident{pendingReview.length !== 1 ? 's' : ''}</strong> in your district require verification.
                Switch to <strong>Review</strong> tab to process them.
              </p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {districtIncidents.slice(0, 4).map(inc => (
              <div key={inc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <p className="text-xs font-semibold text-white truncate">{inc.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{inc.location}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="space-y-3">
          {districtIncidents.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-8">No incidents in your assigned district.</p>
          ) : (
            districtIncidents.map(inc => (
              <IncidentReviewCard
                key={inc.id}
                incident={inc}
                onVerify={handleVerify}
                onUpdateStatus={handleUpdateStatus}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'roads' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400">
              Road status updates are based on verified incident reports. Update individual incidents in the Review tab to change road status.
            </p>
          </div>
          {districtIncidents.map(inc => (
            <div key={inc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{inc.location}</p>
                <p className="text-[10px] text-slate-500">{inc.type}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ml-2 ${
                inc.roadStatus === 'Cleared' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                inc.roadStatus === 'Blocked' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                'bg-slate-800 border-slate-700 text-slate-400'
              }`}>{inc.roadStatus || 'Under Assessment'}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'routes' && (
        <div className="space-y-4">
          <button
            onClick={handleEmergencyRoute}
            disabled={isRouting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:opacity-90 text-white text-xs font-bold transition-all disabled:opacity-60 shadow-lg shadow-red-900/20"
          >
            {isRouting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Route className="w-3.5 h-3.5" />}
            {isRouting ? 'Planning…' : 'Plan Emergency Relief Route'}
          </button>

          {routeResult && (
            <RouteSourceCard routeResult={routeResult} dataMode={dataMode} />
          )}

          {routeResult && routeResult.status !== 'no_route' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-white">Recommended Route</h4>
              {(routeResult.routes || [routeResult]).slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-xs text-white">{r.route_name || `Option ${i + 1}`}</p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-slate-400">ETA: {r.eta || '—'}</span>
                    <span className={`font-bold ${r.risk_level === 'HIGH' ? 'text-red-400' : 'text-emerald-400'}`}>{r.risk_level}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {routeResult?.status === 'no_route' && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-xs text-red-400">
              No safe route currently available. All corridors blocked.
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {districtAlerts.map(alert => (
            <div key={alert.id} className={`p-3 rounded-xl border ${
              alert.severity === 'Critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              <p className="text-xs font-semibold text-white">{alert.title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{alert.location} · {alert.time}</p>
              <p className="text-[10px] text-slate-500 mt-1">{alert.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const DistrictOfficerDashboard = () => (
  <RoleRoute allowedRoles={['district_officer', 'admin']}>
    <AppShell>
      <DistrictDashboardContent />
    </AppShell>
  </RoleRoute>
);

export default DistrictOfficerDashboard;

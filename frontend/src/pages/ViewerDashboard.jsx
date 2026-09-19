/**
 * ViewerDashboard
 *
 * Read-only public alert/status page for viewer role.
 * Shows:
 *   - Approved public alerts
 *   - Aggregate status summary (anonymized)
 *
 * NOT shown:
 *   - Detailed vehicle map or positions
 *   - Route operations or planning
 *   - Incident submission or verification
 *   - User management
 *   - Any write actions
 */
import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { RoleRoute } from '../components/auth/RoleRoute';
import { DataModeBadge } from '../components/auth/DataModeBadge';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Activity, Globe, Eye, Info, Shield } from 'lucide-react';

function ViewerContent() {
  const { dataMode } = useAuth();
  const { alerts } = useApp();

  // Only show public-appropriate alerts (non-operational details)
  const publicAlerts = alerts.slice(0, 8);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-black text-white">NER-SHIELD Public Status</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only approved status board
          </p>
        </div>
        <DataModeBadge mode={dataMode} />
      </div>

      {/* Viewer restriction notice */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
        <Eye className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          You have read-only viewer access. Detailed operational data, vehicle positions, route planning,
          and incident submission are not available at this access level.
        </p>
      </div>

      {/* Summary stats (anonymized) */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Alerts', value: publicAlerts.filter(a => a.severity === 'Critical' || a.severity === 'High').length, color: 'text-red-400' },
          { label: 'States Monitored', value: 8, color: 'text-blue-400' },
          { label: 'Operational', value: '24/7', color: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Public Alerts */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300">Current Alerts</h2>
        {publicAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl border ${
              alert.severity === 'Critical'
                ? 'bg-red-500/10 border-red-500/20'
                : alert.severity === 'High'
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                alert.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-white">{alert.title}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                    alert.severity === 'Critical'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>{alert.severity}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{alert.location} · {alert.state}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{alert.description}</p>
                <p className="text-[10px] text-slate-600 mt-1">{alert.time}</p>
              </div>
            </div>
          </div>
        ))}
        {publicAlerts.length === 0 && (
          <div className="text-center py-10 text-slate-600 text-xs">
            No active alerts at this time.
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
        <Info className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-600">
          This is a public-approved status view. Operational details, route data, and live vehicle
          positions are accessible only to authorized government personnel.
        </p>
      </div>
    </div>
  );
}

export const ViewerDashboard = () => (
  <RoleRoute allowedRoles={['viewer', 'admin']}>
    <AppShell>
      <ViewerContent />
    </AppShell>
  </RoleRoute>
);

export default ViewerDashboard;

/**
 * FieldOfficerDashboard
 *
 * Mobile-first dashboard for field_officer role.
 * Shows:
 *   - Quick report incident button
 *   - My reports (scoped to current user)
 *   - Assigned-area map
 *   - Emergency alerts
 *   - Notification settings
 *
 * NOT shown: fleet management, all-district view, user management, route planner.
 *
 * ⚠️  SECURITY: Data is scoped to user.district_ids on API calls that support it.
 *     Backend must enforce record-level access control independently.
 */
import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { RoleRoute } from '../components/auth/RoleRoute';
import { FieldReportForm } from '../components/report/FieldReportForm';
import { FieldReportList } from '../components/report/FieldReportList';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  FilePlus, FileText, Map, Bell, Settings,
  AlertTriangle, CheckCircle2, Clock, Radio,
  MapPin, Zap, ChevronRight, Info
} from 'lucide-react';

const STATUS_CONFIG = {
  reported: { label: 'Reported', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  under_review: { label: 'Under Review', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  verified: { label: 'Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  resolved: { label: 'Resolved', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
};

function StatusTimeline({ status }) {
  const steps = ['reported', 'under_review', 'verified', 'resolved'];
  const currentIdx = steps.indexOf(status) !== -1 ? steps.indexOf(status) : 0;

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => (
        <React.Fragment key={step}>
          <div className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
            idx <= currentIdx
              ? STATUS_CONFIG[step]?.bg + ' ' + STATUS_CONFIG[step]?.color
              : 'bg-slate-800 border-slate-700 text-slate-600'
          }`}>
            {STATUS_CONFIG[step]?.label}
          </div>
          {idx < steps.length - 1 && (
            <ChevronRight className="w-2.5 h-2.5 text-slate-700 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function FieldDashboardContent() {
  const { user } = useAuth();
  const { incidents, alerts, showToast, addIncident } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReportForm, setShowReportForm] = useState(false);

  // Only show incidents reported by this user (my reports)
  const myReports = incidents.filter(
    (inc) => inc.verifiedBy?.includes(user?.name) || inc.reportedBy === user?.id
  );

  const myArea = user?.district_ids?.map(d => d.replace('dist-', '').replace(/-/g, ' ')).join(', ') || 'Assigned Area';

  const handleReportSuccess = (newIncident) => {
    addIncident(newIncident);
    setShowReportForm(false);
    showToast('Incident report submitted successfully.', 'success', 'Report Filed');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Radio },
    { id: 'report', label: 'Report', icon: FilePlus },
    { id: 'my-reports', label: 'My Reports', icon: FileText },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-black text-white">Field Dashboard</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {myArea}
          </p>
        </div>
        <button
          onClick={() => { setActiveTab('report'); setShowReportForm(true); }}
          data-testid="quick-report-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/30"
        >
          <FilePlus className="w-4 h-4" />
          Report Incident
        </button>
      </div>

      {/* Tab nav */}
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
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'My Reports', value: myReports.length, icon: FileText, color: 'text-blue-400' },
              { label: 'Under Review', value: myReports.filter(r => r.status === 'PENDING_VERIFICATION').length, icon: Clock, color: 'text-amber-400' },
              { label: 'Verified', value: myReports.filter(r => r.verified).length, icon: CheckCircle2, color: 'text-emerald-400' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
                  <Icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                  <div className="text-xl font-black text-white">{stat.value}</div>
                  <div className="text-[10px] text-slate-500">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Recent my-reports preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300">Recent Reports</h3>
            {myReports.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">No reports submitted yet.</p>
            ) : (
              myReports.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{r.title || r.type}</p>
                    <p className="text-[10px] text-slate-500 truncate">{r.location}</p>
                    <div className="mt-1">
                      <StatusTimeline status={r.status?.toLowerCase() === 'pending_verification' ? 'under_review' : (r.verified ? 'verified' : 'reported')} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Assigned area alert */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              You have access to data for your assigned area only: <strong className="text-white">{myArea}</strong>.
              Contact your district officer for broader access.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div>
          <FieldReportForm
            onSubmitSuccess={handleReportSuccess}
            onCancel={() => setActiveTab('dashboard')}
            defaultDistrict={user?.district_ids?.[0]}
          />
        </div>
      )}

      {activeTab === 'my-reports' && (
        <div>
          <FieldReportList incidents={myReports} />
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300">Active Alerts</h3>
          {alerts.slice(0, 8).map((alert) => (
            <div key={alert.id} className={`p-3 rounded-xl border ${
              alert.severity === 'Critical' ? 'bg-red-500/10 border-red-500/20' :
              alert.severity === 'High' ? 'bg-amber-500/10 border-amber-500/20' :
              'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${alert.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'}`} />
                <div>
                  <p className="text-xs font-semibold text-white">{alert.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{alert.location}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{alert.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const FieldOfficerDashboard = () => (
  <RoleRoute allowedRoles={['field_officer', 'admin']}>
    <AppShell>
      <FieldDashboardContent />
    </AppShell>
  </RoleRoute>
);

export default FieldOfficerDashboard;

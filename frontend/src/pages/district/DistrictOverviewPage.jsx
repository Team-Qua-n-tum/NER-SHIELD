import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, MapPin, AlertTriangle, Clock, CheckCircle2, Activity, Route, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DistrictOverviewPage = () => {
  const { user } = useAuth();
  const { incidents, alerts } = useApp();

  const myDistrictIds = user?.district_ids || [];
  const isAllDistricts = myDistrictIds.includes('*');

  const districtIncidents = isAllDistricts
    ? incidents
    : incidents.filter((inc) =>
        myDistrictIds.some((did) => inc.district?.toLowerCase().includes(did.replace('dist-', '')))
      );
  const pendingReview = districtIncidents.filter((i) => !i.verified);
  const districtAlerts = alerts.slice(0, 6);
  const districtLabel = isAllDistricts
    ? 'All Districts'
    : myDistrictIds.map((d) => d.replace('dist-', '').replace(/-/g, ' ')).join(', ');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              DISTRICT INCIDENT COMMAND
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            District Operational Dashboard
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Jurisdiction: <strong className="text-slate-200 capitalize">{districtLabel}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/app/district/reports"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Clock className="w-4 h-4" />
            <span>Review Inbox ({pendingReview.length})</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-white">{districtIncidents.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">District Incidents</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <Clock className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-white">{pendingReview.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Pending Review</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-white">
            {districtIncidents.filter((i) => i.verified).length}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Verified Incidents</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <Activity className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-white">{districtAlerts.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Active Advisories</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/app/district/map"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
        >
          <div className="font-bold text-white text-xs">District Map</div>
          <p className="text-[10px] text-slate-400 mt-1">Local GIS hotspot view →</p>
        </Link>
        <Link
          to="/app/district/reports"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
        >
          <div className="font-bold text-white text-xs">Field Reports</div>
          <p className="text-[10px] text-slate-400 mt-1">Verify patrol reports →</p>
        </Link>
        <Link
          to="/app/district/roads"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
        >
          <div className="font-bold text-white text-xs">Road Status</div>
          <p className="text-[10px] text-slate-400 mt-1">Update passability →</p>
        </Link>
        <Link
          to="/app/district/routing"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
        >
          <div className="font-bold text-white text-xs">Emergency Routing</div>
          <p className="text-[10px] text-slate-400 mt-1">Compute bypass routes →</p>
        </Link>
      </div>

      {/* Recent Incidents Needing Review */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-400" />
            <span>Incidents Awaiting Verification in {districtLabel}</span>
          </h2>
          <Link to="/app/district/reports" className="text-xs text-cyan-400 hover:underline">
            View All Reports →
          </Link>
        </div>

        <div className="space-y-3">
          {pendingReview.slice(0, 4).map((inc) => (
            <div
              key={inc.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="text-xs font-bold text-white">{inc.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{inc.location} · {inc.reportedTime || inc.reportedAt}</p>
                <p className="text-xs text-slate-400 mt-1">{inc.impact}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 self-start sm:self-center">
                {inc.severity}
              </span>
            </div>
          ))}
          {pendingReview.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500">
              No pending incidents awaiting verification in your district.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistrictOverviewPage;

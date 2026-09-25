import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { FileText, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Activity } from 'lucide-react';

export const DistrictReportsPage = () => {
  const { user } = useAuth();
  const { incidents, verifyIncident, updateIncidentRoadStatus, showToast } = useApp();

  const myDistrictIds = user?.district_ids || [];
  const isAllDistricts = myDistrictIds.includes('*');

  const districtIncidents = isAllDistricts
    ? incidents
    : incidents.filter((inc) =>
        myDistrictIds.some((did) => inc.district?.toLowerCase().includes(did.replace('dist-', '')))
      );

  const handleVerify = (incId) => {
    verifyIncident(incId, user?.name || 'District Officer');
    showToast(`Incident #${incId} verified and logged to regional grid.`, 'success');
  };

  const handleStatusUpdate = (incId, status) => {
    updateIncidentRoadStatus(incId, status);
    showToast(`Road clearance updated: ${status}`, 'info');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-amber-400" />
          <span>Field Reports Verification Queue</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review, authenticate, and update road status on hazard reports filed by field highway patrols.
        </p>
      </div>

      <div className="space-y-4">
        {districtIncidents.map((inc) => (
          <div
            key={inc.id}
            className={`p-5 rounded-3xl border transition-all ${
              !inc.verified
                ? 'bg-slate-900 border-amber-500/30 shadow-lg shadow-amber-500/5'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white">{inc.title}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inc.verified
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {inc.verified ? 'Verified' : 'Pending Verification'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{inc.severity}</span>
                </div>
                <p className="text-xs text-slate-400">{inc.location} · Reported {inc.reportedTime || inc.reportedAt}</p>
                <p className="text-xs text-slate-300 mt-2">{inc.impact || inc.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                {!inc.verified && (
                  <button
                    onClick={() => handleVerify(inc.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verify Report
                  </button>
                )}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleStatusUpdate(inc.id, 'Blocked')}
                    className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors"
                  >
                    Mark Blocked
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(inc.id, 'Cleared')}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors"
                  >
                    Mark Cleared
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {districtIncidents.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-900 rounded-3xl border border-slate-800">
            No incident reports found for this district.
          </div>
        )}
      </div>
    </div>
  );
};

export default DistrictReportsPage;

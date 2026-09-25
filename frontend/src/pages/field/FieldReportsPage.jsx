import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { FileText, FilePlus, CheckCircle2, Clock, ChevronRight } from 'lucide-react';

const STATUS_CONFIG = {
  reported: { label: 'Reported', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  under_review: { label: 'Under Review', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  verified: { label: 'Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  resolved: { label: 'Resolved', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
};

function StatusTimeline({ status = 'under_review' }) {
  const steps = ['reported', 'under_review', 'verified', 'resolved'];
  const currentIdx = steps.indexOf(status) !== -1 ? steps.indexOf(status) : 1;

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => (
        <React.Fragment key={step}>
          <div
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              idx <= currentIdx
                ? STATUS_CONFIG[step]?.bg + ' ' + STATUS_CONFIG[step]?.color
                : 'bg-slate-800 border-slate-700 text-slate-600'
            }`}
          >
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

export const FieldReportsPage = () => {
  const { user } = useAuth();
  const { incidents } = useApp();

  const myReports = incidents.filter(
    (inc) => inc.reportedBy === user?.id || inc.verifiedBy?.includes(user?.name) || inc.reportedBy === 'me' || !inc.verified
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full min-w-0 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>My Submitted Incident Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking lifecycle status and DDMA verification of your field reports.
          </p>
        </div>

        <Link
          to="/app/field/report/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-lg shadow-cyan-600/20"
        >
          <FilePlus className="w-4 h-4" />
          <span>New Report</span>
        </Link>
      </div>

      <div className="space-y-4">
        {myReports.map((inc) => (
          <div
            key={inc.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">{inc.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{inc.location} · {inc.reportedTime || inc.reportedAt || 'Recent'}</p>
                <p className="text-xs text-slate-300 mt-2">{inc.impact || inc.description}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 self-start sm:self-center">
                {inc.severity}
              </span>
            </div>

            <div className="border-t border-slate-800/80 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-slate-500">Report Status:</span>
              <StatusTimeline status={inc.verified ? 'verified' : 'under_review'} />
            </div>
          </div>
        ))}

        {myReports.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-900 rounded-3xl border border-slate-800">
            You haven't submitted any reports yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldReportsPage;

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { IncidentSummary } from '../../components/dashboard/IncidentSummary';
import { FieldReportForm } from '../../components/report/FieldReportForm';
import { AlertTriangle, FilePlus, Filter, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export const AdminIncidentsPage = () => {
  const { incidents, verifyIncident, addIncident, showToast } = useApp();
  const { user } = useAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const filteredIncidents = filterSeverity === 'ALL'
    ? incidents
    : incidents.filter((i) => i.severity === filterSeverity);

  const handleVerify = (id) => {
    verifyIncident(id, user?.name || 'Admin Officer');
    showToast(`Incident #${id} verified by Command Desk.`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <span>Regional Incident & Disruption Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of road hazards, landslides, floods, and clearance operations across all districts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
          >
            <FilePlus className="w-4 h-4" />
            <span>Log Disruption</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl overflow-x-auto">
        <Filter className="w-4 h-4 text-slate-400 ml-2" />
        <span className="text-xs text-slate-400 mr-2 font-medium">Severity:</span>
        {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterSeverity === sev
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Table / Summary */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <IncidentSummary incidents={filteredIncidents} onVerify={handleVerify} />
      </div>

      {/* Modal for Log Disruption */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-6">
            <FieldReportForm
              onSubmitSuccess={(newIncident) => {
                addIncident(newIncident);
                setIsReportModalOpen(false);
                showToast('Incident added to command queue.', 'success');
              }}
              onCancel={() => setIsReportModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIncidentsPage;

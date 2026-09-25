import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FieldReportForm } from '../../components/report/FieldReportForm';
import { useApp } from '../../context/AppContext';
import { FilePlus, ArrowLeft } from 'lucide-react';

export const FieldReportNewPage = () => {
  const { addIncident, showToast } = useApp();
  const navigate = useNavigate();

  const handleSuccess = (newIncident) => {
    addIncident(newIncident);
    showToast('Incident report submitted to District Verification Desk.', 'success');
    navigate('/app/field/reports');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full min-w-0 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/app/field/home')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FilePlus className="w-6 h-6 text-cyan-400" />
            <span>Submit Highway Hazard Report</span>
          </h1>
          <p className="text-xs text-slate-400">
            Transmit GPS coordinates, hazard category, severity, and photo verification from your patrol sector.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <FieldReportForm
          onSubmitSuccess={handleSuccess}
          onCancel={() => navigate('/app/field/home')}
        />
      </div>
    </div>
  );
};

export default FieldReportNewPage;

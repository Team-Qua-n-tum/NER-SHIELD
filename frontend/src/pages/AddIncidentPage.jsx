import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar, Sidebar, StatCard, NotificationPanel, ChatPanel } from '../components/common';
import { IncidentSummary } from '../components/dashboard/IncidentSummary';
import { FieldReportList, FieldReportForm } from '../components/report';
import { Toast } from '../components/ui/Toast';
import {
  FilePlus,
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Radio,
  MapPin,
  Clock,
  Layers
} from 'lucide-react';

export const AddIncidentPage = () => {
  const {
    incidents,
    addIncident,
    verifyIncident,
    currentUser,
    alerts,
    toast,
    closeToast,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('incidents');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleFieldReportSubmitSuccess = (newIncident) => {
    addIncident(newIncident);
    setIsReportModalOpen(false);
    showToast('Field disruption incident logged successfully.', 'success');
  };

  const criticalCount = incidents.filter((i) => i.severity === 'Critical').length;
  const verifiedCount = incidents.filter((i) => i.verified).length;
  const unverifiedCount = incidents.filter((i) => !i.verified).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onToggleNotifications={() => setIsNotificationOpen(!isNotificationOpen)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        unreadAlertsCount={alerts.length}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="Incident Command"
        />

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto min-w-0">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-2 flex items-center justify-center text-amber-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                    NER Field Incident Reporting & Log
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Direct EOC Telemetry
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-black text-white mt-0.5 tracking-tight">
                  Field Disruption Log & Incident Registration
                </h1>
                <p className="text-xs text-slate-400 truncate sm:whitespace-normal">
                  Submit ground hazard reports, track road blockades, coordinate clearance machinery, and broadcast verified alerts.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
              >
                <FilePlus className="w-4 h-4" />
                <span>+ Report New Incident</span>
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>Radio Comms</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Total Field Incidents"
              value={incidents.length}
              subvalue="Logged Reports"
              change="8 States Coverage"
              trend="neutral"
              icon={FileText}
              colorScheme="blue"
            />

            <StatCard
              title="Critical Disruptions"
              value={criticalCount}
              subvalue="Priority Clearance"
              change="NH-6 Dima Hasao Pass"
              trend="down"
              icon={ShieldAlert}
              colorScheme="red"
            />

            <StatCard
              title="Verified Incidents"
              value={verifiedCount}
              subvalue="Officially Approved"
              change="Field Crews Dispatched"
              trend="up"
              icon={CheckCircle2}
              colorScheme="emerald"
            />

            <StatCard
              title="Pending Verification"
              value={unverifiedCount}
              subvalue="Needs Inspection"
              change="Patrol Squads En Route"
              trend={unverifiedCount > 0 ? "down" : "up"}
              icon={AlertTriangle}
              colorScheme="amber"
            />
          </div>

          {/* Reused Incident Components: IncidentSummary & FieldReportList */}
          <div className="space-y-6 min-w-0">
            <IncidentSummary
              incidents={incidents}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onLocateIncident={(inc) => showToast(`Selected ${inc.title}`, 'info')}
            />

            <FieldReportList
              incidents={incidents}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onLocateIncident={(inc) => showToast(`Selected ${inc.title}`, 'info')}
            />
          </div>
        </main>
      </div>

      {/* Field Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-6">
            <FieldReportForm
              onSubmitSuccess={handleFieldReportSubmitSuccess}
              onCancel={() => setIsReportModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Chat / Dispatch Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        defaultChannel="Disaster Ops"
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md">
          <Toast
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        </div>
      )}
    </div>
  );
};

export default AddIncidentPage;

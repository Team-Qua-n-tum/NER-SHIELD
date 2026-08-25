import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar, Sidebar, StatCard, NotificationPanel, ChatPanel } from '../components/common';
import { IncidentSummary } from '../components/dashboard/IncidentSummary';
import { FieldReportList, FieldReportForm } from '../components/report';
import { DistrictConnectivity } from '../components/dashboard/DistrictConnectivity';
import { Toast } from '../components/ui/Toast';
import {
  Shield,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Clock,
  Radio,
  FilePlus,
  Compass,
  Building2,
  Activity,
  Edit3,
  Wrench
} from 'lucide-react';

export const LocalOfficerDashboard = () => {
  const {
    incidents,
    districts,
    alerts,
    currentUser,
    verifyIncident,
    updateIncidentRoadStatus,
    updateDistrictStatus,
    addIncident,
    toast,
    closeToast,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // overview, verify, roads, districts, report, comms
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Selected Road Update Form State
  const [selectedIncidentForUpdate, setSelectedIncidentForUpdate] = useState(incidents[0] || null);
  const [updatedRoadStatus, setUpdatedRoadStatus] = useState(incidents[0]?.roadStatus || 'Closed - Heavy Debris');
  const [updatedClearanceEst, setUpdatedClearanceEst] = useState('18 hrs');

  const unverifiedIncidents = incidents.filter((i) => !i.verified);
  const verifiedIncidents = incidents.filter((i) => i.verified);

  const handleVerify = (incidentId) => {
    verifyIncident(incidentId, currentUser.name);
  };

  const handleUpdateRoadSubmit = (e) => {
    e.preventDefault();
    if (selectedIncidentForUpdate) {
      updateIncidentRoadStatus(
        selectedIncidentForUpdate.id,
        updatedRoadStatus,
        updatedClearanceEst
      );
    }
  };

  const handleFieldReportSubmitSuccess = (newIncident) => {
    addIncident({
      ...newIncident,
      verified: true,
      verifiedBy: currentUser.name,
    });
    setIsReportModalOpen(false);
    showToast('Field report verified and posted to regional command.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Navbar */}
      <Navbar
        onToggleNotifications={() => setIsNotificationOpen(!isNotificationOpen)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        unreadAlertsCount={alerts.length}
      />

      {/* Main Workspace with Responsive Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Officer Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="Field Officer Desk"
        />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
          
          {/* Top Officer Headline */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-2 flex items-center justify-center text-amber-400 shrink-0">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                    Sector: Assam & Dima Hasao Pass
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Field Clearance Active
                  </span>
                </div>
                <h1 className="text-base sm:text-xl font-extrabold text-white mt-0.5 truncate">
                  District Disaster & Road Verification Command
                </h1>
                <p className="text-xs text-slate-400 truncate">
                  Officer: <strong className="text-slate-200">{currentUser.name}</strong> • DDMO Task Force
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
              >
                <FilePlus className="w-4 h-4" />
                <span>Log Hazard</span>
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>Radio Comms</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Pending Verification"
              value={unverifiedIncidents.length}
              subvalue="Field Reports"
              change={unverifiedIncidents.length > 0 ? "Requires confirmation" : "All verified"}
              trend={unverifiedIncidents.length > 0 ? "down" : "up"}
              icon={ShieldAlert}
              colorScheme="amber"
              onClick={() => setActiveTab('verify')}
            />

            <StatCard
              title="Verified Incidents"
              value={verifiedIncidents.length}
              subvalue="Clearance Ops"
              change="BRO Crews Dispatched"
              trend="up"
              icon={CheckCircle2}
              colorScheme="blue"
              onClick={() => setActiveTab('overview')}
            />

            <StatCard
              title="District Status"
              value="8 / 8"
              subvalue="NER States Tracked"
              change="Dima Hasao Bottleneck"
              trend="neutral"
              icon={Activity}
              colorScheme="emerald"
              onClick={() => setActiveTab('districts')}
            />

            <StatCard
              title="Excavator Ops"
              value="3 Sites"
              subvalue="Under Restoration"
              change="Est. 18 hrs to single-lane"
              trend="up"
              icon={Wrench}
              colorScheme="cyan"
              onClick={() => setActiveTab('roads')}
            />
          </div>

          {/* TAB 1: OVERVIEW (Incidents summary + verification + road status update) */}
          {activeTab === 'overview' && (
            <div className="space-y-6 min-w-0">
              
              {/* Incident Verification & Road Status Update Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
                
                {/* Left 2 Cols: Incident Verification Feed */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
                  
                  {/* Verification Action Panel */}
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-5 h-5 text-amber-400" />
                        <div>
                          <h3 className="text-sm font-bold text-white">Incident Verification Queue</h3>
                          <p className="text-[11px] text-slate-400">Authenticate reported road obstructions, washouts, and debris.</p>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                        {unverifiedIncidents.length} Pending
                      </span>
                    </div>

                    <div className="space-y-3">
                      {incidents.map((inc) => (
                        <div
                          key={inc.id}
                          className={`p-3 sm:p-4 rounded-xl border transition-all min-w-0 ${
                            inc.verified
                              ? 'bg-slate-950/60 border-slate-800/80'
                              : 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/20'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  inc.severity === 'Critical'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-amber-500 text-slate-950'
                                }`}>
                                  {inc.severity}
                                </span>
                                <span className="text-xs font-bold text-white truncate">{inc.title}</span>
                              </div>
                              <p className="text-[11px] text-slate-300">{inc.impact}</p>
                              <div className="flex items-center space-x-3 text-[10px] text-slate-400 pt-1 flex-wrap gap-y-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-red-400" /> {inc.location}
                                </span>
                                <span>Reported: {inc.reportedAt}</span>
                                <span>By: {inc.reportedBy}</span>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center sm:flex-col sm:items-end gap-2">
                              {inc.verified ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleVerify(inc.id)}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Verify Now</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedIncidentForUpdate(inc);
                                  setUpdatedRoadStatus(inc.roadStatus);
                                  setUpdatedClearanceEst(inc.estimatedClearance || '12 hrs');
                                }}
                                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5"
                              >
                                <Edit3 className="w-3 h-3" /> Update Road Status
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reused Add Incident Components (FieldReportList & IncidentSummary) */}
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

                {/* Right 1 Col: Update Road Status Form & District Vulnerability */}
                <div className="space-y-4 sm:space-y-6 min-w-0">
                  
                  {/* Road Status Quick Update Form */}
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4 min-w-0">
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        Update Corridor Pass Status
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Broadcast real-time status change to driver navigation & supply dispatchers.
                      </p>
                    </div>

                    <form onSubmit={handleUpdateRoadSubmit} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Target Corridor / Incident:</label>
                        <select
                          value={selectedIncidentForUpdate?.id || ''}
                          onChange={(e) => {
                            const found = incidents.find((i) => i.id === e.target.value);
                            setSelectedIncidentForUpdate(found);
                            if (found) {
                              setUpdatedRoadStatus(found.roadStatus);
                              setUpdatedClearanceEst(found.estimatedClearance || '12 hrs');
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                        >
                          {incidents.map((inc) => (
                            <option key={inc.id} value={inc.id}>
                              {inc.location} ({inc.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">New Road Transit Status:</label>
                        <select
                          value={updatedRoadStatus}
                          onChange={(e) => setUpdatedRoadStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-semibold"
                        >
                          <option value="Open - Full Flow">Open - Full Flow</option>
                          <option value="Single-Lane Alternating Traffic">Single-Lane Alternating Traffic</option>
                          <option value="Restricted - 4WD & Multi-Axle Only">Restricted - 4WD & Multi-Axle Only</option>
                          <option value="Caution - Speed Capped at 25 km/h">Caution - Speed Capped at 25 km/h</option>
                          <option value="Closed - Heavy Debris">Closed - Heavy Debris</option>
                          <option value="Under BRO Clearance Operations">Under BRO Clearance Operations</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Estimated Clearance Time:</label>
                        <input
                          type="text"
                          value={updatedClearanceEst}
                          onChange={(e) => setUpdatedClearanceEst(e.target.value)}
                          placeholder="e.g. 18 hrs / Ongoing"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                      >
                        Publish Official Road Advisory
                      </button>
                    </form>
                  </div>

                  {/* District Connectivity Overview */}
                  <DistrictConnectivity
                    districts={districts}
                    onSelectDistrict={(d) => showToast(`Selected district: ${d.name}`, 'info')}
                  />

                  {/* Officer Comms Quick Widget */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-cyan-400" /> Regional Command Link
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Instant coordination channel between field inspection squads, BRO Task Force, and State EOC.
                    </p>
                    <button
                      onClick={() => setIsChatOpen(true)}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      Open Officer Comms Panel
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: VERIFY INCIDENTS */}
          {activeTab === 'verify' && (
            <div className="space-y-6 min-w-0">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 space-y-4 min-w-0">
                <h3 className="text-base font-bold text-white">Pending Incidents for Official Verification</h3>
                <div className="space-y-3">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{inc.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300">{inc.category}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{inc.impact}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{inc.location} • Reported: {inc.reportedAt}</p>
                      </div>
                      <button
                        onClick={() => handleVerify(inc.id)}
                        disabled={inc.verified}
                        className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 ${
                          inc.verified
                            ? 'bg-slate-800 text-slate-500'
                            : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        }`}
                      >
                        {inc.verified ? 'Verified ✓' : 'Approve & Verify'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROADS STATUS */}
          {activeTab === 'roads' && (
            <div className="space-y-6 min-w-0">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 min-w-0">
                <h3 className="text-base font-bold text-white mb-4">Northeastern Highway Corridor Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{inc.location}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                          {inc.estimatedClearance || 'Open'}
                        </span>
                      </div>
                      <p className="text-xs text-cyan-300 font-medium">Status: {inc.roadStatus}</p>
                      <p className="text-[11px] text-slate-400">{inc.clearanceOperation || 'Normal clearance protocol.'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DISTRICT VULNERABILITY */}
          {activeTab === 'districts' && (
            <div className="space-y-6 min-w-0">
              <DistrictConnectivity
                districts={districts}
                onSelectDistrict={(d) => showToast(`Selected district: ${d.name}`, 'info')}
              />
            </div>
          )}

        </main>

      </div>

      {/* Field Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
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

export default LocalOfficerDashboard;

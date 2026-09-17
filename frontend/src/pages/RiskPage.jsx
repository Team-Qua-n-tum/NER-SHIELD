import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar, Sidebar, StatCard, NotificationPanel, ChatPanel } from '../components/common';
import { AlertPanel } from '../components/dashboard/AlertPanel';
import { OperationsMap } from '../components/dashboard/OperationsMap';
import { Toast } from '../components/ui/Toast';
import {
  AlertTriangle,
  ShieldAlert,
  Radio,
  MapPin,
  Clock,
  CheckCircle2,
  Filter,
  PhoneCall,
  Activity,
  Zap
} from 'lucide-react';

export const RiskPage = () => {
  const {
    alerts,
    incidents,
    emergencyMode,
    toggleEmergencyMode,
    inspectedItem,
    setInspectedItem,
    selectedRouteId,
    setSelectedRouteId,
    toast,
    closeToast,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('alerts');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const criticalAlerts = alerts.filter((a) => a.severity.toLowerCase() === 'critical');
  const highAlerts = alerts.filter((a) => a.severity.toLowerCase() === 'high');
  const moderateAlerts = alerts.filter((a) => a.severity.toLowerCase() === 'moderate');

  const handleLocateItem = (item) => {
    setInspectedItem({
      type: item.type || item.category || 'Feature',
      data: item,
    });
    showToast(`Focused ${item.name || item.title || item.id || 'hazard'} on GIS layer.`, 'info');
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${emergencyMode ? 'ring-2 ring-red-500/50' : ''}`}>
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
          title="Risk & Hazard Center"
        />

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto min-w-0">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 p-4 sm:p-5 rounded-2xl border border-red-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 p-2 flex items-center justify-center text-red-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
                    NER Disaster & Hazard Warning Network
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                    State EOC / BRO Synchronized
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-black text-white mt-0.5 tracking-tight">
                  Real-Time Terrain Disruption & Vulnerability Hub
                </h1>
                <p className="text-xs text-slate-400 truncate sm:whitespace-normal">
                  Live monitoring of landslides, flash floods, dense mountain fog, and structural bridge alerts across the Northeast.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={toggleEmergencyMode}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-lg ${
                  emergencyMode
                    ? 'bg-red-600 text-white shadow-red-500/30 animate-pulse'
                    : 'bg-slate-800 hover:bg-red-950/50 text-red-400 border border-red-900/40'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{emergencyMode ? 'EMERGENCY PROTOCOL ACTIVE' : 'Trigger Level-1 Emergency'}</span>
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-1.5"
              >
                <Radio className="w-4 h-4" />
                <span>EOC Comms</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics (4 cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Critical Hazards"
              value={criticalAlerts.length}
              subvalue="Immediate Reroute"
              change="NH-6 Dima Hasao Blockage"
              trend="down"
              icon={ShieldAlert}
              colorScheme="red"
            />

            <StatCard
              title="High Severity Risks"
              value={highAlerts.length}
              subvalue="Caution Corridors"
              change="Barak Valley & Sela Pass"
              trend="down"
              icon={AlertTriangle}
              colorScheme="amber"
            />

            <StatCard
              title="Moderate Weather Risks"
              value={moderateAlerts.length}
              subvalue="Monsoon Advisories"
              change="Umiam Fog & Kohima Slip"
              trend="neutral"
              icon={Activity}
              colorScheme="blue"
            />

            <StatCard
              title="Active Incidents Logged"
              value={incidents.length}
              subvalue="Field Dispatches"
              change="BRO Heavy Machinery Active"
              trend="up"
              icon={CheckCircle2}
              colorScheme="emerald"
            />
          </div>

          {/* Main 2-Column Responsive Layout: AlertPanel + OperationsMap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
            {/* Left: Reused AlertPanel */}
            <div className="space-y-4 min-w-0">
              <AlertPanel
                alerts={alerts}
                onDismissAlert={(id) => showToast(`Alert ${id} acknowledged.`, 'info')}
                onLocateAlert={handleLocateItem}
              />
            </div>

            {/* Right: OperationsMap for Hazard Localization */}
            <div className="space-y-4 min-w-0">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden p-1 sm:p-2">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <h3 className="text-sm font-bold text-white">Geospatial Hazard Hotspot Map</h3>
                  </div>
                  <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    SATELLITE RADAR ACTIVE
                  </span>
                </div>
                <OperationsMap
                  selectedRouteId={selectedRouteId}
                  onSelectRouteId={setSelectedRouteId}
                  inspectedItem={inspectedItem}
                  onInspectItem={setInspectedItem}
                  onClearInspection={() => setInspectedItem(null)}
                  height="500px"
                />
              </div>

              {/* Emergency Protocol Hotline Info Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-cyan-400" /> Emergency Hotline Network
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">24/7 STANDBY</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase">Assam State Disaster EOC</p>
                    <p className="font-bold text-white font-mono mt-0.5">1070 / 0361-2237011</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase">BRO Task Force HQ</p>
                    <p className="font-bold text-white font-mono mt-0.5">1800-111-276</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Slide-over Notifications Panel */}
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onLocateAlert={handleLocateItem}
      />

      {/* Slide-over Dispatch Chat Panel */}
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

export default RiskPage;

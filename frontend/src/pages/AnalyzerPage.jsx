import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar, Sidebar, StatCard, NotificationPanel, ChatPanel } from '../components/common';
import { RouteRecommendations } from '../components/dashboard/RouteRecommendations';
import { OperationsMap } from '../components/dashboard/OperationsMap';
import { Toast } from '../components/ui/Toast';
import {
  Compass,
  Cpu,
  Radio,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';

export const AnalyzerPage = () => {
  const {
    routesData,
    selectedRouteId,
    setSelectedRouteId,
    inspectedItem,
    setInspectedItem,
    alerts,
    toast,
    closeToast,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('routes');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleSelectRouteOnMap = (routeId) => {
    setSelectedRouteId(routeId);
    showToast(
      routeId === 'ROUTE-ALTERNATE'
        ? 'AI Route Recommendation: Diverting freight to NH-27 Nagaon-Lumding bypass.'
        : 'Displaying Primary NH-6 route (Landslide Blockage at Km 142).',
      'info',
      'AI Analysis'
    );
  };

  const handleDispatchReroute = (routeInfo) => {
    showToast(
      `Priority AI Reroute broadcasted to all convoys bound for ${routeInfo?.name || 'destination'}.`,
      'success',
      'Reroute Dispatch Sent'
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Universal Navbar */}
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
          title="AI Route Analyzer"
        />

        {/* Center Main Work Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto min-w-0">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 p-4 sm:p-5 rounded-2xl border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 p-2 flex items-center justify-center text-indigo-400 shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                    NER Neural Route Safety Engine
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Terrain AI Model v3.4 Active
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-black text-white mt-0.5 tracking-tight">
                  Predictive Multi-Commodity Route Optimizer
                </h1>
                <p className="text-xs text-slate-400 truncate sm:whitespace-normal">
                  Evaluating monsoon rainfall rates, slope saturation, road gradients, and commodity criticality to generate optimal safe bypasses.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => handleSelectRouteOnMap('ROUTE-ALTERNATE')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center space-x-1.5 transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Simulate Safe Bypass</span>
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>AI Copilot</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Corridor Safety Index"
              value="98.2%"
              subvalue="Safe Corridors"
              change="+2.4% vs Unassisted"
              trend="up"
              icon={ShieldCheck}
              colorScheme="emerald"
            />

            <StatCard
              title="Average Travel Time Saved"
              value="4.2 hrs"
              subvalue="Per Heavy Freight"
              change="Avoiding Dima Hasao Queue"
              trend="up"
              icon={TrendingUp}
              colorScheme="cyan"
            />

            <StatCard
              title="Cold-Chain Protection"
              value="99.8%"
              subvalue="Battery & Temp Safe"
              change="Priority Transit Flag"
              trend="up"
              icon={Activity}
              colorScheme="blue"
            />

            <StatCard
              title="Disaster Reroutes Dispatched"
              value="14 Convoys"
              subvalue="Last 24 Hours"
              change="Zero Incidents Reported"
              trend="up"
              icon={Zap}
              colorScheme="purple"
            />
          </div>

          {/* 2-Column Responsive Layout: Route Recommendations + Visual GIS Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
            {/* Left: Reused RouteRecommendations */}
            <div className="space-y-4 min-w-0">
              <RouteRecommendations
                recommendationData={routesData}
                onSelectRouteOnMap={handleSelectRouteOnMap}
                onDispatchReroute={handleDispatchReroute}
                selectedRouteId={selectedRouteId}
              />
            </div>

            {/* Right: OperationsMap for AI Route Comparison */}
            <div className="space-y-4 min-w-0">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden p-1 sm:p-2">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">AI Corridor Layer Visualizer</h3>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    REAL-TIME GEO-ROUTING
                  </span>
                </div>
                <OperationsMap
                  selectedRouteId={selectedRouteId}
                  onSelectRouteId={setSelectedRouteId}
                  inspectedItem={inspectedItem}
                  onInspectItem={setInspectedItem}
                  onClearInspection={() => setInspectedItem(null)}
                  height="520px"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> AI Optimization Logic Notes
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  The AI corridor evaluator weights real-time soil moisture saturation from NASA/ISRO SAR datasets, historical monsoon rainfall trends, and road slope angles. If a primary highway is compromised, traffic is dynamically shifted to reinforced secondary corridors.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Notifications Panel */}
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Chat / Dispatch Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        defaultChannel="AI Copilot"
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

export default AnalyzerPage;

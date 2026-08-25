import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar, Sidebar, StatCard, VehicleTable, NotificationPanel, ChatPanel } from '../components/common';
import { OperationsMap } from '../components/dashboard/OperationsMap';
import { AlertPanel } from '../components/dashboard/AlertPanel';
import { RouteRecommendations } from '../components/dashboard/RouteRecommendations';
import { DistrictConnectivity } from '../components/dashboard/DistrictConnectivity';
import { IncidentSummary } from '../components/dashboard/IncidentSummary';
import { FieldReportList, FieldReportForm } from '../components/report';
import { Toast } from '../components/ui/Toast';
import {
  Truck,
  AlertTriangle,
  MapPin,
  Compass,
  Activity,
  Layers,
  FilePlus,
  ShieldCheck,
  Package,
  TrendingUp,
  Radio,
  BarChart3,
  Clock
} from 'lucide-react';

export const AdminDashboard = () => {
  const {
    vehicles,
    drivers,
    incidents,
    alerts,
    districts,
    routesData,
    selectedRouteId,
    setSelectedRouteId,
    inspectedItem,
    setInspectedItem,
    emergencyMode,
    toggleEmergencyMode,
    addIncident,
    toast,
    closeToast,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // overview, map, vehicles, alerts, routes, incidents, districts, comms
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLocateItem = (item) => {
    setInspectedItem({
      type: item.type || item.category || 'Feature',
      data: item,
    });
    if (activeTab !== 'overview' && activeTab !== 'map') {
      setActiveTab('map');
    }
    showToast(`Focused ${item.name || item.title || item.id || 'feature'} on GIS map view.`, 'info');
  };

  const handleSelectRouteOnMap = (routeId) => {
    setSelectedRouteId(routeId);
    if (activeTab !== 'overview' && activeTab !== 'map') {
      setActiveTab('map');
    }
    showToast(
      routeId === 'ROUTE-ALTERNATE'
        ? 'Activated AI-Recommended Safe Corridor (NH-27 Bypass)'
        : 'Displaying Primary Route (NH-6 Dima Hasao)',
      'success',
      'Route Filter'
    );
  };

  const handleDispatchReroute = (routeInfo) => {
    showToast(
      `Priority reroute advisory dispatched to all freight convoys en route to ${routeInfo?.name || 'destination'}.`,
      'success',
      'Reroute Dispatch Sent'
    );
  };

  const handleFieldReportSubmitSuccess = (newIncident) => {
    addIncident(newIncident);
    setIsReportModalOpen(false);
  };

  // Metrics computation
  const activeVehiclesCount = vehicles.filter((v) => v.status.includes('Transit')).length;
  const delayedVehiclesCount = vehicles.filter((v) => v.status.includes('Delayed') || v.status.includes('Caution')).length;
  const criticalIncidentsCount = incidents.filter((i) => i.severity === 'Critical' || i.severity === 'High').length;
  const isolatedDistrictsCount = districts.filter((d) => d.status === 'ISOLATED' || d.status === 'CRITICAL_BOTTLENECK').length;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${emergencyMode ? 'ring-2 ring-red-500/50' : ''}`}>
      
      {/* Top Universal Navbar */}
      <Navbar
        onToggleNotifications={() => setIsNotificationOpen(!isNotificationOpen)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        unreadAlertsCount={alerts.length}
      />

      {/* Main Workspace with Responsive Sidebar + Center Work Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="Admin Command"
        />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
          
          {/* Top Headline Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl">
            <div className="space-y-0.5 min-w-0">
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
                <span>NER Regional Logistics Command Center</span>
              </h1>
              <p className="text-xs text-slate-400 truncate sm:whitespace-normal">
                Multi-state AI route optimization, real-time fleet tracking, and incident clearance command.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all"
              >
                <FilePlus className="w-4 h-4" />
                <span>Log Disruption</span>
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>Comms</span>
              </button>
            </div>
          </div>

          {/* High-Level Logistics KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Fleet in Transit"
              value={activeVehiclesCount}
              subvalue={`/ ${vehicles.length}`}
              change={`${delayedVehiclesCount} delayed`}
              trend={delayedVehiclesCount > 0 ? 'down' : 'up'}
              icon={Truck}
              colorScheme="blue"
              progress={(activeVehiclesCount / vehicles.length) * 100}
              onClick={() => setActiveTab('vehicles')}
            />

            <StatCard
              title="Hazard Alerts"
              value={alerts.length}
              subvalue="Active Feeds"
              change={`${criticalIncidentsCount} Critical`}
              trend="down"
              icon={AlertTriangle}
              colorScheme="red"
              badge="BRO / EOC"
              onClick={() => setActiveTab('alerts')}
            />

            <StatCard
              title="Corridor Safety"
              value="98.2%"
              subvalue="AI Index"
              change="+1.8% Shift"
              trend="up"
              icon={Compass}
              colorScheme="emerald"
              badge="NH-27 Optimal"
              onClick={() => setActiveTab('routes')}
            />

            <StatCard
              title="Vulnerable Zones"
              value={isolatedDistrictsCount}
              subvalue={`/ ${districts.length} States`}
              change="Dima Hasao Pass"
              trend="neutral"
              icon={Activity}
              colorScheme="amber"
              onClick={() => setActiveTab('districts')}
            />
          </div>

          {/* TAB 1: COMMAND OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 min-w-0">
              
              {/* Operations Map & District Connectivity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
                
                {/* Left 2 Cols: Operations Map + Vehicle Table */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden min-w-0 p-1 sm:p-2">
                    <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">Live GIS Freight & Incident Map</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('map')}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Full Map →
                      </button>
                    </div>
                    <OperationsMap
                      selectedRouteId={selectedRouteId}
                      onSelectRouteId={setSelectedRouteId}
                      inspectedItem={inspectedItem}
                      onInspectItem={setInspectedItem}
                      onClearInspection={() => setInspectedItem(null)}
                      height="440px"
                    />
                  </div>

                  {/* Reusable Vehicle Management Table */}
                  <div className="min-w-0 overflow-hidden">
                    <VehicleTable
                      onLocateVehicle={handleLocateItem}
                      onRerouteVehicle={() => setActiveTab('routes')}
                    />
                  </div>
                </div>

                {/* Right 1 Col: Alert Panel & Route Recommendations */}
                <div className="space-y-4 sm:space-y-6 min-w-0">
                  <AlertPanel
                    alerts={alerts}
                    onDismissAlert={(id) => showToast(`Alert ${id} reviewed.`, 'info')}
                    onLocateAlert={handleLocateItem}
                  />

                  <RouteRecommendations
                    recommendationData={routesData}
                    onSelectRouteOnMap={handleSelectRouteOnMap}
                    onDispatchReroute={handleDispatchReroute}
                    selectedRouteId={selectedRouteId}
                  />

                  <DistrictConnectivity
                    districts={districts}
                    onSelectDistrict={handleLocateItem}
                  />
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: DEDICATED GIS MAP */}
          {activeTab === 'map' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden p-1 sm:p-2 min-w-0">
              <OperationsMap
                selectedRouteId={selectedRouteId}
                onSelectRouteId={setSelectedRouteId}
                inspectedItem={inspectedItem}
                onInspectItem={setInspectedItem}
                onClearInspection={() => setInspectedItem(null)}
                height="700px"
              />
            </div>
          )}

          {/* TAB 3: FLEET & VEHICLE MANAGEMENT */}
          {activeTab === 'vehicles' && (
            <div className="space-y-6 min-w-0">
              <VehicleTable
                onLocateVehicle={handleLocateItem}
                onRerouteVehicle={() => setActiveTab('routes')}
              />
            </div>
          )}

          {/* TAB 4: HAZARDS & RISK ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6 min-w-0">
              <AlertPanel
                alerts={alerts}
                onDismissAlert={(id) => showToast(`Alert ${id} reviewed.`, 'info')}
                onLocateAlert={handleLocateItem}
              />
            </div>
          )}

          {/* TAB 5: AI ROUTE OPTIMIZATION */}
          {activeTab === 'routes' && (
            <div className="space-y-6 min-w-0">
              <RouteRecommendations
                recommendationData={routesData}
                onSelectRouteOnMap={handleSelectRouteOnMap}
                onDispatchReroute={handleDispatchReroute}
                selectedRouteId={selectedRouteId}
              />
            </div>
          )}

          {/* TAB 6: INCIDENTS LOG & REPORTING */}
          {activeTab === 'incidents' && (
            <div className="space-y-6 min-w-0">
              <IncidentSummary
                incidents={incidents}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onLocateIncident={handleLocateItem}
              />
              <FieldReportList
                incidents={incidents}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onLocateIncident={handleLocateItem}
              />
            </div>
          )}

          {/* TAB 7: DISTRICT CONNECTIVITY */}
          {activeTab === 'districts' && (
            <div className="space-y-6 min-w-0">
              <DistrictConnectivity
                districts={districts}
                onSelectDistrict={handleLocateItem}
              />
            </div>
          )}

          {/* TAB 8: EMERGENCY COMMS */}
          {activeTab === 'comms' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 space-y-4 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-cyan-400" />
                    Inter-Agency Emergency Radio & Comms Network
                  </h3>
                  <p className="text-xs text-slate-400">
                    Encrypted channel between State EOC, BRO Task Forces, SDRF, and Supply Depots.
                  </p>
                </div>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shrink-0"
                >
                  Open Live Dispatch Drawer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-white">Disaster Ops (BRO & SDRF)</span>
                  <p className="text-[11px] text-slate-400">Active chokepoints: Dima Hasao Pass, NH-6 Km 142. Heavy excavators active.</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 font-mono">PRIORITY 1</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-white">Freight Convoy Channel</span>
                  <p className="text-[11px] text-slate-400">Rerouting VEH-101 (Insulin) and VEH-103 (Relief Kits) via NH-27 safe corridor.</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">IN TRANSIT</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-white">Civil Supplies Reserves</span>
                  <p className="text-[11px] text-slate-400">Imphal grain silos at 14 days reserve; Aizawl fuel stock at 15 days reserve.</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">MONITORED</span>
                </div>
              </div>
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

      {/* Notification Slide-Over Panel */}
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onLocateAlert={handleLocateItem}
      />

      {/* Dispatch Chat Slide-Over Panel */}
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

export default AdminDashboard;

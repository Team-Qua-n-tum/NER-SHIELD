import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar, Sidebar, StatCard, VehicleTable, NotificationPanel, ChatPanel } from '../components/common';
import { RouteRecommendations } from '../components/dashboard/RouteRecommendations';
import { OperationsMap } from '../components/dashboard/OperationsMap';
import { Toast } from '../components/ui/Toast';
import {
  Package,
  Truck,
  AlertTriangle,
  Compass,
  BarChart3,
  Clock,
  Radio,
  Activity,
  Layers,
  MapPin,
  TrendingUp,
  Fuel,
  Thermometer,
  Wheat,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const SupplyDashboard = () => {
  const {
    vehicles,
    districts,
    alerts,
    routesData,
    selectedRouteId,
    setSelectedRouteId,
    inspectedItem,
    setInspectedItem,
    toast,
    closeToast,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('fleet'); // fleet, delayed, routes, analytics, map, comms
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Computations
  const totalTonnageInTransit = vehicles.reduce(
    (acc, v) => acc + (parseFloat(v.currentLoadTonnes) || 0),
    0
  ).toFixed(1);

  const delayedVehicles = vehicles.filter(
    (v) => v.status.toLowerCase().includes('delayed') || v.status.toLowerCase().includes('caution')
  );

  const highRiskDistricts = districts.filter(
    (d) => d.status === 'CRITICAL_BOTTLENECK' || d.status === 'ISOLATED' || d.status === 'RESTRICTED'
  );

  const handleLocateVehicle = (veh) => {
    setInspectedItem({
      type: 'Vehicle',
      data: veh,
    });
    setActiveTab('map');
    showToast(`Focused vehicle ${veh.vehicleNumber} on GIS map.`, 'info');
  };

  const handleSelectRouteOnMap = (routeId) => {
    setSelectedRouteId(routeId);
    setActiveTab('map');
    showToast(`Switched route layer to ${routeId}`, 'info');
  };

  const handleDispatchReroute = (routeInfo) => {
    showToast(
      `Priority reroute advisory dispatched to freight convoys heading to ${routeInfo?.name || 'hub'}.`,
      'success'
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Navbar */}
      <Navbar
        onToggleNotifications={() => setIsNotificationOpen(!isNotificationOpen)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        unreadAlertsCount={alerts.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Supply Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="Supply & Logistics"
        />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Top Headline Banner */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 p-4 sm:p-5 rounded-2xl border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 p-2 flex items-center justify-center text-cyan-400">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    NER Civil Supplies & Freight Directorate
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Stockpile Telemetry Live
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  Supply Chain Flow & Freight Resiliency Analytics
                </h1>
                <p className="text-xs text-slate-400">
                  Tracking critical food grains, cold-chain vaccines, and fuel shipments across all 8 Northeastern states.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('delayed')}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all"
              >
                <Clock className="w-4 h-4" />
                <span>{delayedVehicles.length} Delayed Deliveries</span>
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>Supply Comms</span>
              </button>
            </div>
          </div>

          {/* Supply Chain KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Freight In Transit"
              value={`${totalTonnageInTransit} T`}
              subvalue={`Across ${vehicles.length} Trucks`}
              change="94.2% Capacity Utilization"
              trend="up"
              icon={Package}
              colorScheme="cyan"
              onClick={() => setActiveTab('fleet')}
            />

            <StatCard
              title="Delayed Shipments"
              value={delayedVehicles.length}
              subvalue="Active Delays"
              change="Avg. Delay: 3.4 hrs"
              trend="down"
              icon={Clock}
              colorScheme="amber"
              onClick={() => setActiveTab('delayed')}
            />

            <StatCard
              title="High-Risk Corridors"
              value="3 Routes"
              subvalue="Monsoon Disruption"
              change="NH-6 Bypass Recommended"
              trend="neutral"
              icon={Compass}
              colorScheme="red"
              onClick={() => setActiveTab('routes')}
            />

            <StatCard
              title="Medical & Fuel Stockpiles"
              value="28 Days"
              subvalue="Regional Buffer"
              change="Imphal: 8 days medical"
              trend="up"
              icon={Activity}
              colorScheme="emerald"
              onClick={() => setActiveTab('analytics')}
            />
          </div>

          {/* TAB 1: FLEET OVERVIEW & VEHICLE TRACKING */}
          {activeTab === 'fleet' && (
            <div className="space-y-6">
              
              {/* Full Vehicle Table */}
              <VehicleTable
                onLocateVehicle={handleLocateVehicle}
                onRerouteVehicle={() => setActiveTab('routes')}
              />

              {/* Commodity In-Transit Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-cyan-400" /> Cold-Chain Medical
                    </span>
                    <span className="font-mono text-cyan-300">18.4 Tonnes</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                  <p className="text-[10px] text-slate-400">Vaccines, insulin, emergency trauma plasma kits.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Wheat className="w-4 h-4 text-amber-400" /> Food Grains (PDS)
                    </span>
                    <span className="font-mono text-amber-300">38.0 Tonnes</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '92%' }} />
                  </div>
                  <p className="text-[10px] text-slate-400">Rice, wheat, pulses dispatched from Silchar/Guwahati.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-red-400" /> Petroleum & High Octane
                    </span>
                    <span className="font-mono text-red-300">22.0 Tonnes</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: '75%' }} />
                  </div>
                  <p className="text-[10px] text-slate-400">Diesel and aviation turbine fuel resupply convoys.</p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DELAYED DELIVERIES TRACKER */}
          {activeTab === 'delayed' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      Delayed Deliveries & Impact Analysis
                    </h3>
                    <p className="text-xs text-slate-400">
                      Real-time root cause detection and AI recovery routing for delayed shipments.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                    {delayedVehicles.length} Vehicles Impacted
                  </span>
                </div>

                <div className="space-y-4">
                  {delayedVehicles.map((veh) => (
                    <div
                      key={veh.id}
                      className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white font-mono text-sm">
                              {veh.vehicleNumber} ({veh.id})
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                              {veh.status}
                            </span>
                          </div>
                          <p className="text-xs text-cyan-300 mt-0.5">
                            Cargo: <strong>{veh.cargo}</strong> • Driver: {veh.driverName} ({veh.driverPhone})
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleLocateVehicle(veh)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold"
                          >
                            Locate on Map
                          </button>
                          <button
                            onClick={() => {
                              showToast(`Dispatched priority bypass for ${veh.vehicleNumber}`, 'success');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow"
                          >
                            Dispatch AI Bypass
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-slate-500 text-[10px] block">TRANSIT ROUTE</span>
                          <span className="text-slate-200 font-medium">{veh.origin} → {veh.destination}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">CURRENT POSITION</span>
                          <span className="text-slate-200 font-medium">{veh.currentLocation}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">ESTIMATED DELAY</span>
                          <span className="text-amber-400 font-mono font-bold">+2.5 hrs vs schedule</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HIGH-RISK ROUTES & AI ADVISORIES */}
          {activeTab === 'routes' && (
            <div className="space-y-6">
              <RouteRecommendations
                recommendationData={routesData}
                onSelectRouteOnMap={handleSelectRouteOnMap}
                onDispatchReroute={handleDispatchReroute}
                selectedRouteId={selectedRouteId}
              />
            </div>
          )}

          {/* TAB 4: STOCKPILES & REGIONAL ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Critical Districts Stockpiles Table */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                      District Essential Stockpiles & Buffer Days
                    </h3>
                    <p className="text-xs text-slate-400">
                      Emergency food grain, medical, and petroleum reserve levels by district.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/70 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">District & State</th>
                        <th className="px-4 py-3">Accessibility Score</th>
                        <th className="px-4 py-3">Food Grains Reserve</th>
                        <th className="px-4 py-3">Medical Reserve</th>
                        <th className="px-4 py-3">Fuel Reserve</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {districts.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-white">
                            {d.name} ({d.state})
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-cyan-300">
                            {d.accessibilityScore}%
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-mono font-bold ${
                              (d.stockpileStatus?.foodGrainsDays || 20) < 10 ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                              {d.stockpileStatus?.foodGrainsDays || 25} Days
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-mono font-bold ${
                              (d.stockpileStatus?.medicalDays || 20) < 10 ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                              {d.stockpileStatus?.medicalDays || 30} Days
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-mono font-bold ${
                              (d.stockpileStatus?.fuelDays || 20) < 10 ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                              {d.stockpileStatus?.fuelDays || 20} Days
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.status === 'OPTIMAL'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : d.status === 'CRITICAL_BOTTLENECK' || d.status === 'ISOLATED'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: GIS MAP */}
          {activeTab === 'map' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden p-2">
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

          {/* TAB 6: COMMS PANEL */}
          {activeTab === 'comms' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-cyan-400" />
                    Supply Department Freight Coordination Desk
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direct line with FCI storage depots, state civil supplies, and freight convoys.
                  </p>
                </div>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow"
                >
                  Open Live Dispatch Drawer
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <p className="font-semibold text-white">Active Dispatch Notes:</p>
                <p>• Emergency food supply convoy for Haflong (Dima Hasao) loaded at Silchar depot; standby for BRO green clearance tag.</p>
                <p>• Medical cold chain convoy VEH-101 en route to Imphal depot via Lumding-Kohima alternate corridor.</p>
              </div>
            </div>
          )}

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
        defaultChannel="Supply Ops"
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

export default SupplyDashboard;

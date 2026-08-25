import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar, Sidebar, StatCard, NotificationPanel, ChatPanel } from '../components/common';
import { OperationsMap } from '../components/dashboard/OperationsMap';
import { FieldReportForm } from '../components/report';
import { Toast } from '../components/ui/Toast';
import {
  Truck,
  MapPin,
  Clock,
  Navigation,
  Compass,
  Battery,
  Fuel,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  Radio,
  FilePlus,
  Activity,
  CheckCircle2,
  PhoneCall,
  Wind,
  CloudRain,
  Share2
} from 'lucide-react';

export const DriverDashboard = () => {
  const {
    vehicles,
    drivers,
    alerts,
    currentUser,
    selectedRouteId,
    setSelectedRouteId,
    inspectedItem,
    setInspectedItem,
    addIncident,
    toast,
    closeToast,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('trip'); // trip, telemetry, alerts, report, chat
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Active Vehicle for the Driver (Default to VEH-101)
  const activeVehicle = vehicles.find((v) => v.driverId === 'DRV-101') || vehicles[0];

  const handleFieldReportSubmitSuccess = (newIncident) => {
    addIncident(newIncident);
    setIsReportModalOpen(false);
    showToast('Incident reported to Base Station & Local Officer.', 'success');
  };

  const progressPercent = Math.round(
    (activeVehicle.distanceTravelledKm / (activeVehicle.totalDistanceKm || 500)) * 100
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Navbar */}
      <Navbar
        onToggleNotifications={() => setIsNotificationOpen(!isNotificationOpen)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        unreadAlertsCount={alerts.length}
      />

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Driver Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="Driver Console"
        />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Active Trip Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 p-2 flex items-center justify-center text-emerald-400">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    Trip Active • {activeVehicle.vehicleNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeVehicle.status}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  {activeVehicle.origin} → {activeVehicle.destination}
                </h1>
                <p className="text-xs text-slate-400">
                  Cargo: <strong className="text-cyan-300">{activeVehicle.cargo}</strong> ({activeVehicle.currentLoadTonnes}T)
                </p>
              </div>
            </div>

            {/* Quick Driver Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <FilePlus className="w-4 h-4" />
                <span>Quick Incident Report</span>
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>Base Dispatch</span>
              </button>
            </div>
          </div>

          {/* Real-time Trip Telemetry Metrics (4 Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* ETA */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>ESTIMATED ARRIVAL (ETA)</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {activeVehicle.eta || '4h 15m'}
              </div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> On-Schedule Buffer
              </p>
            </div>

            {/* Distance Travelled */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>DISTANCE TRAVELLED</span>
                <Navigation className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {activeVehicle.distanceTravelledKm} <span className="text-sm font-normal text-slate-400">km</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {/* Remaining Distance */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>REMAINING DISTANCE</span>
                <Compass className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {activeVehicle.remainingDistanceKm} <span className="text-sm font-normal text-slate-400">km</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Via: <strong className="text-slate-200">{activeVehicle.route || 'NH-27 Safe Corridor'}</strong>
              </p>
            </div>

            {/* Telemetry (Speed & Fuel) */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>CRUISING SPEED & FUEL</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-2">
                <span>{activeVehicle.speedKmH} <span className="text-xs font-normal text-slate-400">km/h</span></span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span className="flex items-center gap-1 text-cyan-300">
                  <Fuel className="w-3 h-3 text-cyan-400" /> {activeVehicle.fuelPercent}% Fuel
                </span>
                <span className="flex items-center gap-1 text-emerald-300">
                  <Battery className="w-3 h-3 text-emerald-400" /> {activeVehicle.batteryPercent}% Telemetry
                </span>
              </div>
            </div>

          </div>

          {/* Main Grid: Reused GIS Map + Driver In-Cabin Console */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 2 Cols: Reused Live Route Map */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Live Route Navigation & GIS Hazards</h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                    GPS TRACKING: LIVE
                  </span>
                </div>

                {/* Existing OperationsMap Component Reused */}
                <OperationsMap
                  selectedRouteId={selectedRouteId}
                  onSelectRouteId={setSelectedRouteId}
                  inspectedItem={inspectedItem}
                  onInspectItem={setInspectedItem}
                  onClearInspection={() => setInspectedItem(null)}
                  height="460px"
                />
              </div>

              {/* Highway Hazard Notice for Current Route */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Advisory: NH-6 Dima Hasao Blockage Alert
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">BRO Alert Active</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  NH-6 at Km 142 is blocked due to 180m landslide debris. Your route has been automatically switched to the <strong>NH-27 Nagaon-Lumding Safe Corridor</strong> to bypass the bottleneck safely.
                </p>
              </div>
            </div>

            {/* 1 Col: Vehicle Status, Cold Chain & Live Dispatch */}
            <div className="space-y-6">
              
              {/* Vehicle Health & Cold-Chain Status Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    In-Cabin Diagnostics
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    ALL SYSTEMS OK
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  
                  {/* Cold Chain Temp (If medical cargo) */}
                  {activeVehicle.temperatureC !== null && (
                    <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="font-bold text-white">Cold-Chain Compartment</p>
                          <p className="text-[10px] text-slate-400">Vaccines & Plasma Safe Zone</p>
                        </div>
                      </div>
                      <span className="text-base font-black text-cyan-300 font-mono">
                        +{activeVehicle.temperatureC}°C
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Engine Health</span>
                    <span className="font-semibold text-white">Optimal (98%)</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Tire Pressure (All Axles)</span>
                    <span className="font-semibold text-white font-mono">110 PSI</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Route Weather Conditions</span>
                    <span className="font-semibold text-amber-300 flex items-center gap-1">
                      <CloudRain className="w-3.5 h-3.5" /> Light Rain / Wet Surface
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">Assigned Field Officer</span>
                    <span className="font-semibold text-cyan-300">Inspector Debajit Barman</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>Report Road Obstacle Ahead</span>
                  </button>
                </div>
              </div>

              {/* Emergency SOS & Direct Call Hotline */}
              <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> Emergency Assistance SOS
                  </span>
                  <span className="text-[10px] text-red-300 font-mono">24/7 EOC</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Immediate breakdown or landslide entrapment on hill highway? Trigger emergency location beacon to SDRF & Patrol units.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => showToast('SOS Beacon broadcasted to nearest patrol post!', 'warning', 'SOS ACTIVE')}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/30 transition-all"
                  >
                    🚨 Send SOS Beacon
                  </button>
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    <Radio className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>

        </main>

      </div>

      {/* Field Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
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
        defaultChannel="Driver Network"
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

export default DriverDashboard;

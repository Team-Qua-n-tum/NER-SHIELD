import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { IncidentSummary } from '../../components/dashboard/IncidentSummary';
import { AlertPanel } from '../../components/dashboard/AlertPanel';
import { DistrictConnectivity } from '../../components/dashboard/DistrictConnectivity';
import { FieldReportForm } from '../../components/report/FieldReportForm';
import {
  ShieldCheck,
  Truck,
  AlertTriangle,
  MapPin,
  FilePlus,
  Radio,
  Clock,
  Activity,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminOverviewPage = () => {
  const {
    vehicles,
    incidents,
    alerts,
    districts,
    emergencyMode,
    toggleEmergencyMode,
    addIncident,
    showToast,
  } = useApp();
  const { user } = useAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Metrics computation
  const activeVehiclesCount = vehicles.filter((v) => v.status?.includes('Transit')).length;
  const delayedVehiclesCount = vehicles.filter((v) => v.status?.includes('Delayed') || v.status?.includes('Caution')).length;
  const criticalIncidentsCount = incidents.filter((i) => i.severity === 'Critical' || i.severity === 'High').length;
  const isolatedDistrictsCount = districts.filter((d) => d.status === 'ISOLATED' || d.status === 'CRITICAL_BOTTLENECK').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Top Headline Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              REGIONAL COMMAND CENTER
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            NER Multi-State Operational Oversight
          </h1>
          <p className="text-xs text-slate-400">
            Regional AI route optimization, highway corridor clearance, and inter-agency disaster logistics.
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
            onClick={toggleEmergencyMode}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all ${
              emergencyMode
                ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/30 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Activity className="w-4 h-4 text-red-400" />
            <span>{emergencyMode ? 'Level-1 Emergency Active' : 'Emergency Protocol'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Active Freight Convoys"
          value={activeVehiclesCount || 4}
          subValue={`${delayedVehiclesCount} Caution / Delayed`}
          icon={Truck}
          color="emerald"
        />
        <StatCard
          title="Critical Road Disruptions"
          value={criticalIncidentsCount || incidents.length}
          subValue={`${incidents.filter((i) => !i.verified).length} Awaiting Verification`}
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Vulnerable Districts"
          value={isolatedDistrictsCount || 2}
          subValue="Dima Hasao & East Jaintia"
          icon={MapPin}
          color="amber"
        />
        <StatCard
          title="Corridor Uptime"
          value="84.2%"
          subValue="NH-27 Open, NH-6 Blocked"
          icon={Activity}
          color="cyan"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/app/admin/map"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">Operational Map</span>
            <Layers className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <span className="text-[10px] text-slate-500 mt-2">View 8-State GIS Layers →</span>
        </Link>
        <Link
          to="/app/admin/incidents"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">Incident Queue</span>
            <AlertTriangle className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <span className="text-[10px] text-slate-500 mt-2">{incidents.length} Disruption Reports →</span>
        </Link>
        <Link
          to="/app/admin/roads"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Road Status</span>
            <Activity className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <span className="text-[10px] text-slate-500 mt-2">Highway Clearances →</span>
        </Link>
        <Link
          to="/app/admin/fleet"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">Fleet Roster</span>
            <Truck className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>
          <span className="text-[10px] text-slate-500 mt-2">{vehicles.length || 4} Convoys Active →</span>
        </Link>
      </div>

      {/* Grid: Incident Feed & Connectivity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <IncidentSummary incidents={incidents} />
        </div>
        <div className="space-y-6">
          <DistrictConnectivity districts={districts} />
          <AlertPanel alerts={alerts} />
        </div>
      </div>

      {/* Modal for Log Disruption */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-6">
            <FieldReportForm
              onSubmitSuccess={(newIncident) => {
                addIncident(newIncident);
                setIsReportModalOpen(false);
                showToast('Incident registered in command queue.', 'success');
              }}
              onCancel={() => setIsReportModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverviewPage;

import React from 'react';
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Compass,
  Truck,
  ShieldCheck,
  FilePlus,
  Radio,
  FileText,
  Activity,
  Layers,
  Settings,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar = ({ activeTab, onTabChange, items = [], title = 'Navigation' }) => {
  const {
    currentRole,
    vehicles,
    incidents,
    alerts,
    districts,
    emergencyMode
  } = useApp();

  // Default role-tailored sidebar menu items if custom items not provided
  const getDefaultNavItems = () => {
    switch (currentRole) {
      case 'driver':
        return [
          { id: 'trip', label: 'Active Trip & Map', icon: Map, badge: 'Live GPS' },
          { id: 'telemetry', label: 'Vehicle Health', icon: Activity },
          { id: 'alerts', label: 'Route Hazard Alerts', icon: AlertTriangle, count: alerts.length },
          { id: 'report', label: 'Quick Report Incident', icon: FilePlus, highlight: true },
          { id: 'chat', label: 'Base Station Dispatch', icon: Radio },
        ];
      case 'officer':
        return [
          { id: 'overview', label: 'District Incident Command', icon: LayoutDashboard },
          { id: 'verify', label: 'Verify Field Reports', icon: ShieldCheck, count: incidents.filter(i => !i.verified).length },
          { id: 'roads', label: 'Update Road Status', icon: Layers },
          { id: 'districts', label: 'District Vulnerability', icon: Map, count: districts.length },
          { id: 'report', label: 'Log New Field Incident', icon: FilePlus, highlight: true },
          { id: 'comms', label: 'Officer Dispatch Comms', icon: Radio },
        ];
      case 'supply':
        return [
          { id: 'fleet', label: 'Fleet Overview & Transit', icon: Truck, count: vehicles.length },
          { id: 'delayed', label: 'Delayed Deliveries', icon: AlertTriangle, count: vehicles.filter(v => v.status.includes('Delayed') || v.status.includes('Caution')).length, badgeColor: 'bg-amber-500' },
          { id: 'routes', label: 'High-Risk Corridors', icon: Compass, count: 3 },
          { id: 'analytics', label: 'Stockpiles & Analytics', icon: BarChart3 },
          { id: 'map', label: 'GIS Logistics Map', icon: Map },
          { id: 'comms', label: 'Supply Comms Panel', icon: Radio },
        ];
      case 'admin':
      default:
        return [
          { id: 'overview', label: 'Command Overview', icon: LayoutDashboard },
          { id: 'map', label: 'GIS Live Operations Map', icon: Map },
          { id: 'vehicles', label: 'Fleet & Driver Roster', icon: Truck, count: vehicles.length },
          { id: 'alerts', label: 'Hazard & Disaster Alerts', icon: AlertTriangle, count: alerts.length, badgeColor: 'bg-red-500' },
          { id: 'routes', label: 'AI Route Optimization', icon: Compass },
          { id: 'incidents', label: 'Incident Reports & Logs', icon: FileText, count: incidents.length },
          { id: 'districts', label: 'District Accessibility', icon: Activity },
          { id: 'comms', label: 'Emergency Dispatch Comms', icon: Radio },
        ];
    }
  };

  const navList = items.length > 0 ? items : getDefaultNavItems();

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-3 select-none">
      <div className="space-y-4">
        
        {/* Navigation Category Header */}
        <div className="px-3 pt-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
            {currentRole.toUpperCase()}
          </span>
        </div>

        {/* Navigation Buttons */}
        <nav className="space-y-1">
          {navList.map((item) => {
            const Icon = item.icon || ChevronRight;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                    : item.highlight
                    ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-cyan-400'
                        : item.highlight
                        ? 'text-amber-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                        item.badgeColor || 'bg-blue-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Status Widget */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">NER AI Analyzer</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> 99.4%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Monitored Corridors</span>
            <span className="text-slate-200 font-mono">19 Routes</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">High Risk State</span>
            <span className="text-amber-400 font-semibold">Assam / Dima Hasao</span>
          </div>
        </div>

        {emergencyMode && (
          <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-[11px] text-red-300 flex items-center space-x-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold">Priority Relief Routing In Effect</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Menu,
  BarChart3
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

  const [isCollapsed, setIsCollapsed] = useState(false);

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
          { id: 'map', label: 'GIS Operations Map', icon: Map },
          { id: 'vehicles', label: 'Fleet & Driver Roster', icon: Truck, count: vehicles.length },
          { id: 'alerts', label: 'Hazard & Disaster Alerts', icon: AlertTriangle, count: alerts.length, badgeColor: 'bg-red-500' },
          { id: 'routes', label: 'AI Route Optimization', icon: Compass },
          { id: 'incidents', label: 'Incident Reports & Logs', icon: FileText, count: incidents.length },
          { id: 'districts', label: 'District Accessibility', icon: Activity },
          { id: 'comms', label: 'Emergency Radio Comms', icon: Radio },
        ];
    }
  };

  const navList = items.length > 0 ? items : getDefaultNavItems();

  return (
    <>
      {/* Mobile Top Horizontal Tabs Navigation Bar (< 768px) */}
      <div className="md:hidden w-full bg-slate-900 border-b border-slate-800 px-2 py-2 overflow-x-auto shrink-0 flex items-center space-x-1.5 scrollbar-thin">
        {navList.map((item) => {
          const Icon = item.icon || ChevronRight;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-500 text-white">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop Sidebar (>= 768px) */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] bg-slate-900/95 border-r border-slate-800 p-3 select-none transition-all duration-200 ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        <div className="space-y-4">
          {/* Header with Collapse Toggle */}
          <div className="flex items-center justify-between px-2 pt-1">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                  {currentRole.toUpperCase()}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto md:mx-0"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navList.map((item) => {
              const Icon = item.icon || ChevronRight;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                      : item.highlight
                      ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'text-cyan-400'
                          : item.highlight
                          ? 'text-amber-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && (
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
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Status Widget */}
        {!isCollapsed && (
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
                <span className="text-slate-400">High Risk Sector</span>
                <span className="text-amber-400 font-semibold truncate ml-1">Dima Hasao</span>
              </div>
            </div>

            {emergencyMode && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-[11px] text-red-300 flex items-center space-x-2 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="font-semibold truncate">Emergency Protocol Active</span>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

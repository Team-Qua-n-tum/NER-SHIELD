import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  BarChart3,
  Home as HomeIcon,
  Shield,
  MapPin,
  Package,
  UserCheck,
  ExternalLink
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
  const location = useLocation();
  const navigate = useNavigate();

  // Multi-Page Navigation Route Items tailored by role
  const getNavItems = () => {
    switch (currentRole) {
      case 'driver':
        return [
          { path: '/driver', label: 'Driver Telemetry & GPS', icon: Truck, badge: 'In-Cabin' },
          { path: '/map', label: 'Live GIS Route Map', icon: Map },
          { path: '/risk', label: 'Route Hazard Alerts', icon: AlertTriangle, count: alerts.length, badgeColor: 'bg-red-500' },
          { path: '/incidents', label: 'Report Road Hazard', icon: FilePlus, highlight: true },
          { path: '/analyzer', label: 'AI Alternate Routes', icon: Compass },
          { path: '/admin', label: 'Admin Command', icon: Shield },
        ];
      case 'officer':
        return [
          { path: '/officer', label: 'District Incident Command', icon: LayoutDashboard },
          { path: '/incidents', label: 'Verify Incidents Queue', icon: ShieldCheck, count: incidents.filter(i => !i.verified).length, badgeColor: 'bg-amber-500' },
          { path: '/risk', label: 'Road Hazard Advisories', icon: AlertTriangle, count: alerts.length },
          { path: '/map', label: 'District GIS Hotspots', icon: Map },
          { path: '/supply', label: 'Supply Stockpiles', icon: Package },
          { path: '/admin', label: 'Regional Command Center', icon: Shield },
        ];
      case 'supply':
        return [
          { path: '/supply', label: 'Supply & Freight Desk', icon: Package, count: vehicles.length },
          { path: '/map', label: 'GIS Logistics Fleet Map', icon: Map },
          { path: '/analyzer', label: 'High-Risk AI Routes', icon: Compass, count: 3 },
          { path: '/risk', label: 'Disaster Hazard Feed', icon: AlertTriangle, count: alerts.length },
          { path: '/driver', label: 'Driver Fleet Roster', icon: Truck },
          { path: '/admin', label: 'Admin Overview', icon: Shield },
        ];
      case 'admin':
      default:
        return [
          { path: '/admin', label: 'Command Overview', icon: LayoutDashboard },
          { path: '/map', label: 'GIS Live Operations Map', icon: Map },
          { path: '/risk', label: 'Hazards & Disaster Alerts', icon: AlertTriangle, count: alerts.length, badgeColor: 'bg-red-500' },
          { path: '/analyzer', label: 'AI Route Optimization', icon: Compass },
          { path: '/incidents', label: 'Incident Reports & Logs', icon: FileText, count: incidents.length },
          { path: '/driver', label: 'Driver Telemetry Desk', icon: Truck },
          { path: '/officer', label: 'Local Officer Hub', icon: MapPin },
          { path: '/supply', label: 'Supply Chain Resiliency', icon: Package },
        ];
    }
  };

  const navList = items.length > 0 ? items : getNavItems();

  const handleItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.id && onTabChange) {
      onTabChange(item.id);
    }
  };

  return (
    <>
      {/* Mobile Top Horizontal Scrollable Multi-Page Bar (< 768px) */}
      <div className="md:hidden w-full bg-slate-900 border-b border-slate-800 px-3 py-2.5 overflow-x-auto shrink-0 flex items-center space-x-2 scrollbar-thin">
        {navList.map((item) => {
          const Icon = item.icon || ChevronRight;
          const isActive = item.path ? location.pathname === item.path : activeTab === item.id;

          return (
            <button
              key={item.path || item.id}
              onClick={() => handleItemClick(item)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
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
        className={`hidden md:flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] bg-slate-900/95 border-r border-slate-800 p-3.5 select-none transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="space-y-4">
          {/* Header with Collapse Toggle */}
          <div className="flex items-center justify-between px-2 pt-1 border-b border-slate-800/60 pb-2.5">
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto md:mx-0"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Route Links */}
          <nav className="space-y-1">
            {navList.map((item) => {
              const Icon = item.icon || ChevronRight;
              const isActive = item.path ? location.pathname === item.path : activeTab === item.id;

              return (
                <button
                  key={item.path || item.id}
                  onClick={() => handleItemClick(item)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-medium transition-all duration-150 group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/25 text-cyan-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
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
                    {!isCollapsed && <span className="truncate font-semibold">{item.label}</span>}
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

        {/* Footer Quick Links & Status */}
        {!isCollapsed && (
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">GIS Network State</span>
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">8 NER States</span>
                <span className="text-slate-200 font-mono">19 Routes</span>
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

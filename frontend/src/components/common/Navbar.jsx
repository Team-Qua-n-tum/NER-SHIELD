import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  ShieldAlert,
  Bell,
  MessageSquare,
  Radio,
  User,
  LogOut,
  ChevronDown,
  Truck,
  MapPin,
  Package,
  Layers,
  Activity,
  Map,
  AlertTriangle,
  Compass,
  FileText,
  Menu,
  X,
  Home as HomeIcon,
  Sparkles
} from 'lucide-react';

export const Navbar = ({ onToggleNotifications, onToggleChat, unreadAlertsCount = 0 }) => {
  const {
    currentRole,
    currentUser,
    setRole,
    logout,
    emergencyMode,
    toggleEmergencyMode,
    alerts
  } = useApp();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setRoleDropdownOpen(false);
    setMobileMenuOpen(false);
    if (newRole === 'admin') navigate('/admin');
    else if (newRole === 'driver') navigate('/driver');
    else if (newRole === 'officer') navigate('/officer');
    else if (newRole === 'supply') navigate('/supply');
  };

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const getRoleTheme = (role) => {
    switch (role) {
      case 'admin':
        return { bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', label: 'Admin Command', icon: Shield };
      case 'driver':
        return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', label: 'Driver Telemetry', icon: Truck };
      case 'officer':
        return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', label: 'Local Officer', icon: MapPin };
      case 'supply':
        return { bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', label: 'Supply Dept', icon: Package };
      default:
        return { bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40', label: 'Admin', icon: Shield };
    }
  };

  const currentTheme = getRoleTheme(currentRole);
  const RoleIcon = currentTheme.icon;

  const mainPages = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/admin', label: 'Admin', icon: Shield, badge: 'Role' },
    { path: '/driver', label: 'Driver', icon: Truck, badge: 'Role' },
    { path: '/officer', label: 'Officer', icon: MapPin, badge: 'Role' },
    { path: '/supply', label: 'Supply', icon: Package, badge: 'Role' },
    { path: '/map', label: 'GIS Map', icon: Map },
    { path: '/risk', label: 'Hazards', icon: AlertTriangle, count: alerts.length },
    { path: '/analyzer', label: 'AI Analyzer', icon: Compass },
    { path: '/incidents', label: 'Incident Log', icon: FileText },
    { path: '/login', label: 'Role Login', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      
      {/* Tier 1: Main Brand & Global Controls */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Brand & Platform Identity */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white focus:outline-none border border-slate-700"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent truncate">
                  NER SHIELD
                </span>
                <span className="text-[9px] sm:text-[10px] text-cyan-400 font-bold tracking-wider uppercase -mt-1 truncate">
                  AI Smart Logistics & Access
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Central Fast Page Tabs (Always visible on large & medium screens) */}
          <nav className="hidden lg:flex items-center space-x-1 overflow-x-auto py-1 px-2 scrollbar-none">
            {mainPages.slice(0, 7).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 border border-blue-400/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.count && item.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-500 text-white">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            
            {/* Live SAT Pulse (Desktop) */}
            <div className="hidden xl:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">SAT-NET ACTIVE</span>
            </div>

            {/* Emergency Protocol Button */}
            <button
              onClick={toggleEmergencyMode}
              title="Toggle Level-1 Logistics Emergency Protocol"
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                emergencyMode
                  ? 'bg-red-600 text-white border-red-500 shadow-red-500/30 animate-pulse'
                  : 'bg-slate-800 hover:bg-red-950/40 text-red-400 border-red-900/40 hover:border-red-600/50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {emergencyMode ? 'EMERGENCY' : 'Emergency'}
              </span>
            </button>

            {/* Notification Trigger */}
            <button
              onClick={onToggleNotifications}
              className="relative p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/70"
              title="Hazard & Disaster Feed"
            >
              <Bell className="w-4 h-4" />
              {(unreadAlertsCount > 0 || alerts.length > 0) && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow">
                  {unreadAlertsCount || alerts.length}
                </span>
              )}
            </button>

            {/* Chat Trigger */}
            <button
              onClick={onToggleChat}
              className="relative p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors border border-slate-700/70"
              title="Emergency Radio & AI Copilot"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-slate-900"></span>
            </button>

            {/* Role Switcher Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setRoleDropdownOpen(!roleDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${currentTheme.bg}`}
              >
                <RoleIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{currentTheme.label}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Switch Active Workspace
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2 text-xs font-semibold text-left transition-colors ${
                      currentRole === 'admin' ? 'bg-indigo-600/30 text-indigo-200' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-bold">Admin Command</div>
                      <div className="text-[10px] text-slate-400">Fleet CRUD & Regional GIS</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('driver')}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2 text-xs font-semibold text-left transition-colors ${
                      currentRole === 'driver' ? 'bg-emerald-600/30 text-emerald-200' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-bold">Driver Telemetry</div>
                      <div className="text-[10px] text-slate-400">Route Map, ETA & Chat</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('officer')}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2 text-xs font-semibold text-left transition-colors ${
                      currentRole === 'officer' ? 'bg-amber-600/30 text-amber-200' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-bold">Local Officer</div>
                      <div className="text-[10px] text-slate-400">Verify Incidents & Roads</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('supply')}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2 text-xs font-semibold text-left transition-colors ${
                      currentRole === 'supply' ? 'bg-cyan-600/30 text-cyan-200' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Package className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold">Supply Department</div>
                      <div className="text-[10px] text-slate-400">Freight & Delays Tracker</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Avatar / Quick Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setRoleDropdownOpen(false);
                }}
                className="flex items-center space-x-2 p-0.5 rounded-full hover:ring-2 hover:ring-blue-500/50 transition-all focus:outline-none"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 shadow-sm"
                />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-cyan-400 font-medium">{currentUser.roleLabel}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {currentUser.badge}
                    </span>
                  </div>

                  <div className="py-2 space-y-1">
                    <Link
                      to="/login"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-xl transition-colors font-medium"
                    >
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>Switch Account & Role</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Tier 2: Dedicated Horizontal Multi-Page Navigation Bar (Always visible) */}
      <div className="w-full bg-slate-950/90 border-t border-slate-800/80 px-3 sm:px-6 lg:px-8 py-1.5 overflow-x-auto scrollbar-thin">
        <div className="max-w-7xl mx-auto flex items-center space-x-1.5 min-w-max">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" /> Pages:
          </span>

          {mainPages.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.count && item.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-500 text-white">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Full-Screen Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/98 border-b border-slate-800 p-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Direct Page Navigation</span>
            <span className="text-cyan-400 text-[10px]">10 Active Routes</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {mainPages.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 p-3 rounded-xl font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Role: <strong className="text-white">{currentTheme.label}</strong></span>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-cyan-400 hover:underline font-semibold"
            >
              Switch Role →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

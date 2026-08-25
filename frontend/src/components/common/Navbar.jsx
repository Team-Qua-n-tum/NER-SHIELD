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
  Activity
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

  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setRoleDropdownOpen(false);
    if (newRole === 'admin') navigate('/admin');
    else if (newRole === 'driver') navigate('/driver');
    else if (newRole === 'officer') navigate('/officer');
    else if (newRole === 'supply') navigate('/supply');
  };

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
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

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Platform Identity */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                  NER SHIELD
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase -mt-1">
                  AI Smart Logistics & Access
                </span>
              </div>
            </Link>

            {/* Quick Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 pl-6">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  location.pathname === '/'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Home
              </Link>
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  location.pathname === '/admin'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Admin
              </Link>
              <Link
                to="/driver"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  location.pathname === '/driver'
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Driver
              </Link>
              <Link
                to="/officer"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  location.pathname === '/officer'
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Officer
              </Link>
              <Link
                to="/supply"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  location.pathname === '/supply'
                    ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Supply
              </Link>
            </nav>
          </div>

          {/* Center/Right Control Cluster */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Live Telemetry Pulse */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-emerald-400">NER SAT-NET ACTIVE</span>
            </div>

            {/* Emergency Protocol Toggle */}
            <button
              onClick={toggleEmergencyMode}
              title="Toggle Level-1 Logistics Emergency Mode"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                emergencyMode
                  ? 'bg-red-600 text-white border-red-500 shadow-red-500/30 animate-pulse'
                  : 'bg-slate-800 hover:bg-red-950/40 text-red-400 border-red-900/40 hover:border-red-600/50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {emergencyMode ? 'EMERGENCY ACTIVE' : 'Emergency Mode'}
              </span>
            </button>

            {/* Notification Trigger */}
            <button
              onClick={onToggleNotifications}
              className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
              title="View Alerts & Incident Feed"
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
              className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors border border-slate-700/60"
              title="Open Dispatch & AI Copilot Chat"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-slate-900"></span>
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setRoleDropdownOpen(!roleDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${currentTheme.bg}`}
              >
                <RoleIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{currentTheme.label}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Switch Workspace Role
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${
                      currentRole === 'admin'
                        ? 'bg-indigo-600/30 text-indigo-200'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-semibold">Admin Command</div>
                      <div className="text-[10px] text-slate-400">Fleet & Regional Overview</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('driver')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${
                      currentRole === 'driver'
                        ? 'bg-emerald-600/30 text-emerald-200'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold">Driver Telemetry</div>
                      <div className="text-[10px] text-slate-400">Route Map, ETA & Chat</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('officer')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${
                      currentRole === 'officer'
                        ? 'bg-amber-600/30 text-amber-200'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold">Local Officer</div>
                      <div className="text-[10px] text-slate-400">Verify Incidents & Road Status</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('supply')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${
                      currentRole === 'supply'
                        ? 'bg-cyan-600/30 text-cyan-200'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Package className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-semibold">Supply Department</div>
                      <div className="text-[10px] text-slate-400">Freight Flows & High-Risk Routes</div>
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
                className="flex items-center space-x-2 p-1 rounded-full hover:ring-2 hover:ring-blue-500/50 transition-all focus:outline-none"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 shadow-sm"
                />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-cyan-400 font-medium">{currentUser.roleLabel}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {currentUser.badge}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/login"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>Switch Account</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
    </header>
  );
};

export default Navbar;

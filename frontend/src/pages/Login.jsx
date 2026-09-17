import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/common';
import {
  Shield,
  Truck,
  MapPin,
  Package,
  CheckCircle2,
  ArrowRight,
  Lock,
  User,
  KeyRound,
  Radio,
  Sparkles
} from 'lucide-react';

export const Login = () => {
  const { currentRole, setRole, showToast } = useApp();
  const [selectedRole, setSelectedRole] = useState(currentRole || 'admin');
  const [passcode, setPasscode] = useState('123456');
  const [rememberMe, setRememberMe] = useState(true);

  const navigate = useNavigate();

  const roles = [
    {
      id: 'admin',
      title: 'Admin Command',
      subtitle: 'Integrated Regional Command Center',
      path: '/admin',
      icon: Shield,
      color: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-400',
      activeColor: 'ring-2 ring-indigo-500 bg-indigo-950/40 border-indigo-500',
      badge: 'Full Access',
      description: 'Fleet roster management, emergency protocols, regional GIS map, AI route recommendations & incidents.',
      demoUser: 'Col. Sanjeev Hazarika'
    },
    {
      id: 'driver',
      title: 'Driver Telemetry',
      subtitle: 'NER Freight & Hill Transit Driver',
      path: '/driver',
      icon: Truck,
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400',
      activeColor: 'ring-2 ring-emerald-500 bg-emerald-950/40 border-emerald-500',
      badge: 'In-Cabin',
      description: 'Route map, live trip telemetry (ETA, remaining km), vehicle status, notifications, and dispatch chat.',
      demoUser: 'Ramesh Kumar'
    },
    {
      id: 'officer',
      title: 'Local District Officer',
      subtitle: 'Disaster Management & PWD Official',
      path: '/officer',
      icon: MapPin,
      color: 'border-amber-500/50 bg-amber-950/20 text-amber-400',
      activeColor: 'ring-2 ring-amber-500 bg-amber-950/40 border-amber-500',
      badge: 'Clearance',
      description: 'Verify field hazard reports, update highway & pass status, and monitor district connectivity.',
      demoUser: 'Inspector Debajit Barman'
    },
    {
      id: 'supply',
      title: 'Supply Department',
      subtitle: 'Civil Supplies & Stockpiles Directorate',
      path: '/supply',
      icon: Package,
      color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400',
      activeColor: 'ring-2 ring-cyan-500 bg-cyan-950/40 border-cyan-500',
      badge: 'Logistics',
      description: 'Fleet overview, high-risk routes, delayed delivery tracking, and essential commodity reserves.',
      demoUser: 'N. Debbarma'
    }
  ];

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setRole(selectedRole);
    const targetRole = roles.find((r) => r.id === selectedRole);
    showToast(`Logged in successfully as ${targetRole?.title}`, 'success', 'Session Established');
    navigate(targetRole?.path || '/admin');
  };

  const handleQuickLogin = (roleId) => {
    setSelectedRole(roleId);
    setRole(roleId);
    const targetRole = roles.find((r) => r.id === roleId);
    showToast(`Instant login as ${targetRole?.title}`, 'success');
    navigate(targetRole?.path || '/admin');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden text-slate-100">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Ambient background glows */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[250px] bg-cyan-600/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative z-10 w-full max-w-2xl mx-auto">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            NER SHIELD Role Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Select your operational role to access mission-critical logistics & emergency tools
          </p>
        </div>

        <div className="bg-slate-900/90 py-6 sm:py-8 px-4 sm:px-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md space-y-6">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Step 1: Select Operational Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;

                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`relative p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? role.activeColor
                        : `${role.color} hover:border-slate-600 hover:bg-slate-800/40`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 shadow-sm">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                      )}
                    </div>

                    <div className="mt-3">
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        {role.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{role.badge}</span>
                      <span className="text-cyan-400 font-sans truncate ml-1">{role.demoUser}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Security Passcode / Government ID Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter 6-digit security PIN"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Default demo passkey prefilled (123456). Role is stored in localStorage.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Persist role session in browser</span>
              </label>
              <span className="text-cyan-400 font-mono text-[10px] sm:text-[11px]">NER-AUTH-V2</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>Launch {roles.find(r => r.id === selectedRole)?.title}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Direct One-Click Portals */}
          <div className="pt-3 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 mb-2.5 text-center">
              Quick 1-Click Instant Access:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 font-medium transition-colors text-center"
              >
                ⚡ Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('driver')}
                className="px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/40 text-emerald-300 font-medium transition-colors text-center"
              >
                ⚡ Driver
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('officer')}
                className="px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-500/40 text-amber-300 font-medium transition-colors text-center"
              >
                ⚡ Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('supply')}
                className="px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 font-medium transition-colors text-center"
              >
                ⚡ Supply
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="py-4 text-center text-slate-500 text-[11px]">
        NER SHIELD • Ministry of DoNER Support Prototype
      </div>
    </div>
  );
};

export default Login;

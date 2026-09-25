import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../../components/auth/RoleBadge';
import { DataModeBadge } from '../../components/auth/DataModeBadge';
import { User, Shield, MapPin, Truck, Key, Mail, Building, LogOut, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const { user, dataMode, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-cyan-400" />
            <span>Personnel Profile & Session</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active credential token and operational boundary assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataModeBadge mode={dataMode} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-600/20">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user?.name || 'Authorized Officer'}</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user?.email || 'officer@ner-shield.gov.in'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Assigned Role</span>
            <RoleBadge role={user?.role} size="sm" />
          </div>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Assigned District Boundary</span>
            </div>
            <div className="text-xs font-mono text-cyan-400">
              {user?.district_ids?.length > 0 && user.district_ids[0] === '*'
                ? 'All Northeast Districts (Regional Scope)'
                : user?.district_ids?.join(', ') || 'No local boundary restrictions'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Assigned Vehicle Fleet</span>
            </div>
            <div className="text-xs font-mono text-cyan-400">
              {user?.vehicle_ids?.length > 0 && user.vehicle_ids[0] === '*'
                ? 'All Fleet Convoys (*)'
                : user?.vehicle_ids?.join(', ') || 'No vehicle telemetry binding'}
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>Active Session UI Permissions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.permissions?.map((perm) => (
              <span
                key={perm}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {perm}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

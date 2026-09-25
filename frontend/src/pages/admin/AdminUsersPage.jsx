import React from 'react';
import { Users, Shield, MapPin, Key, Mail, CheckCircle2 } from 'lucide-react';
import { DEMO_USERS, ROLE_META } from '../../lib/demoUsers';
import { RoleBadge } from '../../components/auth/RoleBadge';

export const AdminUsersPage = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-400" />
          <span>User Access & Role Assignment Directory</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Authorized personnel directory across all 8 Northeastern State disaster response authorities and logistics departments.
        </p>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_USERS.map((usr) => (
          <div key={usr.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
                  {usr.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">{usr.name}</h2>
                  <p className="text-[10px] text-slate-400">{usr.roleLabel}</p>
                </div>
              </div>
              <RoleBadge role={usr.role} size="xs" />
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 font-mono">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{usr.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">
                  {usr.district_ids?.length > 0 && usr.district_ids[0] === '*'
                    ? 'All Districts (*)'
                    : usr.district_ids?.join(', ') || 'Global Scope'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-3">
              <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-1">
                Permissions ({usr.permissions?.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {usr.permissions?.slice(0, 3).map((p) => (
                  <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {p}
                  </span>
                ))}
                {usr.permissions?.length > 3 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    +{usr.permissions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersPage;

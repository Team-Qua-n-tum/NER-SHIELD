/**
 * PermissionDenied
 *
 * Rendered when an authenticated user tries to access a page
 * their role does not permit. Provides a clear explanation and
 * a link back to their role home.
 *
 * ⚠️  SECURITY NOTE: This page is UI-layer feedback only.
 *     The backend must independently reject unauthorized API calls.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_META } from '../../lib/demoUsers';

export const PermissionDenied = ({ requiredRoles = [], userRole }) => {
  const { getRoleHomePath, user } = useAuth();
  const homePath = getRoleHomePath();
  const roleMeta = ROLE_META[userRole] || ROLE_META[user?.role];

  return (
    <div
      data-testid="permission-denied"
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center"
    >
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-xl shadow-red-900/20">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Access Restricted
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your current role{' '}
            {roleMeta && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${roleMeta.bgClass}`}>
                {roleMeta.label}
              </span>
            )}{' '}
            does not have permission to view this page.
          </p>
        </div>

        {/* Details */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldOff className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              This section is restricted to authorized roles only.
            </span>
          </div>

          {requiredRoles.length > 0 && (
            <div className="text-xs text-slate-500 font-mono">
              Requires:{' '}
              {requiredRoles.map((r, i) => (
                <span key={r}>
                  <span className="text-slate-300">{ROLE_META[r]?.label || r}</span>
                  {i < requiredRoles.length - 1 && (
                    <span className="text-slate-600"> · </span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Security note */}
          <p className="text-[10px] text-slate-600 border-t border-slate-800 pt-2 font-mono">
            {/* ⚠️ This check is UI-layer only. Backend enforces authorization. */}
            NER-SHIELD enforces access controls at both UI and API layers.
          </p>
        </div>

        {/* CTA */}
        <Link
          to={homePath}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-white font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to My Dashboard
        </Link>
      </div>
    </div>
  );
};

export default PermissionDenied;

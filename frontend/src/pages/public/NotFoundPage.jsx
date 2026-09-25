import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NotFoundPage = () => {
  const { isAuthenticated, getRoleHomePath } = useAuth();
  const returnPath = isAuthenticated ? getRoleHomePath() : '/';
  const returnLabel = isAuthenticated ? 'Return to Operations Dashboard' : 'Return to Home';

  return (
    <div
      data-testid="not-found-page"
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center text-slate-100"
    >
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xl">
            <Compass className="w-8 h-8 text-cyan-400 animate-spin-slow" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono text-cyan-400 font-bold tracking-widest uppercase">
            404 — UNMAPPED CORRIDOR
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The requested tactical sector or route coordinate does not exist in the NER-SHIELD routing database.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to={returnPath}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-bold transition-all shadow-lg shadow-blue-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            {returnLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

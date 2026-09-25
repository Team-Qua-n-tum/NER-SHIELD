/**
 * ProtectedRoute
 *
 * Blocks rendering until auth loading completes.
 * Redirects unauthenticated users to /login.
 *
 * ⚠️  SECURITY NOTE: This guard is UI-layer only. It prevents rendering
 *     of protected components, but does NOT prevent direct API calls.
 *     All backend endpoints must enforce authorization independently.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // While session is being hydrated from storage, render nothing.
  // This prevents a flash of unauthenticated content.
  if (isLoading) {
    return (
      <div
        data-testid="auth-loading"
        className="min-h-screen bg-slate-950 flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-mono tracking-wider">
            VERIFYING SESSION…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (location.pathname === '/login') {
      return null;
    }
    // Preserve the attempted location so we can redirect back after login
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;

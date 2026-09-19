/**
 * SessionExpiredBanner
 *
 * Non-blocking banner shown when the user's session has expired.
 * Prompts re-login without forcibly destroying current page state.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SessionExpiredBanner = () => {
  const { sessionExpired, logout } = useAuth();
  const navigate = useNavigate();

  if (!sessionExpired) return null;

  const handleReLogin = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div
      data-testid="session-expired-banner"
      role="alert"
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500/10 border-b border-amber-500/40 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-medium">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            Your session has expired. Please log in again to continue.
          </span>
        </div>
        <button
          onClick={handleReLogin}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors"
        >
          Re-Login
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredBanner;

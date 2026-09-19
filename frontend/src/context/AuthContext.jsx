/**
 * NER-SHIELD AuthContext
 *
 * Provides authentication state and actions for the entire application.
 * Handles: login, logout, session persistence, session refresh,
 * demo mode, loading state, and session-expired detection.
 *
 * ⚠️  SECURITY NOTE: All frontend role checks are UI-layer ONLY.
 *     They prevent accidental rendering of restricted UI, but do NOT
 *     prevent direct API access. The backend MUST enforce authorization
 *     on every endpoint using the Authorization Bearer token.
 *
 * State shape:
 *   {
 *     user: null | { id, name, email, role, district_ids, vehicle_ids, permissions },
 *     token: null | string,
 *     isAuthenticated: boolean,
 *     isLoading: boolean,       // true while hydrating session on mount
 *     isDemoMode: boolean,      // true when running without real backend auth
 *     sessionExpired: boolean,  // true when token was valid but has expired
 *     dataMode: string,         // 'LIVE' | 'LIVE_STALE' | 'DEGRADED' | 'DEMO' | 'UNAVAILABLE' | 'OFFLINE'
 *   }
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { authApi } from '../lib/api/authApi';
import { ApiClient } from '../lib/api/client';
import { DEMO_MODE, ROLE_ALIAS_MAP } from '../lib/demoUsers';

// ─── Session storage keys ────────────────────────────────────────────────────
const SESSION_KEY = 'ner_shield_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function saveSession(token, user, isDemoSession) {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        token,
        user,
        isDemoSession: isDemoSession || false,
        savedAt: Date.now(),
      })
    );
  } catch {
    // sessionStorage may be blocked in private mode — graceful no-op
  }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire stale sessions
    if (Date.now() - (parsed.savedAt || 0) > SESSION_TTL_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/** Normalize role alias (e.g. 'driver' → 'field_officer') */
function normalizeRole(role) {
  return ROLE_ALIAS_MAP[role] || role;
}

/** Derive data mode from ApiClient state and session flags */
function deriveDataMode(isDemoSession) {
  if (isDemoSession || DEMO_MODE) return 'DEMO';
  if (ApiClient.isBackendAvailable === false) return 'DEGRADED';
  if (ApiClient.isBackendAvailable === true) return 'LIVE';
  return 'LIVE'; // default optimistic
}

// ─── Provider ────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // start true: hydrating
  const [isDemoMode, setIsDemoMode] = useState(DEMO_MODE);
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [dataMode, setDataMode] = useState('LIVE');
  const [loginError, setLoginError] = useState(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const refreshTimerRef = useRef(null);

  // ── Hydrate session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.token && saved.user) {
      const normalizedUser = {
        ...saved.user,
        role: normalizeRole(saved.user.role),
      };
      setUser(normalizedUser);
      setToken(saved.token);
      setIsAuthenticated(true);
      setIsDemoSession(saved.isDemoSession || false);
      setDataMode(deriveDataMode(saved.isDemoSession));
    }
    setIsLoading(false);
  }, []);

  // ── Update dataMode when backend availability changes ─────────────────────
  useEffect(() => {
    setDataMode(deriveDataMode(isDemoSession));
  }, [isDemoSession]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setIsLoginLoading(true);
    setLoginError(null);
    setSessionExpired(false);

    try {
      const result = await authApi.login(email, password);
      const normalizedUser = {
        ...result.user,
        role: normalizeRole(result.user.role),
      };
      const sessionIsDemo = result.isDemoSession || false;

      setUser(normalizedUser);
      setToken(result.token);
      setIsAuthenticated(true);
      setIsDemoSession(sessionIsDemo);
      setDataMode(deriveDataMode(sessionIsDemo));
      saveSession(result.token, normalizedUser, sessionIsDemo);

      return { success: true, user: normalizedUser };
    } catch (err) {
      const message =
        err.message === 'Invalid credentials.'
          ? 'Invalid email or password.'
          : 'Unable to connect to authentication service. Try again.';
      setLoginError(message);
      return { success: false, error: message };
    } finally {
      setIsLoginLoading(false);
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    await authApi.logout(token);
    clearSession();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setIsDemoSession(false);
    setSessionExpired(false);
    setDataMode('LIVE');
    setLoginError(null);
  }, [token]);

  // ── Mark session as expired (called externally e.g. on 401 response) ──────
  const markSessionExpired = useCallback(() => {
    setSessionExpired(true);
    setIsAuthenticated(false);
    clearSession();
  }, []);

  // ── Permission check helper ───────────────────────────────────────────────
  /**
   * Check if current user has a given permission string.
   * ⚠️ UI-layer only — backend must enforce separately.
   */
  const hasPermission = useCallback(
    (permission) => {
      if (!user || !user.permissions) return false;
      if (user.permissions.includes('admin:full')) return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  /**
   * Check if current user has one of the given roles.
   * ⚠️ UI-layer only.
   */
  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  /**
   * Get the home path for the current user's role.
   */
  const getRoleHomePath = useCallback(() => {
    if (!user) return '/login';
    return user.homePath || '/app/admin';
  }, [user]);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    isDemoMode,
    isDemoSession,
    sessionExpired,
    dataMode,
    loginError,
    isLoginLoading,

    // Actions
    login,
    logout,
    markSessionExpired,

    // Helpers
    hasPermission,
    hasRole,
    getRoleHomePath,

    // Convenience aliases (match old AppContext.currentUser / currentRole)
    currentUser: user,
    currentRole: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

export default AuthContext;

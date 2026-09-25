/**
 * NER-SHIELD Auth API Helper
 *
 * Wraps backend auth endpoints using the existing ApiClient.
 * Falls back to DEMO SESSION mode when the backend is not available.
 *
 * ⚠️  SECURITY NOTE: Frontend auth helpers control UI only.
 *     Backend MUST enforce authorization on every endpoint.
 *     All tokens must be validated server-side on every request.
 *
 * Backend endpoints consumed:
 *   POST /api/v1/auth/login   — { email, password } → { token, user }
 *   POST /api/v1/auth/logout  — {} → 204
 *   POST /api/v1/auth/refresh — { token } → { token }
 *   GET  /api/v1/auth/me      — → { id, name, email, role, district_ids, vehicle_ids, permissions }
 */

import { ApiClient } from './client';
import { validateDemoCredentials, isDemoModeEnabled } from '../demoUsers';

export const authApi = {
  /**
   * Attempt login via backend in live mode, or validate local demo user when in DEMO MODE.
   * In DEMO MODE (VITE_DEMO_MODE=true), signs in locally without network calls.
   * In LIVE MODE (VITE_DEMO_MODE=false), calls backend /auth/login and does not fall back to demo accounts.
   * Returns { token, user, isDemoSession } on success, throws on failure.
   */
  async login(email, password) {
    if (isDemoModeEnabled()) {
      const demoUser = validateDemoCredentials(email, password);
      if (!demoUser) throw new Error('Invalid credentials.');
      return {
        token: `demo-token-${demoUser.id}-${Date.now()}`,
        user: demoUser,
        isDemoSession: true,
      };
    }

    return await ApiClient.request(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  },

  /**
   * Logout — invalidates server session if in live mode.
   * Graceful no-op in demo mode or if backend unavailable.
   */
  async logout(token) {
    if (isDemoModeEnabled()) {
      return { success: true };
    }
    try {
      await ApiClient.request(
        '/auth/logout',
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
    } catch {
      // Always allow logout to succeed locally
    }
  },

  /**
   * Refresh session token.
   * Returns new { token } or null on failure.
   */
  async refresh(token) {
    if (isDemoModeEnabled()) {
      return { token, refreshed: false };
    }
    try {
      return await ApiClient.request(
        '/auth/refresh',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch {
      return null;
    }
  },

  /**
   * Get current authenticated user profile.
   * Returns user object or null.
   */
  async me(token) {
    if (isDemoModeEnabled()) {
      return null;
    }
    try {
      return await ApiClient.request(
        '/auth/me',
        {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
    } catch {
      return null;
    }
  },
};

export default authApi;

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
import { validateDemoCredentials, DEMO_MODE } from '../demoUsers';

export const authApi = {
  /**
   * Attempt login via backend; fall back to demo credentials in DEMO MODE.
   * Returns { token, user } on success, throws on failure.
   */
  async login(email, password) {
    try {
      const result = await ApiClient.request(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        // Fallback: demo credentials
        () => {
          if (!DEMO_MODE) throw new Error('Authentication service unavailable.');
          const demoUser = validateDemoCredentials(email, password);
          if (!demoUser) throw new Error('Invalid credentials.');
          return {
            token: `demo-token-${demoUser.id}-${Date.now()}`,
            user: demoUser,
            isDemoSession: true,
          };
        }
      );
      return result;
    } catch (err) {
      // Re-throw to surface clear error to UI
      throw err;
    }
  },

  /**
   * Logout — invalidates server session.
   * Graceful no-op in demo mode or if backend unavailable.
   */
  async logout(token) {
    try {
      await ApiClient.request(
        '/auth/logout',
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
        () => ({ success: true }) // demo fallback
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
    try {
      return await ApiClient.request(
        '/auth/refresh',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
        () => ({ token, refreshed: false }) // demo: return same token
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
    try {
      return await ApiClient.request(
        '/auth/me',
        {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
        () => null // no demo fallback for /me — context restores from sessionStorage
      );
    } catch {
      return null;
    }
  },
};

export default authApi;

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { authApi } from '../../lib/api/authApi';
import { AuthProvider } from '../../context/AuthContext';
import { Login } from '../../pages/Login';

// Mock firebase
vi.mock('../../lib/firebase', () => ({
  requestNotificationPermission: vi.fn(),
  subscribeToForegroundMessages: vi.fn(() => () => {}),
  firebaseApp: null,
}));

function LoginWrapper({ initialEntries = ['/login'] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Vercel & Environment-Driven Demo Authentication Gate', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('authApi.login behavior', () => {
    it('signs in a valid demo user with zero network requests when VITE_DEMO_MODE=true', async () => {
      vi.stubEnv('VITE_DEMO_MODE', 'true');

      const result = await authApi.login('admin@ner-shield.demo', 'demo');

      expect(result).toBeDefined();
      expect(result.isDemoSession).toBe(true);
      expect(result.user.role).toBe('admin');
      expect(result.token).toMatch(/^demo-token-/);

      // Verify zero network calls were made
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('rejects invalid demo credentials without network calls when VITE_DEMO_MODE=true', async () => {
      vi.stubEnv('VITE_DEMO_MODE', 'true');

      await expect(
        authApi.login('admin@ner-shield.demo', 'wrong-password')
      ).rejects.toThrow('Invalid credentials.');

      await expect(
        authApi.login('unknown@agency.gov.in', 'demo')
      ).rejects.toThrow('Invalid credentials.');

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('calls real backend API and does not fall back to demo users when VITE_DEMO_MODE=false', async () => {
      vi.stubEnv('VITE_DEMO_MODE', 'false');
      global.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      // Attempt to login using demo credentials when demo mode is disabled
      await expect(
        authApi.login('admin@ner-shield.demo', 'demo')
      ).rejects.toThrow();

      // Verify backend /auth/login was requested
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'admin@ner-shield.demo', password: 'demo' }),
        })
      );
    });

    it('returns backend token and user on successful live API authentication when VITE_DEMO_MODE=false', async () => {
      vi.stubEnv('VITE_DEMO_MODE', 'false');
      const liveUser = {
        id: 'usr-live-001',
        name: 'Live Officer',
        email: 'officer@gov.in',
        role: 'district_officer',
        district_ids: ['dist-guwahati'],
        permissions: ['incident:read'],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'jwt-real-token-xyz',
          user: liveUser,
        }),
      });

      const result = await authApi.login('officer@gov.in', 'LivePassword123!');

      expect(result.token).toBe('jwt-real-token-xyz');
      expect(result.user.email).toBe('officer@gov.in');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Login Page Visual & Accessibility Notice', () => {
    it('displays DEMO — SYNTHETIC DATA banner and demo account selector when VITE_DEMO_MODE=true', () => {
      vi.stubEnv('VITE_DEMO_MODE', 'true');

      render(<LoginWrapper />);

      const banner = screen.getByTestId('demo-mode-banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/DEMO — SYNTHETIC DATA/i);
      expect(banner).toHaveTextContent(/synthetic accounts/i);

      expect(screen.getByTestId('demo-account-selector')).toBeInTheDocument();
    });

    it('hides demo banner and selector when VITE_DEMO_MODE=false', () => {
      vi.stubEnv('VITE_DEMO_MODE', 'false');

      render(<LoginWrapper />);

      expect(screen.queryByTestId('demo-mode-banner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('demo-account-selector')).not.toBeInTheDocument();
    });
  });
});

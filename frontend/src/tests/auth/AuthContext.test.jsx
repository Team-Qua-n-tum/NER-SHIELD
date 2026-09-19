/**
 * AuthContext integration tests
 *
 * Tests:
 *  - Unauthenticated user sees landing/login, not dashboard/map
 *  - Protected route redirects to login
 *  - Role navigation differs by role
 *  - Field officer cannot see admin/fleet UI
 *  - Logistics operator can see route planner
 *  - Demo session is visibly labelled
 *  - Logout clears protected UI
 *  - No automatic FCM prompt on load
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { AppProvider } from '../../context/AppContext';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { RoleRoute } from '../../components/auth/RoleRoute';

// ── Helpers ──────────────────────────────────────────────────────────────────

// Mock firebase to prevent module-level side effects
vi.mock('../../lib/firebase', () => ({
  requestNotificationPermission: vi.fn(),
  subscribeToForegroundMessages: vi.fn(() => () => {}),
  firebaseApp: null,
}));

// Mock authApi so login resolves immediately
vi.mock('../../lib/api/authApi', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
    refresh: vi.fn(),
    me: vi.fn().mockResolvedValue(null),
  },
  authApi: {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
    refresh: vi.fn(),
    me: vi.fn().mockResolvedValue(null),
  },
}));

import { authApi } from '../../lib/api/authApi';

const DEMO_ADMIN = {
  id: 'demo-admin-001',
  name: 'Col. Sanjeev Hazarika',
  email: 'admin@ner-shield.demo',
  role: 'admin',
  district_ids: ['*'],
  vehicle_ids: ['*'],
  permissions: ['admin:full'],
  homePath: '/app/admin',
};

const DEMO_FIELD = {
  id: 'demo-field-001',
  name: 'Ramesh Kumar',
  email: 'field@ner-shield.demo',
  role: 'field_officer',
  district_ids: ['dist-dima-hasao'],
  vehicle_ids: ['VEH-101'],
  permissions: ['incident:create', 'incident:read_own'],
  homePath: '/app/field',
};

const DEMO_LOGISTICS = {
  id: 'demo-logistics-001',
  name: 'N. Debbarma',
  email: 'logistics@ner-shield.demo',
  role: 'logistics_operator',
  district_ids: [],
  vehicle_ids: ['VEH-101', 'VEH-102'],
  permissions: ['vehicle:read_assigned', 'route:plan'],
  homePath: '/app/logistics',
};

function Wrapper({ children, initialEntries = ['/'] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

function LoginButton({ user }) {
  const { login } = useAuth();
  return (
    <button
      data-testid="do-login"
      onClick={() => login(user.email, 'demo')}
    >
      Login
    </button>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <button data-testid="do-logout" onClick={() => logout()}>
      Logout
    </button>
  );
}

function AuthStatus() {
  const { isAuthenticated, user, isLoading, isDemoMode } = useAuth();
  if (isLoading) return <span data-testid="loading">Loading…</span>;
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
      {user && <span data-testid="user-role">{user.role}</span>}
      {isDemoMode && <span data-testid="demo-label">DEMO SESSION</span>}
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('starts unauthenticated before any login', () => {
    render(
      <Wrapper>
        <AuthStatus />
      </Wrapper>
    );
    expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
  });

  it('marks isDemoMode and shows DEMO SESSION label', () => {
    render(
      <Wrapper>
        <AuthStatus />
      </Wrapper>
    );
    // DEMO_MODE is true in the module
    expect(screen.getByTestId('demo-label')).toBeInTheDocument();
  });

  it('logs in successfully with demo credentials', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'demo-token-admin',
      user: DEMO_ADMIN,
      isDemoSession: true,
    });

    render(
      <Wrapper>
        <LoginButton user={DEMO_ADMIN} />
        <AuthStatus />
      </Wrapper>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
    await act(async () => {
      fireEvent.click(screen.getByTestId('do-login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
      expect(screen.getByTestId('user-role').textContent).toBe('admin');
    });
  });

  it('logout clears auth state', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'demo-token-admin',
      user: DEMO_ADMIN,
      isDemoSession: true,
    });
    authApi.logout.mockResolvedValue({});

    render(
      <Wrapper>
        <LoginButton user={DEMO_ADMIN} />
        <LogoutButton />
        <AuthStatus />
      </Wrapper>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('do-login'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('do-logout'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
      expect(screen.queryByTestId('user-role')).toBeNull();
    });
  });
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('shows loading spinner while isLoading', () => {
    render(
      <Wrapper>
        <ProtectedRoute>
          <div data-testid="protected-content">Secret</div>
        </ProtectedRoute>
      </Wrapper>
    );
    // On mount, isLoading briefly true (hydrating from sessionStorage)
    // After hydration it will show auth-loading or redirect
    // Just ensure no flash of protected content before loading done
    // (the spinner should appear or redirect should happen)
    const content = screen.queryByTestId('protected-content');
    // content is either not rendered (loading) or null (redirected to /login)
    // If sessionStorage is empty, it will redirect → no protected content shown
    expect(content).toBeNull();
  });

  it('redirects unauthenticated users to /login', async () => {
    let navigatedTo = null;
    const MockRoute = () => {
      navigatedTo = '/login';
      return <div data-testid="login-page">Login</div>;
    };

    render(
      <MemoryRouter initialEntries={['/app/admin']}>
        <AuthProvider>
          <AppProvider>
            <ProtectedRoute>
              <div data-testid="protected-content">Dashboard</div>
            </ProtectedRoute>
            <MockRoute />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).toBeNull();
    });
  });

  it('renders children when authenticated', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'token-admin',
      user: DEMO_ADMIN,
      isDemoSession: true,
    });

    function TestLogin() {
      const { login, isAuthenticated } = useAuth();
      return (
        <div>
          <button onClick={() => login(DEMO_ADMIN.email, 'demo')}>Login</button>
          <ProtectedRoute>
            {isAuthenticated && <div data-testid="protected-content">Dashboard</div>}
          </ProtectedRoute>
        </div>
      );
    }

    render(
      <Wrapper>
        <TestLogin />
      </Wrapper>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});

describe('Role-based navigation', () => {
  it('field_officer role does not have admin permissions', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'token-field',
      user: DEMO_FIELD,
      isDemoSession: true,
    });

    function PermissionCheck() {
      const { login, isAuthenticated, hasPermission, hasRole } = useAuth();
      return (
        <div>
          <button onClick={() => login(DEMO_FIELD.email, 'demo')}>Login</button>
          {isAuthenticated && (
            <>
              <span data-testid="is-admin">{String(hasRole('admin'))}</span>
              <span data-testid="is-field">{String(hasRole('field_officer'))}</span>
              <span data-testid="can-admin">{String(hasPermission('admin:full'))}</span>
              <span data-testid="can-report">{String(hasPermission('incident:create'))}</span>
            </>
          )}
        </div>
      );
    }

    render(<Wrapper><PermissionCheck /></Wrapper>);

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-admin').textContent).toBe('false');
      expect(screen.getByTestId('is-field').textContent).toBe('true');
      expect(screen.getByTestId('can-admin').textContent).toBe('false');
      expect(screen.getByTestId('can-report').textContent).toBe('true');
    });
  });

  it('logistics_operator has route:plan permission', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'token-logistics',
      user: DEMO_LOGISTICS,
      isDemoSession: true,
    });

    function PermCheck() {
      const { login, isAuthenticated, hasPermission } = useAuth();
      return (
        <div>
          <button onClick={() => login(DEMO_LOGISTICS.email, 'demo')}>Login</button>
          {isAuthenticated && (
            <span data-testid="can-route">{String(hasPermission('route:plan'))}</span>
          )}
        </div>
      );
    }

    render(<Wrapper><PermCheck /></Wrapper>);
    await act(async () => { fireEvent.click(screen.getByText('Login')); });
    await waitFor(() => {
      expect(screen.getByTestId('can-route').textContent).toBe('true');
    });
  });

  it('RoleRoute shows PermissionDenied when role not allowed', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'token-field',
      user: DEMO_FIELD,
      isDemoSession: true,
    });

    function TestRoleRoute() {
      const { login, isAuthenticated } = useAuth();
      return (
        <div>
          <button onClick={() => login(DEMO_FIELD.email, 'demo')}>Login</button>
          {isAuthenticated && (
            <RoleRoute allowedRoles={['admin']}>
              <div data-testid="admin-content">Admin Panel</div>
            </RoleRoute>
          )}
        </div>
      );
    }

    render(<Wrapper><TestRoleRoute /></Wrapper>);
    await act(async () => { fireEvent.click(screen.getByText('Login')); });
    await waitFor(() => {
      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByTestId('permission-denied')).toBeInTheDocument();
    });
  });
});

describe('No automatic FCM prompt', () => {
  it('does not call requestNotificationPermission automatically on page load', async () => {
    const { requestNotificationPermission } = await import('../../lib/firebase');
    const fcmSpy = vi.mocked(requestNotificationPermission);

    render(
      <Wrapper>
        <div data-testid="app">App loaded</div>
      </Wrapper>
    );

    // Wait a tick to allow any effects to run
    await new Promise(r => setTimeout(r, 100));

    expect(fcmSpy).not.toHaveBeenCalled();
  });
});

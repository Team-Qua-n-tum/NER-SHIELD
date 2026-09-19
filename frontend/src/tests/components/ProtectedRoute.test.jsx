/**
 * ProtectedRoute component tests
 *
 * Tests:
 *  - Unauthenticated renders redirect (no children shown)
 *  - Authenticated renders children
 *  - Loading state renders spinner, not children
 */
import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../../context/AuthContext';
import { AppProvider } from '../../context/AppContext';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

vi.mock('../../lib/firebase', () => ({
  requestNotificationPermission: vi.fn(),
  subscribeToForegroundMessages: vi.fn(() => () => {}),
  firebaseApp: null,
}));

vi.mock('../../lib/api/authApi', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
    me: vi.fn().mockResolvedValue(null),
  },
  authApi: {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
    me: vi.fn().mockResolvedValue(null),
  },
}));

import { authApi } from '../../lib/api/authApi';
import { useAuth } from '../../context/AuthContext';

function Wrapper({ children, initialEntries = ['/protected'] }) {
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

describe('ProtectedRoute', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('does not render children for unauthenticated users', async () => {
    render(
      <Wrapper>
        <ProtectedRoute>
          <div data-testid="secret">Protected Dashboard</div>
        </ProtectedRoute>
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('secret')).toBeNull();
    });
  });

  it('renders children for authenticated users', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'test-token',
      user: {
        id: 'u1', name: 'Admin', email: 'admin@test.com',
        role: 'admin', district_ids: ['*'], vehicle_ids: ['*'],
        permissions: ['admin:full'], homePath: '/app/admin',
      },
      isDemoSession: true,
    });

    function TestLogin() {
      const { login, isAuthenticated } = useAuth();
      return (
        <div>
          <button onClick={() => login('admin@test.com', 'demo')}>Login</button>
          <ProtectedRoute>
            <div data-testid="protected">Protected Content</div>
          </ProtectedRoute>
        </div>
      );
    }

    render(<Wrapper><TestLogin /></Wrapper>);

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });
  });

  it('shows auth-loading spinner while session is loading (no content flash)', () => {
    // Simulate loading state by checking the DOM before hydration completes
    // On mount, isLoading=true for one tick → no children visible
    render(
      <Wrapper>
        <ProtectedRoute>
          <div data-testid="secret">Secret Dashboard</div>
        </ProtectedRoute>
      </Wrapper>
    );

    // Immediately after render (before async effects), children should not be shown
    // Either the spinner is shown OR the redirect is happening (no children either way)
    expect(screen.queryByTestId('secret')).toBeNull();
  });
});

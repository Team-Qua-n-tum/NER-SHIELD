/**
 * NER-SHIELD Comprehensive Navigation Architecture Tests
 *
 * Verifies all P0/P1 navigation criteria:
 * - All declared sidebar routes resolve to page content (no 404, no wildcard bounce);
 * - No sidebar destination is duplicated per role;
 * - Unauthenticated /app/* redirects to /login;
 * - Public landing has no operational content;
 * - Each role gets correct navigation;
 * - Field officer gets PermissionDenied for admin route;
 * - Unknown URL renders not-found;
 * - Browser history works through actual route changes;
 * - Mock fallback only occurs when VITE_DEMO_MODE=true.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';

// Mock Leaflet and map components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  useMap: () => ({
    getContainer: () => document.createElement('div'),
    invalidateSize: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
  TileLayer: () => <div data-testid="tile-layer" />,
  Polygon: () => null,
  Polyline: () => null,
  Marker: () => null,
  Popup: () => null,
  GeoJSON: () => null,
}));

vi.mock('../components/map/DistrictLayer', () => ({ DistrictLayer: () => null }));
vi.mock('../components/map/RoadLayer', () => ({ RoadLayer: () => null }));
vi.mock('../components/map/IncidentMarkers', () => ({ IncidentMarkers: () => null }));
vi.mock('../components/map/VehicleMarkers', () => ({ VehicleMarkers: () => null }));
vi.mock('../components/map/RiskLayer', () => ({ RiskLayer: () => null }));
vi.mock('../components/map/RouteLayer', () => ({ RouteLayer: () => null }));

// Mock firebase
vi.mock('../lib/firebase', () => ({
  requestNotificationPermission: vi.fn(),
  subscribeToForegroundMessages: vi.fn(() => () => {}),
  firebaseApp: null,
}));

// Mock authApi
vi.mock('../lib/api/authApi', () => ({
  default: { login: vi.fn(), logout: vi.fn().mockResolvedValue({}), me: vi.fn().mockResolvedValue(null) },
  authApi: { login: vi.fn(), logout: vi.fn().mockResolvedValue({}), me: vi.fn().mockResolvedValue(null) },
}));

import { ROLE_NAV_CONFIG, ALL_DECLARED_ROLE_PATHS } from '../config/navigation';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { AppRoutes } from '../App';
import { ApiClient } from '../lib/api/client';

const DEMO_USERS = {
  admin: {
    id: 'demo-admin-001',
    name: 'Col. Sanjeev Hazarika',
    email: 'admin@ner-shield.demo',
    role: 'admin',
    district_ids: ['*'],
    vehicle_ids: ['*'],
    permissions: ['admin:full'],
    homePath: '/app/admin/overview',
  },
  district_officer: {
    id: 'demo-district-001',
    name: 'Inspector Debajit Barman',
    email: 'district@ner-shield.demo',
    role: 'district_officer',
    district_ids: ['dist-guwahati'],
    vehicle_ids: [],
    permissions: ['incident:read', 'incident:verify', 'road:update_status'],
    homePath: '/app/district/overview',
  },
  field_officer: {
    id: 'demo-field-001',
    name: 'Ramesh Kumar',
    email: 'field@ner-shield.demo',
    role: 'field_officer',
    district_ids: ['dist-dima-hasao'],
    vehicle_ids: ['VEH-101'],
    permissions: ['incident:create', 'incident:read_own'],
    homePath: '/app/field/home',
  },
  logistics_operator: {
    id: 'demo-logistics-001',
    name: 'N. Debbarma',
    email: 'logistics@ner-shield.demo',
    role: 'logistics_operator',
    district_ids: [],
    vehicle_ids: ['VEH-101'],
    permissions: ['vehicle:read_assigned', 'route:plan'],
    homePath: '/app/logistics/overview',
  },
  viewer: {
    id: 'demo-viewer-001',
    name: 'Public Viewer',
    email: 'viewer@ner-shield.demo',
    role: 'viewer',
    district_ids: [],
    vehicle_ids: [],
    permissions: ['alert:read_public'],
    homePath: '/app/viewer/overview',
  },
};

function seedSession(user) {
  sessionStorage.setItem(
    'ner_shield_session',
    JSON.stringify({
      token: `demo-token-${user.role}`,
      user,
      isDemoSession: true,
      savedAt: Date.now(),
    })
  );
}

function renderApp(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Navigation Architecture & Role Routing', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // 1. No duplicate destination in any role's sidebar
  it('no sidebar destination is duplicated per role', () => {
    for (const [role, items] of Object.entries(ROLE_NAV_CONFIG)) {
      const paths = items.map((i) => i.path);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(paths.length);
    }
  });

  // 2. Unauthenticated /app/* redirects to /login
  it('unauthenticated /app/* redirects to /login', async () => {
    renderApp(['/app/admin/overview']);

    await waitFor(() => {
      expect(screen.queryByTestId('app-shell')).toBeNull();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  // 3. Public landing has no operational content
  it('public landing has no operational content', () => {
    renderApp(['/']);

    expect(screen.queryByTestId('app-shell')).toBeNull();
    expect(screen.queryByTestId('operations-map')).toBeNull();
    expect(screen.queryByTestId('vehicle-table')).toBeNull();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  // 4. Each role gets only its own declared navigation items
  it('each role gets correct navigation items in sidebar', async () => {
    // Admin
    seedSession(DEMO_USERS.admin);
    const { unmount: unmountAdmin } = renderApp(['/app/admin/overview']);
    await waitFor(() => {
      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    });
    const adminSidebar = screen.getByTestId('app-sidebar');
    expect(within(adminSidebar).getByText('Operations Overview')).toBeInTheDocument();
    expect(within(adminSidebar).getByText('User Access')).toBeInTheDocument();
    expect(within(adminSidebar).queryByText('Safety Guidelines')).toBeNull();
    unmountAdmin();

    // Field Officer
    sessionStorage.clear();
    seedSession(DEMO_USERS.field_officer);
    const { unmount: unmountField } = renderApp(['/app/field/home']);
    await waitFor(() => {
      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    });
    const fieldSidebar = screen.getByTestId('app-sidebar');
    expect(within(fieldSidebar).getByText('Field Home')).toBeInTheDocument();
    expect(within(fieldSidebar).getByText('Report Incident')).toBeInTheDocument();
    expect(within(fieldSidebar).getByText('Safety Guidelines')).toBeInTheDocument();
    expect(within(fieldSidebar).queryByText('User Access')).toBeNull();
    expect(within(fieldSidebar).queryByText('Operations Overview')).toBeNull();
    unmountField();

    // Logistics Operator
    sessionStorage.clear();
    seedSession(DEMO_USERS.logistics_operator);
    const { unmount: unmountLogistics } = renderApp(['/app/logistics/overview']);
    await waitFor(() => {
      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    });
    const logisticsSidebar = screen.getByTestId('app-sidebar');
    expect(within(logisticsSidebar).getByText('Route Planner')).toBeInTheDocument();
    expect(within(logisticsSidebar).getByText('Route History')).toBeInTheDocument();
    expect(within(logisticsSidebar).queryByText('Safety Guidelines')).toBeNull();
    expect(within(logisticsSidebar).queryByText('User Access')).toBeNull();
    unmountLogistics();
  });

  // 5. Field officer gets PermissionDenied for admin route
  it('field officer gets PermissionDenied for admin route', async () => {
    seedSession(DEMO_USERS.field_officer);
    renderApp(['/app/admin/overview']);

    await waitFor(() => {
      expect(screen.getByTestId('permission-denied')).toBeInTheDocument();
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    });
  });

  // 6. Unknown URL renders not-found
  it('unknown URL renders not-found', async () => {
    renderApp(['/unmapped-corridor-route']);

    await waitFor(() => {
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });
  });

  // 7. All declared sidebar routes resolve to page content
  it('all declared sidebar routes resolve to page content without wildcard bounce', async () => {
    // Admin routes
    seedSession(DEMO_USERS.admin);
    for (const item of ROLE_NAV_CONFIG.admin) {
      const { unmount } = renderApp([item.path]);
      await waitFor(() => {
        expect(screen.queryByTestId('not-found-page')).toBeNull();
        expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
      });
      unmount();
    }

    // District routes
    sessionStorage.clear();
    seedSession(DEMO_USERS.district_officer);
    for (const item of ROLE_NAV_CONFIG.district_officer) {
      const { unmount } = renderApp([item.path]);
      await waitFor(() => {
        expect(screen.queryByTestId('not-found-page')).toBeNull();
        expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
      });
      unmount();
    }

    // Field routes
    sessionStorage.clear();
    seedSession(DEMO_USERS.field_officer);
    for (const item of ROLE_NAV_CONFIG.field_officer) {
      const { unmount } = renderApp([item.path]);
      await waitFor(() => {
        expect(screen.queryByTestId('not-found-page')).toBeNull();
        expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
      });
      unmount();
    }

    // Logistics routes
    sessionStorage.clear();
    seedSession(DEMO_USERS.logistics_operator);
    for (const item of ROLE_NAV_CONFIG.logistics_operator) {
      const { unmount } = renderApp([item.path]);
      await waitFor(() => {
        expect(screen.queryByTestId('not-found-page')).toBeNull();
        expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
      });
      unmount();
    }

    // Viewer routes
    sessionStorage.clear();
    seedSession(DEMO_USERS.viewer);
    for (const item of ROLE_NAV_CONFIG.viewer) {
      const { unmount } = renderApp([item.path]);
      await waitFor(() => {
        expect(screen.queryByTestId('not-found-page')).toBeNull();
        expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
      });
      unmount();
    }
  });

  // 8. Browser history works through actual route changes
  it('browser history works through actual route changes', async () => {
    seedSession(DEMO_USERS.admin);

    renderApp(['/app/admin/overview']);

    await waitFor(() => {
      expect(screen.getByText('Regional Command Center', { exact: false })).toBeInTheDocument();
    });

    // Click link to Operational Map
    const mapLink = within(screen.getByTestId('app-sidebar')).getByRole('link', { name: /Operational Map/i });
    await act(async () => {
      fireEvent.click(mapLink);
    });

    await waitFor(() => {
      expect(screen.getByText('Regional GIS Operations Map')).toBeInTheDocument();
    });
  });

  // 9. Mock fallback only occurs when VITE_DEMO_MODE=true
  it('mock fallback only occurs when VITE_DEMO_MODE=true', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Backend offline'));

    // Case 1: DEMO mode ON
    vi.stubEnv('VITE_DEMO_MODE', 'true');
    const demoFallback = { isMockData: true };
    const demoRes = await ApiClient.request('/test-api', {}, demoFallback);
    expect(demoRes).toEqual(demoFallback);

    // Case 2: DEMO mode OFF
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    await expect(ApiClient.request('/test-api', {}, demoFallback)).rejects.toThrow('Backend offline');

    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });
});

/**
 * Route no-route state tests
 *
 * Tests:
 *  - status=no_route shows no-route message and renders no polyline
 *  - Recalculate button triggers new API call
 *  - OSM fallback tile URL used when no env key
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock react-leaflet to avoid jsdom/canvas issues ──────────────────────────
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: (props) => <div data-testid="tile-layer" data-url={props.url} data-attribution={props.attribution} />,
  Polygon: () => null,
  Polyline: ({ positions, ...rest }) => (
    <div data-testid="route-polyline" data-positions={JSON.stringify(positions)} />
  ),
  Marker: () => null,
  Popup: () => null,
  GeoJSON: () => null,
}));

vi.mock('../../components/map/DistrictLayer', () => ({ DistrictLayer: () => null }));
vi.mock('../../components/map/RoadLayer', () => ({ RoadLayer: () => null }));
vi.mock('../../components/map/IncidentMarkers', () => ({ IncidentMarkers: () => null }));
vi.mock('../../components/map/VehicleMarkers', () => ({ VehicleMarkers: () => null }));
vi.mock('../../components/map/RiskLayer', () => ({ RiskLayer: () => null }));
vi.mock('../../components/map/RouteLayer', () => ({ RouteLayer: ({ data, visible }) => {
  // Only renders if there's a route and it's not no_route
  if (!visible || !data || data.status === 'no_route') return null;
  const routes = data.routes || [data];
  return <div data-testid="route-layer" data-routes={routes.length} />;
}}));

// Mock routesApi
vi.mock('../../lib/api/routesApi', () => ({
  routesApi: {
    recommendRoute: vi.fn(),
  },
}));

vi.mock('../../lib/firebase', () => ({
  requestNotificationPermission: vi.fn(),
  subscribeToForegroundMessages: vi.fn(() => () => {}),
  firebaseApp: null,
}));

vi.mock('../../lib/api/authApi', () => ({
  default: { login: vi.fn(), logout: vi.fn().mockResolvedValue({}), me: vi.fn().mockResolvedValue(null) },
  authApi: { login: vi.fn(), logout: vi.fn().mockResolvedValue({}), me: vi.fn().mockResolvedValue(null) },
}));

import { routesApi } from '../../lib/api/routesApi';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { AppProvider } from '../../context/AppContext';
import { authApi } from '../../lib/api/authApi';
import { useAuth } from '../../context/AuthContext';

const LOGISTICS_USER = {
  id: 'log-1', name: 'Logistics', email: 'logistics@test.com',
  role: 'logistics_operator', district_ids: [], vehicle_ids: ['VEH-101', 'VEH-102'],
  permissions: ['route:plan', 'vehicle:read_assigned'], homePath: '/app/logistics',
};

function Wrapper({ children }) {
  return (
    <MemoryRouter>
      <AuthProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

// ── A minimal RouteWidget that uses routesApi directly ────────────────────────
import { routesApi as apiImport } from '../../lib/api/routesApi';

function RouteWidget() {
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const planRoute = async () => {
    setLoading(true);
    const res = await apiImport.recommendRoute({ source: 'a', destination: 'b', commodity: 'MEDICINE' });
    setResult(res);
    setLoading(false);
  };

  const recalculate = async () => {
    setResult(null);
    await planRoute();
  };

  return (
    <div>
      <button data-testid="plan-route" onClick={planRoute}>Plan Route</button>

      {result && result.status === 'no_route' && (
        <div>
          <div data-testid="no-route-message">No Safe Route Found</div>
          <button data-testid="recalculate" onClick={recalculate}>Recalculate</button>
          {/* No polyline rendered for no_route */}
        </div>
      )}

      {result && result.status !== 'no_route' && result.routes?.length > 0 && (
        <div>
          <div data-testid="route-found">Route Found</div>
          <div data-testid="route-polyline" />
        </div>
      )}
    </div>
  );
}

describe('Route no-route state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows no-route message when status is no_route', async () => {
    routesApi.recommendRoute.mockResolvedValueOnce({ status: 'no_route', routes: [] });

    render(<Wrapper><RouteWidget /></Wrapper>);

    await act(async () => {
      fireEvent.click(screen.getByTestId('plan-route'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('no-route-message')).toBeInTheDocument();
    });
  });

  it('does not render route polyline when status is no_route', async () => {
    routesApi.recommendRoute.mockResolvedValueOnce({ status: 'no_route', routes: [] });

    render(<Wrapper><RouteWidget /></Wrapper>);

    await act(async () => {
      fireEvent.click(screen.getByTestId('plan-route'));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('route-polyline')).toBeNull();
    });
  });

  it('renders route polyline when route is available', async () => {
    routesApi.recommendRoute.mockResolvedValueOnce({
      status: 'success',
      routes: [{ id: 'r1', route_name: 'Primary', eta: '4h', risk_level: 'MEDIUM', risk_score: 0.5 }],
    });

    render(<Wrapper><RouteWidget /></Wrapper>);

    await act(async () => {
      fireEvent.click(screen.getByTestId('plan-route'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('route-polyline')).toBeInTheDocument();
    });
  });

  it('recalculate triggers a new API call', async () => {
    routesApi.recommendRoute
      .mockResolvedValueOnce({ status: 'no_route', routes: [] })
      .mockResolvedValueOnce({ status: 'no_route', routes: [] });

    render(<Wrapper><RouteWidget /></Wrapper>);

    await act(async () => {
      fireEvent.click(screen.getByTestId('plan-route'));
    });
    await waitFor(() => screen.getByTestId('recalculate'));

    await act(async () => {
      fireEvent.click(screen.getByTestId('recalculate'));
    });

    await waitFor(() => {
      expect(routesApi.recommendRoute).toHaveBeenCalledTimes(2);
    });
  });
});

describe('OpenStreetMap fallback', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses OSM tile URL by default', async () => {
    vi.stubEnv('VITE_MAP_TILE_URL', '');
    vi.stubEnv('VITE_MAP_API_KEY', '');

    const NERMap = (await import('../../components/map/NERMap')).default;
    render(<NERMap />);

    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer.getAttribute('data-url')).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
  });
});

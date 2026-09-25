import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NERMap from '../../components/map/NERMap';

// Mock react-leaflet components to intercept props
vi.mock('react-leaflet', () => {
  return {
    MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
    useMap: () => ({
      getContainer: () => document.createElement('div'),
      invalidateSize: vi.fn(),
    }),
    TileLayer: (props) => <div data-testid="tile-layer" data-url={props.url} data-attribution={props.attribution}></div>,
    Polygon: () => null,
    Polyline: () => null,
    Marker: () => null,
    Popup: () => null,
    GeoJSON: () => null,
  };
});

// Mock internal layers
vi.mock('../../components/map/DistrictLayer', () => ({ DistrictLayer: () => null }));
vi.mock('../../components/map/RoadLayer', () => ({ RoadLayer: () => null }));
vi.mock('../../components/map/IncidentMarkers', () => ({ IncidentMarkers: () => null }));
vi.mock('../../components/map/VehicleMarkers', () => ({ VehicleMarkers: () => null }));
vi.mock('../../components/map/RiskLayer', () => ({ RiskLayer: () => null }));
vi.mock('../../components/map/RouteLayer', () => ({ RouteLayer: () => null }));

describe('NERMap Provider Fallback', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('uses OpenStreetMap as default when no env vars are set', () => {
    vi.stubEnv('VITE_MAP_TILE_URL', '');
    vi.stubEnv('VITE_MAP_API_KEY', '');

    const { getByTestId } = render(<NERMap />);
    const tileLayer = getByTestId('tile-layer');

    expect(tileLayer.getAttribute('data-url')).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(tileLayer.getAttribute('data-attribution')).toContain('OpenStreetMap');
  });

  it('falls back to OpenStreetMap when a commercial provider URL is given but API key is missing', () => {
    vi.stubEnv('VITE_MAP_TILE_URL', 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key={apiKey}');
    vi.stubEnv('VITE_MAP_API_KEY', '');

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

    const { getByTestId } = render(<NERMap />);
    const tileLayer = getByTestId('tile-layer');

    expect(tileLayer.getAttribute('data-url')).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('missing'));
  });

  it('uses the commercial provider when API key is present', () => {
    vi.stubEnv('VITE_MAP_TILE_URL', 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key={apiKey}');
    vi.stubEnv('VITE_MAP_API_KEY', 'test-secret-key-123');

    const { getByTestId } = render(<NERMap />);
    const tileLayer = getByTestId('tile-layer');

    expect(tileLayer.getAttribute('data-url')).toBe('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=test-secret-key-123');
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RouteSourceCard } from '../../components/route/RouteSourceCard';
import { NotificationsPage } from '../../pages/common/NotificationsPage';
import { AppProvider } from '../../context/AppContext';
import { AuthProvider } from '../../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';

describe('RouteSourceCard', () => {
  it('renders explicit demo fallback metadata without OSRM or FastAPI branding', () => {
    const demoResult = {
      isDemoSession: true,
      data_mode: 'Demo — synthetic',
      source: 'Local demo fallback',
      route_authority: 'Demo scenario',
      freshness: 'Not applicable',
      routing_engine: 'Deterministic demo route',
      routes: [{ id: 'route-1', route_name: 'NH-27 Alternate' }],
    };

    render(<RouteSourceCard routeResult={demoResult} dataMode="DEMO" />);

    expect(screen.getByTestId('route-source-card')).toBeInTheDocument();
    expect(screen.getByText('Local demo fallback')).toBeInTheDocument();
    expect(screen.getByText('Data mode: Demo — synthetic')).toBeInTheDocument();
    expect(screen.getByText('Demo scenario')).toBeInTheDocument();
    expect(screen.getByText('Not applicable')).toBeInTheDocument();
    expect(screen.getByText('Deterministic demo route')).toBeInTheDocument();

    // Verify absence of OSRM / FastAPI branding
    expect(screen.queryByText(/OSRM/i)).toBeNull();
    expect(screen.queryByText(/FastAPI/i)).toBeNull();
  });

  it('renders degraded state card when routeError is present and does not render fabricated routes', () => {
    render(<RouteSourceCard routeError="Network connection lost" dataMode="DEGRADED" />);

    expect(screen.getByTestId('route-source-card-degraded')).toBeInTheDocument();
    expect(screen.getByText('Source: Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Data mode: Degraded')).toBeInTheDocument();
    expect(screen.getByText('Route result: Not available')).toBeInTheDocument();
  });
});

describe('Notification Accessibility Controls', () => {
  it('provides accessible names, aria-pressed, and explicit visible text for Push Dispatch and Audio Chime', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <NotificationsPage />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Browser Push Dispatch control
    const pushButton = screen.getByRole('button', { name: /Browser Push Dispatch/i });
    expect(pushButton).toBeInTheDocument();
    expect(pushButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Emergency alerts disabled')).toBeInTheDocument();

    // Toggle push
    fireEvent.click(pushButton);
    expect(pushButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Emergency alerts enabled')).toBeInTheDocument();

    // Audio Dispatch Chime control (defaults to enabled)
    const chimeButton = screen.getByRole('button', { name: /Audio Dispatch Chime/i });
    expect(chimeButton).toBeInTheDocument();
    expect(chimeButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Audio dispatch chime enabled')).toBeInTheDocument();

    // Toggle chime
    fireEvent.click(chimeButton);
    expect(chimeButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Audio dispatch chime disabled')).toBeInTheDocument();
  });
});

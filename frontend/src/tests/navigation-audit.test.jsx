/**
 * Navigation audit tests — documents current router/nav configuration.
 *
 * These assertions encode the audited inventory from docs/frontend-audit.md.
 * They intentionally expose dead AppShell nested targets vs registered App.jsx
 * routes. They must NOT redesign UI or change application behavior.
 *
 * Avoid angle-bracket string literals in this .jsx file so oxlint does not
 * treat them as JSX (e.g. build Link tag via concatenation).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(__dirname, '..');
const linkOpenTag = '<' + 'Link';

function readSrc(relativePath) {
  return readFileSync(join(srcRoot, relativePath), 'utf8');
}

/** Routes registered in App.jsx (path strings only). */
export const REGISTERED_APP_ROUTES = [
  '/',
  '/login',
  '/denied',
  '/app/admin',
  '/app/district',
  '/app/field',
  '/app/logistics',
  '/app/viewer',
  '/app/map',
  '/app/risk',
  '/app/analyzer',
  '/app/incidents',
  '/admin',
  '/driver',
  '/officer',
  '/supply',
  '/map',
  '/risk',
  '/analyzer',
  '/incidents',
];

/** Legacy Navbar targets (common/Navbar.jsx). */
export const NAVBAR_LINK_PATHS = [
  '/',
  '/admin',
  '/driver',
  '/officer',
  '/supply',
  '/map',
  '/risk',
  '/analyzer',
  '/incidents',
];

/**
 * Nested paths advertised by AppShell getNavItems — many are NOT registered.
 * Captured from components/layout/AppShell.jsx for audit regression.
 */
export const APPSHELL_ADVERTISED_PATHS = [
  '/app/admin',
  '/app/admin/map',
  '/app/admin/vehicles',
  '/app/admin/incidents',
  '/app/admin/routes',
  '/app/admin/alerts',
  '/app/admin/districts',
  '/app/admin/users',
  '/app/admin/audit',
  '/app/district',
  '/app/district/map',
  '/app/district/incidents',
  '/app/district/roads',
  '/app/district/routes',
  '/app/district/alerts',
  '/app/district/reports',
  '/app/field',
  '/app/field/report',
  '/app/field/my-reports',
  '/app/field/map',
  '/app/field/alerts',
  '/app/field/notifications',
  '/app/logistics',
  '/app/logistics/routes',
  '/app/logistics/alerts',
  '/app/logistics/vehicles',
  '/app/viewer',
  '/app/viewer/alerts',
];

describe('navigation audit inventory', () => {
  it('App.jsx still uses BrowserRouter + Routes and a catch-all to /', () => {
    const appSrc = readSrc('App.jsx');
    expect(appSrc.includes('BrowserRouter')).toBe(true);
    expect(appSrc.includes('Routes')).toBe(true);
    expect(appSrc.includes('path="*"')).toBe(true);
    expect(appSrc.includes('Navigate to="/"')).toBe(true);
  });

  it('registers the audited flat /app/* role and ops routes', () => {
    const appSrc = readSrc('App.jsx');
    for (const path of [
      '/app/admin',
      '/app/district',
      '/app/field',
      '/app/logistics',
      '/app/viewer',
      '/app/map',
      '/app/risk',
      '/app/analyzer',
      '/app/incidents',
    ]) {
      expect(appSrc).toContain(`path="${path}"`);
    }
  });

  it('exposes AppShell nested paths that are not registered routes (known defect)', () => {
    const deadNested = APPSHELL_ADVERTISED_PATHS.filter(
      (p) => !REGISTERED_APP_ROUTES.includes(p)
    );

    // Audit baseline: nested role sections are advertised but not routed.
    expect(deadNested.length).toBeGreaterThan(0);
    expect(deadNested).toEqual(
      expect.arrayContaining([
        '/app/admin/map',
        '/app/field/report',
        '/app/logistics/routes',
        '/app/district/incidents',
        '/app/viewer/alerts',
      ])
    );

    // Role homes themselves must remain registered.
    for (const home of [
      '/app/admin',
      '/app/district',
      '/app/field',
      '/app/logistics',
      '/app/viewer',
    ]) {
      expect(REGISTERED_APP_ROUTES).toContain(home);
      expect(deadNested).not.toContain(home);
    }
  });

  it('documents Navbar legacy paths that rely on redirects to /app/*', () => {
    const navbarSrc = readSrc('components/common/Navbar.jsx');
    for (const path of NAVBAR_LINK_PATHS) {
      expect(navbarSrc).toContain(`path: '${path}'`);
    }

    const appSrc = readSrc('App.jsx');
    expect(appSrc).toContain('path="/admin"');
    expect(appSrc).toContain('Navigate to="/app/admin"');
    expect(appSrc).toContain('path="/driver"');
    expect(appSrc).toContain('Navigate to="/app/field"');
  });

  it('AppShell source still advertises the audited nested path set', () => {
    const shellSrc = readSrc('components/layout/AppShell.jsx');
    for (const path of APPSHELL_ADVERTISED_PATHS) {
      expect(shellSrc).toContain(`path: '${path}'`);
    }
  });

  it('records duplicate navigation systems: AppShell Links vs activeTab dashboards', () => {
    const fieldSrc = readSrc('pages/FieldOfficerDashboard.jsx');
    const adminSrc = readSrc('pages/AdminDashboard.jsx');
    expect(fieldSrc.includes('activeTab')).toBe(true);
    expect(adminSrc.includes('setActiveTab')).toBe(true);
    expect(readSrc('components/layout/AppShell.jsx').includes(linkOpenTag)).toBe(true);
  });
});

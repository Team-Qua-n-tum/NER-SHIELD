/**
 * NER-SHIELD Unified Role Navigation Configuration
 *
 * Single source of truth for all role-based navigation.
 * Every declared path MUST match an exact registered React route.
 * No competing legacy navbar/sidebar systems.
 *
 * ⚠️ SECURITY NOTE: All frontend role filtering is UI-layer only.
 *    Backend API authorization and record-level scoping remain required.
 */
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Activity,
  Truck,
  Users,
  BarChart3,
  ClipboardList,
  FileText,
  Route,
  ShieldCheck,
  FilePlus,
  Clock,
  Navigation,
  Eye,
  Settings,
  HelpCircle,
  User,
  Bell,
  ShieldAlert,
} from 'lucide-react';

export const ROLE_NAV_CONFIG = {
  admin: [
    { path: '/app/admin/overview', label: 'Operations Overview', icon: LayoutDashboard },
    { path: '/app/admin/map', label: 'Operational Map', icon: Map },
    { path: '/app/admin/incidents', label: 'Incident Queue', icon: AlertTriangle },
    { path: '/app/admin/roads', label: 'Road Status', icon: Activity },
    { path: '/app/admin/fleet', label: 'Fleet Management', icon: Truck },
    { path: '/app/admin/users', label: 'User Access', icon: Users },
    { path: '/app/admin/data-health', label: 'Data Health', icon: BarChart3 },
    { path: '/app/admin/audit', label: 'Audit Log', icon: ClipboardList },
  ],
  district_officer: [
    { path: '/app/district/overview', label: 'District Overview', icon: LayoutDashboard },
    { path: '/app/district/map', label: 'District Map', icon: Map },
    { path: '/app/district/reports', label: 'Field Reports', icon: FileText },
    { path: '/app/district/roads', label: 'Road Status', icon: Activity },
    { path: '/app/district/routing', label: 'Emergency Routing', icon: Route },
    { path: '/app/district/alerts', label: 'District Alerts', icon: AlertTriangle },
  ],
  field_officer: [
    { path: '/app/field/home', label: 'Field Home', icon: LayoutDashboard },
    { path: '/app/field/report/new', label: 'Report Incident', icon: FilePlus, highlight: true },
    { path: '/app/field/reports', label: 'My Reports', icon: FileText },
    { path: '/app/field/map', label: 'Area Map', icon: Map },
    { path: '/app/field/safety', label: 'Safety Guidelines', icon: ShieldCheck },
  ],
  logistics_operator: [
    { path: '/app/logistics/overview', label: 'Fleet Overview', icon: LayoutDashboard },
    { path: '/app/logistics/routes/new', label: 'Route Planner', icon: Route, highlight: true },
    { path: '/app/logistics/routes/history', label: 'Route History', icon: Clock },
    { path: '/app/logistics/fleet', label: 'Fleet Management', icon: Truck },
    { path: '/app/logistics/alerts', label: 'Corridor Alerts', icon: AlertTriangle },
    { path: '/app/logistics/map', label: 'Network Map', icon: Map },
  ],
  viewer: [
    { path: '/app/viewer/overview', label: 'Status Overview', icon: Eye },
    { path: '/app/viewer/alerts', label: 'Public Advisories', icon: AlertTriangle },
  ],
};

export const COMMON_NAV_ITEMS = [
  { path: '/app/profile', label: 'User Profile', icon: User },
  { path: '/app/notifications', label: 'Notification Settings', icon: Bell },
  { path: '/app/help', label: 'Help & Operations', icon: HelpCircle },
];

/**
 * Returns navigation items for a given user role with dynamic badge values.
 */
export function getNavItemsForRole(role, badgeCounts = {}) {
  const items = ROLE_NAV_CONFIG[role] || ROLE_NAV_CONFIG.viewer;

  return items.map((item) => {
    let badge = undefined;
    let badgeColor = undefined;

    if (item.path.includes('/incidents') && badgeCounts.incidents > 0) {
      badge = badgeCounts.incidents;
      badgeColor = 'bg-amber-500';
    } else if (item.path.includes('/reports') && badgeCounts.unverifiedReports > 0) {
      badge = badgeCounts.unverifiedReports;
      badgeColor = 'bg-red-500';
    } else if (item.path.includes('/alerts') && badgeCounts.alerts > 0) {
      badge = badgeCounts.alerts;
      badgeColor = 'bg-amber-500';
    } else if (item.path.includes('/fleet') && badgeCounts.fleetActive > 0) {
      badge = `${badgeCounts.fleetActive} Active`;
      badgeColor = 'bg-cyan-600';
    }

    return {
      ...item,
      badge,
      badgeColor,
    };
  });
}

/** Flattened array of all declared sidebar route paths for integrity tests */
export const ALL_DECLARED_ROLE_PATHS = Object.values(ROLE_NAV_CONFIG)
  .flatMap((items) => items.map((item) => item.path));

export const ROLE_HOME_MAP = {
  admin: '/app/admin/overview',
  district_officer: '/app/district/overview',
  field_officer: '/app/field/home',
  logistics_operator: '/app/logistics/overview',
  viewer: '/app/viewer/overview',
};

export default ROLE_NAV_CONFIG;

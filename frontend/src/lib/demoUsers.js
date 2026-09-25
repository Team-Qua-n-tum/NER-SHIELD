/**
 * NER-SHIELD DEMO SESSION — Fake Demo Users
 *
 * ⚠️  WARNING: These are NOT real credentials and provide NO real security.
 *     This file exists purely for DEMO SESSION mode so the app can be
 *     demonstrated without a live backend auth service.
 *
 * ⚠️  SECURITY: All role checks in the frontend are UI-layer only.
 *     The backend MUST enforce authorization on every API endpoint
 *     using the session token. Frontend guards prevent accidental
 *     rendering of restricted UI — they do NOT prevent API access.
 *
 * When POST /api/v1/auth/login is available, this file becomes unused.
 */

export const isDemoModeEnabled = () =>
  import.meta.env?.VITE_DEMO_MODE === 'true' ||
  import.meta.env?.VITE_DEMO_MODE === true;

export const DEMO_MODE =
  import.meta.env?.VITE_DEMO_MODE === 'true' ||
  import.meta.env?.VITE_DEMO_MODE === true;

/**
 * Demo user records matching the expected backend /api/v1/auth/me shape.
 * Each has: id, name, email, role, district_ids, vehicle_ids, permissions
 */
export const DEMO_USERS = [
  {
    id: 'demo-admin-001',
    name: 'Col. Sanjeev Hazarika',
    email: 'admin@ner-shield.demo',
    role: 'admin',
    roleLabel: 'NER Logistics Command Director',
    department: 'Integrated Regional Command Center',
    district_ids: ['*'], // admin sees all districts
    vehicle_ids: ['*'],  // admin sees all vehicles
    permissions: [
      'admin:full',
      'incident:read', 'incident:create', 'incident:verify', 'incident:resolve',
      'vehicle:read', 'vehicle:manage',
      'route:read', 'route:plan',
      'alert:read', 'alert:broadcast',
      'user:manage',
      'audit:read',
    ],
    homePath: '/app/admin/overview',
    demoPassword: 'demo',
  },
  {
    id: 'demo-district-001',
    name: 'Inspector Debajit Barman',
    email: 'district@ner-shield.demo',
    role: 'district_officer',
    roleLabel: 'District Disaster Management Officer',
    department: 'Kamrup Metropolitan DDMA',
    district_ids: ['dist-guwahati', 'dist-kamrup'],
    vehicle_ids: [],
    permissions: [
      'incident:read', 'incident:verify',
      'road:update_status',
      'route:plan',
      'alert:read',
      'district:read_assigned',
    ],
    homePath: '/app/district/overview',
    demoPassword: 'demo',
  },
  {
    id: 'demo-field-001',
    name: 'Ramesh Kumar',
    email: 'field@ner-shield.demo',
    role: 'field_officer',
    roleLabel: 'Field Patrol Officer',
    department: 'NER Highway Patrol — Dima Hasao',
    district_ids: ['dist-dima-hasao'],
    vehicle_ids: ['VEH-101'],
    permissions: [
      'incident:create', 'incident:read_own',
      'alert:read',
    ],
    homePath: '/app/field/home',
    demoPassword: 'demo',
  },
  {
    id: 'demo-logistics-001',
    name: 'N. Debbarma',
    email: 'logistics@ner-shield.demo',
    role: 'logistics_operator',
    roleLabel: 'NER Supply & Freight Logistics Director',
    department: 'Civil Supplies & Emergency Stockpiles',
    district_ids: [],
    vehicle_ids: ['VEH-101', 'VEH-102', 'VEH-103', 'VEH-104'],
    permissions: [
      'vehicle:read_assigned',
      'route:read', 'route:plan', 'route:recalculate',
      'alert:read',
    ],
    homePath: '/app/logistics/overview',
    demoPassword: 'demo',
  },
  {
    id: 'demo-viewer-001',
    name: 'Public Viewer',
    email: 'viewer@ner-shield.demo',
    role: 'viewer',
    roleLabel: 'Public Status Viewer',
    department: 'General Public',
    district_ids: [],
    vehicle_ids: [],
    permissions: [
      'alert:read_public',
    ],
    homePath: '/app/viewer/overview',
    demoPassword: 'demo',
  },
];

/** Map old role aliases to new role names */
export const ROLE_ALIAS_MAP = {
  admin: 'admin',
  driver: 'field_officer',
  officer: 'district_officer',
  supply: 'logistics_operator',
  viewer: 'viewer',
  // new names pass through
  district_officer: 'district_officer',
  field_officer: 'field_officer',
  logistics_operator: 'logistics_operator',
};

/** Role display metadata */
export const ROLE_META = {
  admin: {
    label: 'Admin Command',
    color: 'indigo',
    bgClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    description: 'Full system access',
  },
  district_officer: {
    label: 'District Officer',
    color: 'amber',
    bgClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Assigned district access',
  },
  field_officer: {
    label: 'Field Officer',
    color: 'emerald',
    bgClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Incident reporting access',
  },
  logistics_operator: {
    label: 'Logistics Operator',
    color: 'cyan',
    bgClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Fleet & route access',
  },
  viewer: {
    label: 'Viewer',
    color: 'slate',
    bgClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    description: 'Read-only public view',
  },
};

/**
 * Look up a demo user by email (case-insensitive).
 * Returns null if not found — never throws.
 */
export function findDemoUserByEmail(email) {
  return DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  ) || null;
}

/**
 * Validate demo credentials (email + password).
 * Always returns null if DEMO_MODE is false.
 * ⚠️ NOT REAL SECURITY — demo only.
 */
export function validateDemoCredentials(email, password) {
  if (!isDemoModeEnabled()) return null;
  const user = findDemoUserByEmail(email);
  if (!user) return null;
  if (password !== user.demoPassword) return null;
  return user;
}

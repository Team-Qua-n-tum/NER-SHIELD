/**
 * RoleBadge
 * Displays a colored, labeled badge for a given role name.
 * Used in topbar, sidebar, user profiles, and login screens.
 */
import React from 'react';
import { Shield, MapPin, Radio, Package, Eye } from 'lucide-react';
import { ROLE_META } from '../../lib/demoUsers';

const ROLE_ICONS = {
  admin: Shield,
  district_officer: MapPin,
  field_officer: Radio,
  logistics_operator: Package,
  viewer: Eye,
};

export const RoleBadge = ({ role, size = 'sm', showIcon = true, className = '' }) => {
  const meta = ROLE_META[role] || {
    label: role || 'Unknown',
    bgClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  };
  const Icon = ROLE_ICONS[role];

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1 gap-2',
  };

  const iconSizes = { xs: 'w-2.5 h-2.5', sm: 'w-3 h-3', md: 'w-4 h-4' };

  return (
    <span
      data-testid="role-badge"
      data-role={role}
      className={`inline-flex items-center rounded-lg border font-semibold ${meta.bgClass} ${sizeClasses[size] || sizeClasses.sm} ${className}`}
    >
      {showIcon && Icon && <Icon className={iconSizes[size] || iconSizes.sm} />}
      {meta.label}
    </span>
  );
};

export default RoleBadge;

/**
 * DataModeBadge
 *
 * Truthfully communicates backend data quality to the user.
 * Never labels demo/mock data as "live".
 *
 * Modes:
 *   LIVE          — Real-time data from backend
 *   LIVE_STALE    — Connected but data freshness degraded
 *   DEGRADED      — Backend reachable but serving cached data
 *   DEMO          — Synthetic demo data (not real)
 *   UNAVAILABLE   — Cannot reach backend at all
 *   OFFLINE       — Browser offline, showing last-known data
 */
import React from 'react';
import { Wifi, WifiOff, AlertCircle, Database, FlaskConical, Activity } from 'lucide-react';

const MODE_CONFIG = {
  LIVE: {
    label: 'LIVE DATA',
    icon: Activity,
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400 animate-pulse',
  },
  LIVE_STALE: {
    label: 'LIVE — STALE',
    icon: Activity,
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  DEGRADED: {
    label: 'DEGRADED — CACHED DATA',
    icon: Database,
    classes: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-400',
  },
  DEMO: {
    label: 'DEMO — SYNTHETIC DATA',
    icon: FlaskConical,
    classes: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400 animate-pulse',
  },
  UNAVAILABLE: {
    label: 'DATA UNAVAILABLE',
    icon: AlertCircle,
    classes: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot: 'bg-red-400',
  },
  OFFLINE: {
    label: 'OFFLINE — LAST DATA SHOWN',
    icon: WifiOff,
    classes: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
  },
};

export const DataModeBadge = ({ mode = 'LIVE', className = '' }) => {
  const config = MODE_CONFIG[mode] || MODE_CONFIG.UNAVAILABLE;
  const Icon = config.icon;

  return (
    <span
      data-testid="data-mode-badge"
      data-mode={mode}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold font-mono tracking-wide ${config.classes} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export default DataModeBadge;

import React from 'react';

export const StatusIndicator = ({
  status = 'active', // active | blocked | warning | restricted | offline
  pulse = true,
  label,
  className = '',
}) => {
  const statusColors = {
    active: 'status-dot-emerald',
    open: 'status-dot-emerald',
    success: 'status-dot-emerald',
    blocked: 'status-dot-rose',
    critical: 'status-dot-rose',
    danger: 'status-dot-rose',
    warning: 'status-dot-amber',
    restricted: 'status-dot-amber',
    moderate: 'status-dot-amber',
    info: 'status-dot-blue',
    offline: 'status-dot-slate',
  };

  const dotClass = statusColors[status.toLowerCase()] || 'status-dot-emerald';

  return (
    <div className={`status-indicator-wrapper ${className}`}>
      <span className={`status-dot ${dotClass} ${pulse ? 'status-dot-pulse' : ''}`} />
      {label && <span className="status-indicator-label">{label}</span>}
    </div>
  );
};

export default StatusIndicator;

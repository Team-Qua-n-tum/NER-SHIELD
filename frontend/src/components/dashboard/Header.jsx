import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  RefreshCw,
  Clock,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StatusIndicator } from '../ui/StatusIndicator';

export const Header = ({
  onRefresh,
  isRefreshing = false,
  onOpenReportModal,
  activeAlertsCount = 0,
  emergencyMode = false,
  onToggleEmergencyMode,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata',
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={`cmd-header ${emergencyMode ? 'cmd-header-emergency' : ''}`}>
      {/* Top Banner for Emergency Mode if triggered */}
      {emergencyMode && (
        <div className="emergency-banner-bar">
          <div className="emergency-banner-content">
            <AlertTriangle className="emergency-banner-icon" />
            <span>
              <strong>LEVEL-1 LOGISTICS EMERGENCY DECLARED:</strong> Priority dispatch active for Essential Medical Supplies & Flood Relief kits across Dima Hasao & Barak Valley corridors.
            </span>
          </div>
          <button onClick={onToggleEmergencyMode} className="emergency-banner-dismiss">
            Stand Down
          </button>
        </div>
      )}

      <div className="cmd-header-inner">
        {/* Brand & Identity */}
        <div className="cmd-brand-container">
          <div className="cmd-brand-logo-box">
            <ShieldAlert className="cmd-brand-logo" />
          </div>
          <div className="cmd-brand-info">
            <div className="cmd-brand-title-row">
              <h1 className="cmd-brand-title">NER-SHIELD</h1>
              <Badge variant="primary" size="sm">SIH26002</Badge>
              <Badge variant={emergencyMode ? 'critical' : activeAlertsCount > 0 ? 'critical' : 'success'} size="sm">
                {emergencyMode
                  ? 'EMERGENCY PROTOCOL ACTIVE'
                  : activeAlertsCount > 0
                  ? `${activeAlertsCount} ACTIVE HAZARDS`
                  : 'DISASTER LOGISTICS COMMAND'}
              </Badge>
            </div>
            <p className="cmd-brand-subtitle">
              Smart Logistics & Accessibility Intelligence Platform — North Eastern Region (8 States)
            </p>
          </div>
        </div>

        {/* Live Operational Status & Actions */}
        <div className="cmd-header-controls">
          {/* Time & Telemetry status */}
          <div className="cmd-telemetry-badge">
            <div className="cmd-time-row">
              <Clock className="cmd-telemetry-icon text-slate" />
              <span className="cmd-time-text">{timeStr || '24 Aug 2026, 19:30 IST'}</span>
            </div>
            <div className="cmd-sync-row">
              <StatusIndicator status="active" label="Live Telemetry Sync" />
              <span className="cmd-ping-badge">42ms</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cmd-actions-group">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              isLoading={isRefreshing}
              onClick={onRefresh}
              title="Refresh all real-time feeds"
            >
              Refresh
            </Button>

            <Button
              variant={emergencyMode ? 'danger' : 'outline'}
              size="sm"
              icon={Radio}
              onClick={onToggleEmergencyMode}
              className={emergencyMode ? 'pulse-emergency-btn' : ''}
            >
              {emergencyMode ? 'Emergency Active' : 'Level-1 Emergency'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={onOpenReportModal}
              className="report-incident-btn"
            >
              Field Report
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

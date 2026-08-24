import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Waves,
  Mountain,
  CloudRain,
  ClockAlert,
  ShieldAlert,
  ArrowRight,
  Check,
  CheckCircle2,
  Filter,
  MapPin,
  Compass,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

export const AlertPanel = ({
  alerts = [],
  onDismissAlert,
  onLocateAlert,
  onActionClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  const filteredAlerts = alerts.filter((alert) => {
    const matchesCategory =
      selectedCategory === 'ALL' || alert.category === selectedCategory;
    const matchesSeverity =
      selectedSeverity === 'ALL' || alert.severity.toUpperCase() === selectedSeverity;
    return matchesCategory && matchesSeverity;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'BLOCKED_ROAD':
        return <AlertOctagon className="alert-cat-icon text-rose" />;
      case 'LANDSLIDE':
        return <Mountain className="alert-cat-icon text-rose" />;
      case 'FLOOD':
        return <Waves className="alert-cat-icon text-blue" />;
      case 'HEAVY_RAINFALL':
        return <CloudRain className="alert-cat-icon text-amber" />;
      case 'DELAYED_DELIVERY':
        return <ClockAlert className="alert-cat-icon text-rose" />;
      case 'HIGH_RISK_ROUTE':
        return <ShieldAlert className="alert-cat-icon text-purple" />;
      default:
        return <AlertTriangle className="alert-cat-icon text-amber" />;
    }
  };

  const getSeverityBadgeVariant = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'moderate':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card
      title="Disaster & Road Disruption Alert Center"
      subtitle="Actionable hazard intelligence and recommended administrative interventions"
      icon={AlertTriangle}
      className="alerts-panel-card"
    >
      {/* Category & Severity Filter Tabs */}
      <div className="alerts-filter-bar">
        <div className="filter-group">
          <span className="filter-label">Hazard Category:</span>
          <div className="filter-button-group">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`filter-btn ${selectedCategory === 'ALL' ? 'filter-btn-active' : ''}`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setSelectedCategory('BLOCKED_ROAD')}
              className={`filter-btn ${selectedCategory === 'BLOCKED_ROAD' ? 'filter-btn-active' : ''}`}
            >
              🛑 Blocked Roads
            </button>
            <button
              onClick={() => setSelectedCategory('FLOOD')}
              className={`filter-btn ${selectedCategory === 'FLOOD' ? 'filter-btn-active' : ''}`}
            >
              🌊 Flood
            </button>
            <button
              onClick={() => setSelectedCategory('DELAYED_DELIVERY')}
              className={`filter-btn ${selectedCategory === 'DELAYED_DELIVERY' ? 'filter-btn-active' : ''}`}
            >
              ⏱️ Delayed Delivery
            </button>
            <button
              onClick={() => setSelectedCategory('HEAVY_RAINFALL')}
              className={`filter-btn ${selectedCategory === 'HEAVY_RAINFALL' ? 'filter-btn-active' : ''}`}
            >
              🌧️ Rainfall / Fog
            </button>
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Severity:</span>
          <div className="filter-button-group">
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`filter-btn ${selectedSeverity === sev ? 'filter-btn-active' : ''}`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="alerts-list-container">
        {filteredAlerts.length === 0 ? (
          <EmptyState
            title="No Active Alerts Found"
            description="No current hazards match the selected category or severity level."
          />
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'Critical';

            return (
              <div
                key={alert.id}
                className={`alert-item-card ${isCritical ? 'alert-item-critical' : ''}`}
              >
                {/* Header Row */}
                <div className="alert-item-header">
                  <div className="alert-title-row">
                    <div className="alert-cat-box">{getCategoryIcon(alert.category)}</div>
                    <div>
                      <h4 className="alert-title">{alert.title}</h4>
                      <div className="alert-meta-row">
                        <span className="alert-location">
                          <MapPin className="alert-meta-icon text-rose" />
                          {alert.location} ({alert.state})
                        </span>
                        <span className="alert-time">{alert.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="alert-header-badges">
                    <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                      {alert.severity} SEVERITY
                    </Badge>
                  </div>
                </div>

                {/* Description & Impact */}
                <div className="alert-description-text">{alert.description}</div>
                {alert.impact && (
                  <div className="alert-impact-box">
                    <strong>Logistics Impact:</strong> {alert.impact}
                  </div>
                )}

                {/* Official Action Recommendation */}
                {alert.recommendedAction && (
                  <div className="alert-action-recommendation-box">
                    <div className="rec-box-title">
                      <Compass className="rec-icon" />
                      <span>RECOMMENDED OFFICIAL ACTION:</span>
                    </div>
                    <p className="rec-box-text">{alert.recommendedAction}</p>
                  </div>
                )}

                {/* Affected Commodities & Clearance Status */}
                <div className="alert-footer-row">
                  <div className="affected-commodities-row">
                    <span className="commodities-label">Affected:</span>
                    {alert.affectedCommodities?.map((c) => (
                      <Badge key={c} variant="default" size="sm">
                        {c}
                      </Badge>
                    ))}
                    {alert.clearanceStatus && (
                      <span className="clearance-status-tag">
                        Status: {alert.clearanceStatus}
                      </span>
                    )}
                  </div>

                  <div className="alert-action-btns">
                    {onLocateAlert && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={MapPin}
                        onClick={() => onLocateAlert(alert)}
                      >
                        Locate
                      </Button>
                    )}
                    {onDismissAlert && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Check}
                        onClick={() => onDismissAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default AlertPanel;

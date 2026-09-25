import React from 'react';
import {
  Flame,
  Mountain,
  Waves,
  CloudRain,
  Wrench,
  PlusCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const IncidentSummary = ({
  incidents = [],
  onOpenReportModal,
  onLocateIncident,
}) => {
  const typeCounts = {
    Landslide: incidents.filter((i) => i.type === 'Landslide').length,
    Flood: incidents.filter((i) => i.type === 'Flood').length,
    Weather: incidents.filter((i) => i.type === 'Weather').length,
    Roadwork: incidents.filter((i) => i.type === 'Roadwork').length,
  };

  return (
    <Card
      title="Field Incidents & Disaster Response Summary"
      subtitle="Ground disruption intelligence reported by Border Roads Org, NDRF and state patrols"
      icon={Flame}
      action={
        <Button
          size="sm"
          variant="primary"
          icon={PlusCircle}
          onClick={onOpenReportModal}
        >
          Submit Field Report
        </Button>
      }
      className="incident-summary-panel"
    >
      {/* Metrics Breakdown */}
      <div className="incident-stats-grid">
        <div className="inc-stat-box">
          <div className="inc-stat-header">
            <Mountain className="inc-type-icon text-rose" />
            <span className="inc-stat-title">Landslides</span>
          </div>
          <div className="inc-stat-val text-rose">{typeCounts.Landslide}</div>
          <span className="inc-stat-sub">Dima Hasao NH-6 Pass</span>
        </div>

        <div className="inc-stat-box">
          <div className="inc-stat-header">
            <Waves className="inc-type-icon text-blue" />
            <span className="inc-stat-title">Floods / Submerged</span>
          </div>
          <div className="inc-stat-val text-blue">{typeCounts.Flood}</div>
          <span className="inc-stat-sub">Barak Valley Silchar</span>
        </div>

        <div className="inc-stat-box">
          <div className="inc-stat-header">
            <CloudRain className="inc-type-icon text-amber" />
            <span className="inc-stat-title">Weather Hazards</span>
          </div>
          <div className="inc-stat-val text-amber">{typeCounts.Weather}</div>
          <span className="inc-stat-sub">Dense Fog on Gradients</span>
        </div>

        <div className="inc-stat-box">
          <div className="inc-stat-header">
            <Wrench className="inc-type-icon text-purple" />
            <span className="inc-stat-title">Roadwork / Repairs</span>
          </div>
          <div className="inc-stat-val text-purple">{typeCounts.Roadwork}</div>
          <span className="inc-stat-sub">Kohima Bypass Bridge</span>
        </div>
      </div>

      {/* Recent Incidents Feed */}
      <div className="incidents-feed-list">
        <h4 className="feed-title">Active Ground Disruption Register</h4>
        {incidents.map((incident) => {
          return (
            <div key={incident.id} className="incident-row-item">
              <div className="incident-row-left">
                <div className="incident-id-badge">{incident.id}</div>
                <div>
                  <h5 className="incident-row-title">{incident.title}</h5>
                  <div className="incident-row-meta">
                    <span>{incident.location} ({incident.district}, {incident.state})</span>
                    <span>•</span>
                    <span className="reported-by-tag">{incident.verifiedBy}</span>
                  </div>
                  <p className="incident-row-impact">{incident.impact}</p>
                </div>
              </div>

              <div className="incident-row-right">
                <Badge
                  variant={
                    incident.severity === 'Critical'
                      ? 'critical'
                      : incident.severity === 'High'
                      ? 'high'
                      : 'warning'
                  }
                  size="sm"
                >
                  {incident.severity}
                </Badge>
                <div className="clearance-time">
                  <Clock className="clearance-icon" />
                  <span>Est: {incident.estimatedClearance}</span>
                </div>
                {onLocateIncident && (
                  <Button
                    size="sm"
                    variant="ghost"
                    iconRight={ArrowUpRight}
                    onClick={() => onLocateIncident(incident)}
                  >
                    Map
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default IncidentSummary;

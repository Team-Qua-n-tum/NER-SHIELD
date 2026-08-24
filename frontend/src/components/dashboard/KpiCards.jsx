import React from 'react';
import {
  Building2,
  CheckCircle2,
  AlertOctagon,
  Flame,
  Truck,
  ShieldAlert,
  ClockAlert,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const KpiCards = ({
  metrics = {},
  onSelectKpi,
  activeFilter = null,
}) => {
  const {
    districtsMonitored = 8,
    totalDistricts = 8,
    roadsOpen = 15,
    roadsTotal = 19,
    roadsDisrupted = 3,
    activeIncidents = 4,
    vehiclesInTransit = 4,
    highRiskCorridors = 3,
    delayedDeliveries = 2,
  } = metrics;

  const openRoadsPercentage = Math.round((roadsOpen / (roadsTotal || 1)) * 100);

  const kpis = [
    {
      id: 'districts',
      title: 'Districts Monitored',
      value: `${districtsMonitored} / ${totalDistricts}`,
      subtext: '8 NER States Covered',
      icon: Building2,
      trend: '100% telemetry active',
      variant: 'default',
      highlightColor: 'text-blue',
      badge: 'Surveillance Active',
      badgeVariant: 'info',
    },
    {
      id: 'roads-open',
      title: 'Roads Open',
      value: `${roadsOpen} / ${roadsTotal}`,
      subtext: `${openRoadsPercentage}% Corridors Traversable`,
      icon: CheckCircle2,
      trend: 'Normal flow on NH-27',
      variant: 'default',
      highlightColor: 'text-emerald',
      badge: `${openRoadsPercentage}% Open`,
      badgeVariant: 'success',
    },
    {
      id: 'roads-disrupted',
      title: 'Roads Disrupted',
      value: roadsDisrupted,
      subtext: 'Physical blockage / submerge',
      icon: AlertOctagon,
      trend: 'Dima Hasao NH-6 Blocked',
      variant: 'critical',
      highlightColor: 'text-rose',
      badge: 'Action Required',
      badgeVariant: 'critical',
    },
    {
      id: 'active-incidents',
      title: 'Active Incidents',
      value: activeIncidents,
      subtext: 'Landslide, Flood & Fog',
      icon: Flame,
      trend: '2 Clearance crews active',
      variant: 'warning',
      highlightColor: 'text-amber',
      badge: 'Live Operations',
      badgeVariant: 'high',
    },
    {
      id: 'vehicles',
      title: 'Vehicles in Transit',
      value: vehiclesInTransit,
      subtext: 'Tracked logistics fleet',
      icon: Truck,
      trend: 'GPS & Telemetry active',
      variant: 'default',
      highlightColor: 'text-purple',
      badge: 'Fleet Live',
      badgeVariant: 'default',
    },
    {
      id: 'high-risk',
      title: 'High-Risk Corridors',
      value: highRiskCorridors,
      subtext: 'Severe landslide hazard zones',
      icon: ShieldAlert,
      trend: 'Heavy rainfall alert',
      variant: 'warning',
      highlightColor: 'text-amber',
      badge: 'Advisory Active',
      badgeVariant: 'high',
    },
    {
      id: 'delayed-deliveries',
      title: 'Delayed Deliveries',
      value: delayedDeliveries,
      subtext: 'Impacted essential cargo',
      icon: ClockAlert,
      trend: 'Vaccine shipment rerouted',
      variant: 'critical',
      highlightColor: 'text-rose',
      badge: 'Priority Reroute',
      badgeVariant: 'critical',
    },
  ];

  return (
    <div className="kpi-cards-grid">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeFilter === kpi.id;

        return (
          <div
            key={kpi.id}
            className={`kpi-card ${isSelected ? 'kpi-card-active' : ''} kpi-card-${kpi.variant}`}
            onClick={() => onSelectKpi && onSelectKpi(kpi.id)}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
          >
            <div className="kpi-card-top">
              <div className="kpi-card-icon-wrapper">
                <Icon className={`kpi-card-icon ${kpi.highlightColor}`} />
              </div>
              <Badge variant={kpi.badgeVariant} size="sm">
                {kpi.badge}
              </Badge>
            </div>

            <div className="kpi-card-body">
              <div className="kpi-card-value">{kpi.value}</div>
              <div className="kpi-card-title">{kpi.title}</div>
              <div className="kpi-card-subtext">{kpi.subtext}</div>
            </div>

            <div className="kpi-card-footer">
              <span className="kpi-trend-text">{kpi.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiCards;

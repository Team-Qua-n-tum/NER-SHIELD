import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  Radio,
  Phone,
  Thermometer,
  Fuel,
  Navigation,
  AlertTriangle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { CommodityMetadata } from '../../lib/types';

export const VehicleStatus = ({
  vehicles = [],
  onSelectVehicle,
  onRerouteVehicle,
  selectedVehicleId,
}) => {
  const [filterCommodity, setFilterCommodity] = useState('ALL');

  const filteredVehicles = vehicles.filter((v) => {
    if (filterCommodity === 'ALL') return true;
    return v.commodity === filterCommodity;
  });

  const getStatusBadge = (statusCategory, statusText) => {
    switch (statusCategory) {
      case 'DELAYED':
        return <Badge variant="critical" icon={AlertTriangle}>{statusText || 'Delayed'}</Badge>;
      case 'CAUTION':
        return <Badge variant="warning" icon={AlertTriangle}>{statusText || 'Caution'}</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="success" icon={Truck}>{statusText || 'In Transit'}</Badge>;
      default:
        return <Badge variant="info">{statusText || 'Active'}</Badge>;
    }
  };

  return (
    <Card
      title="Logistics Fleet & Essential Supply Telemetry"
      subtitle="Real-time vehicle tracking, cold-chain sensor monitoring, and active reroute dispatches"
      icon={Truck}
      className="vehicle-status-panel"
    >
      {/* Filter Tabs */}
      <div className="fleet-filter-bar">
        <div className="filter-label">Filter Cargo:</div>
        <div className="filter-button-group">
          <button
            onClick={() => setFilterCommodity('ALL')}
            className={`filter-btn ${filterCommodity === 'ALL' ? 'filter-btn-active' : ''}`}
          >
            All Fleet ({vehicles.length})
          </button>
          <button
            onClick={() => setFilterCommodity('MEDICINE')}
            className={`filter-btn ${filterCommodity === 'MEDICINE' ? 'filter-btn-active' : ''}`}
          >
            💊 Medicine ({vehicles.filter((v) => v.commodity === 'MEDICINE').length})
          </button>
          <button
            onClick={() => setFilterCommodity('FOOD')}
            className={`filter-btn ${filterCommodity === 'FOOD' ? 'filter-btn-active' : ''}`}
          >
            🍞 Emergency Food ({vehicles.filter((v) => v.commodity === 'FOOD').length})
          </button>
          <button
            onClick={() => setFilterCommodity('AGRICULTURAL')}
            className={`filter-btn ${filterCommodity === 'AGRICULTURAL' ? 'filter-btn-active' : ''}`}
          >
            🥬 Agri Produce ({vehicles.filter((v) => v.commodity === 'AGRICULTURAL').length})
          </button>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="fleet-cards-grid">
        {filteredVehicles.map((vehicle) => {
          const isSelected = selectedVehicleId === vehicle.id;
          const isDelayed = vehicle.statusCategory === 'DELAYED';
          const commodityInfo = CommodityMetadata[vehicle.commodity] || CommodityMetadata.GENERAL;

          return (
            <div
              key={vehicle.id}
              className={`vehicle-card ${isSelected ? 'vehicle-card-selected' : ''} ${
                isDelayed ? 'vehicle-card-delayed' : ''
              }`}
              onClick={() => onSelectVehicle && onSelectVehicle(vehicle)}
            >
              {/* Top Row: Vehicle ID, Registration & Status */}
              <div className="vehicle-card-top">
                <div className="vehicle-identity">
                  <div className="vehicle-icon-box">
                    <Truck className="vehicle-icon" />
                  </div>
                  <div>
                    <h4 className="vehicle-id">{vehicle.id}</h4>
                    <span className="vehicle-reg">{vehicle.registration}</span>
                  </div>
                </div>
                {getStatusBadge(vehicle.statusCategory, vehicle.status)}
              </div>

              {/* Cargo & Criticality */}
              <div className="vehicle-cargo-box">
                <div className="cargo-type-row">
                  <span className="cargo-icon">{commodityInfo.icon}</span>
                  <span className="cargo-title">{vehicle.cargo}</span>
                </div>
                <Badge variant={commodityInfo.criticality === 'CRITICAL' ? 'critical' : 'default'} size="sm">
                  {commodityInfo.label}
                </Badge>
              </div>

              {/* Origin -> Destination Route */}
              <div className="vehicle-route-row">
                <div className="route-endpoint">
                  <MapPin className="endpoint-icon text-blue" />
                  <span>{vehicle.origin}</span>
                </div>
                <ArrowRight className="route-arrow" />
                <div className="route-endpoint">
                  <MapPin className="endpoint-icon text-emerald" />
                  <span>{vehicle.destination}</span>
                </div>
              </div>

              {/* Driver & Telemetry Specs */}
              <div className="vehicle-telemetry-grid">
                <div className="telemetry-item">
                  <span className="tel-label">Driver</span>
                  <span className="tel-val">{vehicle.driverName}</span>
                </div>
                <div className="telemetry-item">
                  <span className="tel-label">Speed</span>
                  <span className="tel-val text-emerald">{vehicle.speedKmH} km/h</span>
                </div>
                <div className="telemetry-item">
                  <span className="tel-label">Heading</span>
                  <span className="tel-val">{vehicle.heading}</span>
                </div>
                <div className="telemetry-item">
                  <span className="tel-label">Temp Sensor</span>
                  <span className="tel-val text-blue">{vehicle.temperatureSensor || 'Ambient'}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="vehicle-card-footer">
                <span className="signal-time">
                  <Clock className="signal-icon" />
                  Signal: {vehicle.lastSignal}
                </span>

                <div className="vehicle-action-buttons">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Navigation}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectVehicle) onSelectVehicle(vehicle);
                    }}
                  >
                    Locate on Map
                  </Button>

                  {isDelayed && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRerouteVehicle) onRerouteVehicle(vehicle);
                      }}
                    >
                      Reroute
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default VehicleStatus;

import React, { useState } from 'react';
import {
  Building2,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const DistrictConnectivity = ({
  districts = [],
  onSelectDistrict,
  selectedDistrictId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredDistricts = districts.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || d.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FULL_ACCESS':
        return <Badge variant="success">100% Accessible</Badge>;
      case 'RESTRICTED':
        return <Badge variant="warning">Restricted Corridors</Badge>;
      case 'CRITICAL_BOTTLENECK':
        return <Badge variant="high">Bottleneck Risk</Badge>;
      case 'ISOLATED':
        return <Badge variant="critical">Road Access Severed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getAccessibilityColor = (score) => {
    if (score >= 80) return 'text-emerald';
    if (score >= 50) return 'text-amber';
    return 'text-rose';
  };

  return (
    <Card
      title="District Connectivity & Accessibility Matrix"
      subtitle="Real-time isolation risk and essential supply buffer index across North Eastern Region"
      icon={Building2}
      className="district-connectivity-panel"
    >
      {/* Controls Bar */}
      <div className="table-controls-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search district or state (e.g. Dima Hasao, Meghalaya)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-button-group">
          {['ALL', 'FULL_ACCESS', 'RESTRICTED', 'CRITICAL_BOTTLENECK', 'ISOLATED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`filter-btn ${filterStatus === st ? 'filter-btn-active' : ''}`}
            >
              {st === 'ALL'
                ? 'All Districts'
                : st.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Districts */}
      <div className="districts-matrix-grid">
        {filteredDistricts.map((district) => {
          const isSelected = selectedDistrictId === district.id;
          const isIsolated = district.status === 'ISOLATED';
          const isBufferLow = district.criticalSupplyBufferDays <= 3.0;

          return (
            <div
              key={district.id}
              className={`district-card ${isSelected ? 'district-card-selected' : ''} ${
                isIsolated ? 'district-card-isolated' : ''
              }`}
              onClick={() => onSelectDistrict && onSelectDistrict(district)}
            >
              <div className="district-card-header">
                <div>
                  <h4 className="district-name">{district.name}</h4>
                  <span className="district-state">{district.state}</span>
                </div>
                {getStatusBadge(district.status)}
              </div>

              <div className="district-metrics-row">
                <div className="metric-col">
                  <span className="col-label">Accessibility Index</span>
                  <span className={`col-val ${getAccessibilityColor(district.accessibilityScore)}`}>
                    {district.accessibilityScore}%
                  </span>
                </div>

                <div className="metric-col">
                  <span className="col-label">Corridors</span>
                  <span className="col-val text-slate">
                    <span className="text-emerald">{district.activeCorridors} Open</span>
                    {district.blockedCorridors > 0 && (
                      <span className="text-rose"> / {district.blockedCorridors} Blocked</span>
                    )}
                  </span>
                </div>

                <div className="metric-col">
                  <span className="col-label">Supply Buffer</span>
                  <span className={`col-val ${isBufferLow ? 'text-rose font-bold' : 'text-slate'}`}>
                    {district.criticalSupplyBufferDays} Days
                  </span>
                </div>
              </div>

              {/* Progress bar for supply buffer */}
              <div className="buffer-bar-container">
                <div className="buffer-bar-label-row">
                  <span>Emergency Supply Rations</span>
                  <span>{district.criticalSupplyBufferDays} / 14 days standard</span>
                </div>
                <div className="buffer-bar-track">
                  <div
                    className={`buffer-bar-fill ${
                      district.criticalSupplyBufferDays > 7
                        ? 'buffer-green'
                        : district.criticalSupplyBufferDays > 3
                        ? 'buffer-amber'
                        : 'buffer-red'
                    }`}
                    style={{
                      width: `${Math.min(100, (district.criticalSupplyBufferDays / 14) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="district-card-footer">
                <span className="hub-desc">{district.keyHub}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  iconRight={ArrowUpRight}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectDistrict) onSelectDistrict(district);
                  }}
                >
                  Locate
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default DistrictConnectivity;

import React, { useState } from 'react';
import {
  Route,
  Navigation,
  Compass,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  MapPin,
  ArrowRight,
  Shield,
  Zap,
  Sparkles,
  Layers,
  Send,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CommodityPriority, CommodityMetadata } from '../../lib/types';
import { routesApi } from '../../lib/api/routesApi';

export const RouteRecommendations = ({
  recommendationData,
  onSelectRouteOnMap,
  onDispatchReroute,
  selectedRouteId,
}) => {
  const [source, setSource] = useState('dist-guwahati');
  const [destination, setDestination] = useState('dist-imphal');
  const [commodity, setCommodity] = useState('MEDICINE');
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState(recommendationData);

  const locations = [
    { id: 'dist-guwahati', name: 'Guwahati Logistics Gateway (Assam)' },
    { id: 'dist-shillong', name: 'Shillong Central Hub (Meghalaya)' },
    { id: 'dist-silchar', name: 'Silchar Distribution Depot (Assam)' },
    { id: 'dist-dimapur', name: 'Dimapur Freight Railhead (Nagaland)' },
    { id: 'dist-kohima', name: 'Kohima Supply Checkpoint (Nagaland)' },
    { id: 'dist-imphal', name: 'Imphal Valley Relief Hub (Manipur)' },
    { id: 'dist-agartala', name: 'Agartala Station (Tripura)' },
    { id: 'dist-itanagar', name: 'Itanagar Access Depot (Arunachal)' },
  ];

  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
      const res = await routesApi.recommendRoute({
        source,
        destination,
        commodity,
      });
      setActiveRecommendation(res);
    } catch (err) {
      console.error('Failed to calculate route:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const currentCommodityMeta = CommodityMetadata[commodity] || CommodityMetadata.MEDICINE;
  const rec = activeRecommendation?.recommended;
  const prim = activeRecommendation?.primary;

  return (
    <Card
      title="AI Risk-Aware Route Optimizer & Multi-Commodity Engine"
      subtitle="Dynamic ETA calculation, disruption risk avoidance, and terrain-sensitive corridor routing"
      icon={Route}
      className="route-recommendations-panel"
    >
      {/* Route Parameters Selection Grid */}
      <div className="route-controls-grid">
        <div className="route-input-group">
          <label className="route-input-label">Origin Hub</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="route-select-box"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="route-input-group">
          <label className="route-input-label">Destination Depot</label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="route-select-box"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="route-input-group">
          <label className="route-input-label">Commodity Priority Type</label>
          <select
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            className="route-select-box commodity-select"
          >
            {Object.entries(CommodityMetadata).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.icon} {meta.label} (Risk Multiplier: {meta.riskMultiplier}x)
              </option>
            ))}
          </select>
        </div>

        <div className="route-input-group button-group-end">
          <Button
            variant="primary"
            icon={Sparkles}
            isLoading={isCalculating}
            onClick={handleRecalculate}
            className="calculate-route-btn"
          >
            Compute AI Route
          </Button>
        </div>
      </div>

      {/* Commodity Sensitivity Info Banner */}
      <div className="commodity-notice-banner">
        <div className="notice-left">
          <span className="notice-icon">{currentCommodityMeta.icon}</span>
          <div>
            <strong>COMMODITY CRITICALITY: {currentCommodityMeta.criticality}</strong>
            <p className="notice-desc">{currentCommodityMeta.description}</p>
          </div>
        </div>
        <Badge variant={currentCommodityMeta.criticality === 'CRITICAL' ? 'critical' : 'info'}>
          {currentCommodityMeta.riskMultiplier}x Risk Aversion Penalty Applied
        </Badge>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="routes-comparison-grid">
        {/* Recommended Route (Route B) */}
        <div
          className={`route-comparison-card recommended-card ${
            selectedRouteId === 'ROUTE-ALTERNATE' ? 'route-card-active-view' : ''
          }`}
        >
          <div className="route-card-header">
            <div className="route-card-tag safe-tag">
              <CheckCircle2 className="tag-icon text-emerald" />
              <span>AI-RECOMMENDED ROUTE</span>
            </div>
            <Badge variant="success">LOW RISK (14%)</Badge>
          </div>

          <h3 className="route-title">{rec?.name || 'Route B: AI-Optimized Bypass via NH-27'}</h3>

          <div className="route-path-summary">
            <Compass className="path-icon text-emerald" />
            <span>{rec?.path || 'Guwahati → Nagaon → Lumding Bypass → Dimapur → Kohima → Imphal'}</span>
          </div>

          {/* Key Metrics Row */}
          <div className="route-metrics-row">
            <div className="route-metric-box">
              <span className="metric-label">Estimated Time (ETA)</span>
              <span className="metric-value text-emerald">{rec?.eta || '12h 00m'}</span>
            </div>

            <div className="route-metric-box">
              <span className="metric-label">Travel Distance</span>
              <span className="metric-value">{rec?.distanceKm || 530} km</span>
            </div>

            <div className="route-metric-box">
              <span className="metric-label">Corridor Status</span>
              <span className="metric-value text-emerald">{rec?.status || 'OPEN & CLEAR'}</span>
            </div>
          </div>

          {/* Reason Box */}
          <div className="route-reason-box">
            <div className="reason-header">
              <Shield className="reason-icon text-emerald" />
              <span>DECISION RATIONALE:</span>
            </div>
            <p className="reason-text">
              {rec?.reason ||
                'Avoids high-risk flood & landslide corridor on NH-6 Dima Hasao. Safe grade roads with active BRO patrols guarantee arrival.'}
            </p>
          </div>

          {/* Cost Factors */}
          <div className="route-cost-factors">
            <div className="factor-item">
              <span className="factor-dot green-dot" />
              <span>Road Quality: {rec?.costBreakdown?.roadQuality || 'Good to Excellent'}</span>
            </div>
            <div className="factor-item">
              <span className="factor-dot green-dot" />
              <span>Hazard Probability: {rec?.costBreakdown?.hazardProbability || '4% (Low)'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="route-card-actions">
            <Button
              variant="success"
              size="sm"
              icon={Navigation}
              onClick={() => onSelectRouteOnMap && onSelectRouteOnMap('ROUTE-ALTERNATE')}
            >
              Show Safe Route on Map
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={Send}
              onClick={() => onDispatchReroute && onDispatchReroute(rec)}
            >
              Dispatch Advisory
            </Button>
          </div>
        </div>

        {/* Primary / Disrupted Route (Route A) */}
        <div
          className={`route-comparison-card primary-card ${
            selectedRouteId === 'ROUTE-PRIMARY' ? 'route-card-active-view' : ''
          }`}
        >
          <div className="route-card-header">
            <div className="route-card-tag blocked-tag">
              <AlertOctagon className="tag-icon text-rose" />
              <span>DIRECT ROUTE (DISRUPTED)</span>
            </div>
            <Badge variant="critical">CRITICAL RISK (88%)</Badge>
          </div>

          <h3 className="route-title">{prim?.name || 'Route A: Direct NH-6 via Shillong & Haflong'}</h3>

          <div className="route-path-summary">
            <Compass className="path-icon text-rose" />
            <span>{prim?.path || 'Guwahati → Shillong → Jowai → Dima Hasao Pass → Silchar → Imphal'}</span>
          </div>

          {/* Key Metrics Row */}
          <div className="route-metrics-row">
            <div className="route-metric-box">
              <span className="metric-label">Estimated Time (ETA)</span>
              <span className="metric-value text-rose">{prim?.eta || '14h 30m (Delayed)'}</span>
            </div>

            <div className="route-metric-box">
              <span className="metric-label">Travel Distance</span>
              <span className="metric-value">{prim?.distanceKm || 485} km</span>
            </div>

            <div className="route-metric-box">
              <span className="metric-label">Corridor Status</span>
              <span className="metric-value text-rose">{prim?.status || 'BLOCKED AT DIMA HASAO'}</span>
            </div>
          </div>

          {/* Reason Box */}
          <div className="route-reason-box danger-reason">
            <div className="reason-header">
              <AlertTriangle className="reason-icon text-rose" />
              <span>DISRUPTION WARNING:</span>
            </div>
            <p className="reason-text">
              {prim?.reason ||
                'Physical blockage due to major landslide at Km 142. Heavy rainfall ongoing with high risk of secondary slips.'}
            </p>
          </div>

          {/* Cost Factors */}
          <div className="route-cost-factors">
            <div className="factor-item">
              <span className="factor-dot red-dot" />
              <span>Road Quality: {prim?.costBreakdown?.roadQuality || 'Severely Damaged at pass'}</span>
            </div>
            <div className="factor-item">
              <span className="factor-dot red-dot" />
              <span>Hazard Probability: {prim?.costBreakdown?.hazardProbability || '88% (Flash flood & landslide)'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="route-card-actions">
            <Button
              variant="danger"
              size="sm"
              icon={Navigation}
              onClick={() => onSelectRouteOnMap && onSelectRouteOnMap('ROUTE-PRIMARY')}
            >
              Inspect Blocked Corridor
            </Button>
          </div>
        </div>
      </div>

      {/* AI Decision Explanation Note */}
      {activeRecommendation?.aiInsight && (
        <div className="ai-insight-box">
          <Sparkles className="insight-icon text-emerald" />
          <p className="insight-text">
            <strong>AI Optimization Explanation:</strong> {activeRecommendation.aiInsight}
          </p>
        </div>
      )}
    </Card>
  );
};

export default RouteRecommendations;

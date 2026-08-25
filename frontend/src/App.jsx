import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Component imports
import { Header } from './components/dashboard/Header';
import { Sidebar } from './components/dashboard/Sidebar';
import { KpiCards } from './components/dashboard/KpiCards';
import { OperationsMap } from './components/dashboard/OperationsMap';
import { AlertPanel } from './components/dashboard/AlertPanel';
import { RouteRecommendations } from './components/dashboard/RouteRecommendations';
import { VehicleStatus } from './components/dashboard/VehicleStatus';
import { DistrictConnectivity } from './components/dashboard/DistrictConnectivity';
import { IncidentSummary } from './components/dashboard/IncidentSummary';
import { FieldReportForm, FieldReportList } from './components/report';
import { Toast } from './components/ui/Toast';

// API Services & Mock Data
import {
  dashboardApi,
  alertsApi,
  routesApi,
  vehiclesApi,
  districtsApi,
  incidentsApi,
} from './lib/api';
import {
  mockDashboardMetrics,
  mockAlerts,
  mockVehicles,
  mockDistrictConnectivity,
  mockIncidents,
  mockRouteRecommendations,
} from './lib/mockData';

export function App() {
  // Navigation View State
  const [activeTab, setActiveTab] = useState('overview');

  // Application Data States
  const [metrics, setMetrics] = useState(mockDashboardMetrics);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [districts, setDistricts] = useState(mockDistrictConnectivity);
  const [incidents, setIncidents] = useState(mockIncidents);
  const [routesData, setRoutesData] = useState(mockRouteRecommendations);

  // Interaction States
  const [selectedRouteId, setSelectedRouteId] = useState(undefined);
  const [inspectedItem, setInspectedItem] = useState(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success', title = null) => {
    setToast({ message, type, title });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch all initial or refreshed data
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [m, a, v, d, inc, r] = await Promise.allSettled([
        dashboardApi.getMetrics(),
        alertsApi.getAlerts(),
        vehiclesApi.getVehicles(),
        districtsApi.getDistricts(),
        incidentsApi.getIncidents(),
        routesApi.recommendRoute({ source: 'dist-guwahati', destination: 'dist-imphal' }),
      ]);

      if (m.status === 'fulfilled' && m.value) setMetrics(m.value);
      if (a.status === 'fulfilled' && a.value?.alerts) setAlerts(a.value.alerts);
      if (v.status === 'fulfilled' && v.value?.vehicles) setVehicles(v.value.vehicles);
      if (d.status === 'fulfilled' && d.value?.districts) setDistricts(d.value.districts);
      if (inc.status === 'fulfilled' && inc.value?.incidents) setIncidents(inc.value.incidents);
      if (r.status === 'fulfilled' && r.value) setRoutesData(r.value);
    } catch (err) {
      console.warn('Data sync warning:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleRefresh = () => {
    loadData();
    showToast('Real-time telemetry feeds synchronized successfully.', 'success', 'Data Refreshed');
  };

  const handleToggleEmergencyMode = () => {
    const nextState = !emergencyMode;
    setEmergencyMode(nextState);
    if (nextState) {
      showToast(
        'Level-1 Logistics Emergency protocol activated. Emergency corridors prioritized.',
        'warning',
        'Emergency Mode Active'
      );
    } else {
      showToast('Emergency protocol stood down. Standard logistics operational status.', 'info');
    }
  };

  const handleDismissAlert = (alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    alertsApi.dismissAlert(alertId);
    showToast('Disaster hazard alert acknowledged and marked as reviewed.', 'info', 'Alert Acknowledged');
  };

  const handleLocateItem = (item) => {
    setInspectedItem({
      type: item.type || item.category || 'Feature',
      data: item,
    });
    // If on a different tab, switch to map to display
    if (activeTab !== 'overview' && activeTab !== 'map') {
      setActiveTab('map');
    }
    showToast(`Focused ${item.name || item.title || item.id || 'feature'} on GIS map view.`, 'info');
  };

  const handleSelectRouteOnMap = (routeId) => {
    setSelectedRouteId(routeId);
    if (activeTab !== 'overview' && activeTab !== 'map') {
      setActiveTab('map');
    }
    showToast(
      routeId === 'ROUTE-ALTERNATE'
        ? 'Activated AI-Recommended Safe Corridor (NH-27 Bypass)'
        : 'Displaying Blocked Primary Corridor (NH-6 Dima Hasao)',
      'success',
      'Route Layer Filter'
    );
  };

  const handleDispatchReroute = (routeInfo) => {
    showToast(
      `Priority reroute advisory broadcast to drivers en route to ${routeInfo?.name || 'destination'}.`,
      'success',
      'Reroute Dispatch Sent'
    );
  };

  const handleFieldReportSubmitSuccess = (newIncident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    setIsReportModalOpen(false);

    // Also inject corresponding alert
    const newAlert = {
      id: `ALT-${Date.now().toString().slice(-3)}`,
      severity: newIncident.severity || 'High',
      category: (newIncident.type || 'BLOCKED_ROAD').toUpperCase().replace(/\s+/g, '_'),
      title: newIncident.title,
      location: newIncident.location,
      state: newIncident.state || 'Assam',
      time: 'Just now',
      description: newIncident.impact || newIncident.description,
      impact: 'Field disruption under investigation',
      recommendedAction: 'Inspect corridor and alert approaching freight vehicles.',
      affectedCommodities: ['GENERAL'],
      clearanceStatus: `Est. ${newIncident.estimatedClearance || '24 hrs'}`,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      activeIncidents: prev.activeIncidents + 1,
      roadsDisrupted: prev.roadsDisrupted + 1,
    }));

    showToast(
      'Field disruption report logged and broadcast to State EOC & Patrol units.',
      'success',
      'Report Submitted'
    );
  };

  const handleSelectKpi = (kpiId) => {
    if (kpiId === 'districts') setActiveTab('districts');
    else if (kpiId === 'roads-disrupted' || kpiId === 'active-incidents' || kpiId === 'high-risk') setActiveTab('alerts');
    else if (kpiId === 'vehicles' || kpiId === 'delayed-deliveries') setActiveTab('fleet');
    else if (kpiId === 'roads-open') setActiveTab('routes');
  };

  return (
    <div className={`dashboard-app ${emergencyMode ? 'dashboard-emergency-theme' : ''}`}>
      {/* Top Command Center Header */}
      <Header
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        activeAlertsCount={alerts.length}
        emergencyMode={emergencyMode}
        onToggleEmergencyMode={handleToggleEmergencyMode}
      />

      {/* Main Dashboard Layout Shell */}
      <div className="dashboard-shell">
        {/* Left Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeAlertsCount={alerts.length}
          vehiclesCount={vehicles.length}
          disruptedDistrictsCount={districts.filter((d) => d.status === 'ISOLATED' || d.status === 'CRITICAL_BOTTLENECK').length}
        />

        {/* Dynamic Center Work Area */}
        <main className="dashboard-main-content">
          {/* Top High-Level Logistics KPIs */}
          <KpiCards
            metrics={metrics}
            onSelectKpi={handleSelectKpi}
          />

          {/* Tab 1: Command Overview */}
          {activeTab === 'overview' && (
            <div className="overview-dashboard-grid">
              {/* Left Column: Operations Map & District Connectivity */}
              <div className="overview-left-col">
                <OperationsMap
                  selectedRouteId={selectedRouteId}
                  onSelectRouteId={setSelectedRouteId}
                  inspectedItem={inspectedItem}
                  onInspectItem={setInspectedItem}
                  onClearInspection={() => setInspectedItem(null)}
                  height="460px"
                />

                <DistrictConnectivity
                  districts={districts}
                  onSelectDistrict={handleLocateItem}
                />
              </div>

              {/* Right Column: Alert Feed, Route Box & Fleet Summary */}
              <div className="overview-right-col">
                <AlertPanel
                  alerts={alerts}
                  onDismissAlert={handleDismissAlert}
                  onLocateAlert={handleLocateItem}
                />

                <RouteRecommendations
                  recommendationData={routesData}
                  onSelectRouteOnMap={handleSelectRouteOnMap}
                  onDispatchReroute={handleDispatchReroute}
                  selectedRouteId={selectedRouteId}
                />

                <VehicleStatus
                  vehicles={vehicles}
                  onSelectVehicle={handleLocateItem}
                  onRerouteVehicle={() => setActiveTab('routes')}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Dedicated GIS Operations Map */}
          {activeTab === 'map' && (
            <div className="map-view-tab-container">
              <OperationsMap
                selectedRouteId={selectedRouteId}
                onSelectRouteId={setSelectedRouteId}
                inspectedItem={inspectedItem}
                onInspectItem={setInspectedItem}
                onClearInspection={() => setInspectedItem(null)}
                height="700px"
              />
            </div>
          )}

          {/* Tab 3: Disaster & Hazard Alert Center */}
          {activeTab === 'alerts' && (
            <div className="alerts-tab-container">
              <AlertPanel
                alerts={alerts}
                onDismissAlert={handleDismissAlert}
                onLocateAlert={handleLocateItem}
              />
            </div>
          )}

          {/* Tab 4: AI Route Optimization & Multi-Commodity Comparison */}
          {activeTab === 'routes' && (
            <div className="routes-tab-container">
              <RouteRecommendations
                recommendationData={routesData}
                onSelectRouteOnMap={handleSelectRouteOnMap}
                onDispatchReroute={handleDispatchReroute}
                selectedRouteId={selectedRouteId}
              />
            </div>
          )}

          {/* Tab 5: Logistics Fleet & Delayed Deliveries */}
          {activeTab === 'fleet' && (
            <div className="fleet-tab-container">
              <VehicleStatus
                vehicles={vehicles}
                onSelectVehicle={handleLocateItem}
                onRerouteVehicle={() => setActiveTab('routes')}
              />
            </div>
          )}

          {/* Tab 6: District Accessibility Matrix */}
          {activeTab === 'districts' && (
            <div className="districts-tab-container">
              <DistrictConnectivity
                districts={districts}
                onSelectDistrict={handleLocateItem}
              />
            </div>
          )}

          {/* Tab 7: Field Incident Reporting & Log */}
          {activeTab === 'incidents' && (
            <div className="incidents-tab-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <IncidentSummary
                incidents={incidents}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onLocateIncident={handleLocateItem}
              />

              <FieldReportList
                incidents={incidents}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onLocateIncident={handleLocateItem}
              />
            </div>
          )}
        </main>
      </div>

      {/* Field Report Modal */}
      {isReportModalOpen && (
        <div className="modal-backdrop-overlay" onClick={() => setIsReportModalOpen(false)}>
          <div className="modal-content-window" onClick={(e) => e.stopPropagation()}>
            <FieldReportForm
              onSubmitSuccess={handleFieldReportSubmitSuccess}
              onCancel={() => setIsReportModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      {toast && (
        <div className="toast-floating-container">
          <Toast
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}

export default App;

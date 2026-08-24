import React from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  AlertTriangle,
  Route,
  Truck,
  Building2,
  FileText,
  Shield,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

const navigationItems = [
  { id: 'overview', label: 'Command Overview', icon: LayoutDashboard, badge: null },
  { id: 'map', label: 'GIS Operations Map', icon: MapIcon, badge: 'Live GIS' },
  { id: 'alerts', label: 'Alerts & Hazards', icon: AlertTriangle, badge: '4 New', badgeVariant: 'critical' },
  { id: 'routes', label: 'AI Route Optimizer', icon: Route, badge: 'AI ETA' },
  { id: 'fleet', label: 'Fleet & Deliveries', icon: Truck, badge: '4 Active' },
  { id: 'districts', label: 'District Connectivity', icon: Building2, badge: null },
  { id: 'incidents', label: 'Field Reports', icon: FileText, badge: null },
];

export const Sidebar = ({
  activeTab,
  onTabChange,
  activeAlertsCount = 4,
  vehiclesCount = 4,
  disruptedDistrictsCount = 2,
}) => {
  return (
    <aside className="cmd-sidebar">
      {/* Navigation Group */}
      <div className="cmd-sidebar-section">
        <div className="sidebar-section-header">OPERATIONAL VIEWS</div>
        <nav className="cmd-nav-list">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            let dynamicBadge = item.badge;
            let badgeVariant = item.badgeVariant || 'default';

            if (item.id === 'alerts') {
              dynamicBadge = activeAlertsCount > 0 ? `${activeAlertsCount} Active` : 'Clear';
              badgeVariant = activeAlertsCount > 0 ? 'critical' : 'success';
            } else if (item.id === 'fleet') {
              dynamicBadge = `${vehiclesCount} Trucks`;
            } else if (item.id === 'districts' && disruptedDistrictsCount > 0) {
              dynamicBadge = `${disruptedDistrictsCount} At Risk`;
              badgeVariant = 'high';
            }

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`cmd-nav-item ${isActive ? 'cmd-nav-item-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="cmd-nav-item-left">
                  <Icon className="cmd-nav-icon" />
                  <span className="cmd-nav-label">{item.label}</span>
                </div>
                {dynamicBadge && (
                  <Badge variant={badgeVariant} size="sm">
                    {dynamicBadge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Regional Status Summary Widget */}
      <div className="cmd-sidebar-footer-card">
        <div className="sidebar-footer-header">
          <Shield className="sidebar-shield-icon" />
          <span>NER Coverage Scope</span>
        </div>
        <p className="sidebar-footer-text">
          Active surveillance across 8 Northeast States: Assam, Meghalaya, Manipur, Nagaland, Arunachal, Mizoram, Tripura, Sikkim.
        </p>
        <div className="sidebar-footer-stats">
          <div className="footer-stat-item">
            <span className="stat-num">84%</span>
            <span className="stat-lbl">Roads Open</span>
          </div>
          <div className="footer-stat-item">
            <span className="stat-num text-rose">3</span>
            <span className="stat-lbl">Corridor Blocks</span>
          </div>
          <div className="footer-stat-item">
            <span className="stat-num text-emerald">2</span>
            <span className="stat-lbl">AI Bypass Clear</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

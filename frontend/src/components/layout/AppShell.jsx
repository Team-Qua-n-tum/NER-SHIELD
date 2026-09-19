/**
 * AppShell
 *
 * The authenticated application wrapper used by all role dashboards.
 * Renders:
 *  - Role-specific collapsible Sidebar
 *  - Topbar: user name, RoleBadge, context (district/fleet), DataModeBadge,
 *            notification bell, logout
 *  - SessionExpiredBanner
 *  - Toast renderer
 *  - Main content area
 *
 * Usage:
 *   <AppShell>
 *     <DashboardContent />
 *   </AppShell>
 */
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield, MapPin, Radio, Package, Eye,
  LayoutDashboard, Map, AlertTriangle, Compass,
  Truck, ShieldCheck, FilePlus, FileText, Activity,
  Layers, BarChart3, Users, ClipboardList, Bell,
  LogOut, ChevronLeft, ChevronRight, Menu, X,
  Route, Navigation, Settings, ListChecks, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { RoleBadge } from '../auth/RoleBadge';
import { DataModeBadge } from '../auth/DataModeBadge';
import { SessionExpiredBanner } from '../auth/SessionExpiredBanner';
import { Toast } from '../ui/Toast';

// ─── Role-specific nav items ──────────────────────────────────────────────────
function getNavItems(role, appCtx) {
  const unverified = appCtx?.incidents?.filter((i) => !i.verified)?.length || 0;
  const alertCount = appCtx?.alerts?.length || 0;

  switch (role) {
    case 'admin':
      return [
        { path: '/app/admin', label: 'Operations Overview', icon: LayoutDashboard },
        { path: '/app/admin/map', label: 'All Districts Map', icon: Map },
        { path: '/app/admin/vehicles', label: 'Fleet Management', icon: Truck },
        { path: '/app/admin/incidents', label: 'All Incidents', icon: AlertTriangle, badge: alertCount, badgeColor: 'bg-red-500' },
        { path: '/app/admin/routes', label: 'Route Planning', icon: Route },
        { path: '/app/admin/alerts', label: 'Alert Center', icon: Bell, badge: alertCount, badgeColor: 'bg-amber-500' },
        { path: '/app/admin/districts', label: 'District Connectivity', icon: Layers },
        { path: '/app/admin/users', label: 'User Management', icon: Users, tag: 'Soon' },
        { path: '/app/admin/audit', label: 'Audit Log', icon: ClipboardList, tag: 'Soon' },
      ];
    case 'district_officer':
      return [
        { path: '/app/district', label: 'District Dashboard', icon: LayoutDashboard },
        { path: '/app/district/map', label: 'District GIS Map', icon: Map },
        { path: '/app/district/incidents', label: 'Incident Review', icon: ShieldCheck, badge: unverified, badgeColor: 'bg-amber-500' },
        { path: '/app/district/roads', label: 'Road Status', icon: Activity },
        { path: '/app/district/routes', label: 'Emergency Routes', icon: Route },
        { path: '/app/district/alerts', label: 'District Alerts', icon: AlertTriangle, badge: alertCount, badgeColor: 'bg-red-500' },
        { path: '/app/district/reports', label: 'Field Reports', icon: FileText },
      ];
    case 'field_officer':
      return [
        { path: '/app/field', label: 'My Dashboard', icon: LayoutDashboard },
        { path: '/app/field/report', label: 'Report Incident', icon: FilePlus, highlight: true },
        { path: '/app/field/my-reports', label: 'My Reports', icon: FileText },
        { path: '/app/field/map', label: 'Area Map', icon: Map },
        { path: '/app/field/alerts', label: 'Alerts', icon: Bell },
        { path: '/app/field/notifications', label: 'Notifications', icon: Settings },
      ];
    case 'logistics_operator':
      return [
        { path: '/app/logistics', label: 'Fleet Overview', icon: Truck },
        { path: '/app/logistics/routes', label: 'Route Planner', icon: Route, highlight: true },
        { path: '/app/logistics/alerts', label: 'Route Alerts', icon: Zap, badge: alertCount, badgeColor: 'bg-amber-500' },
        { path: '/app/logistics/vehicles', label: 'My Vehicles', icon: Navigation },
      ];
    case 'viewer':
      return [
        { path: '/app/viewer', label: 'Public Status', icon: Eye },
        { path: '/app/viewer/alerts', label: 'Public Alerts', icon: AlertTriangle },
      ];
    default:
      return [{ path: '/app/admin', label: 'Dashboard', icon: LayoutDashboard }];
  }
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function AppSidebar({ collapsed, onCollapse, role, appCtx }) {
  const location = useLocation();
  const navItems = getNavItems(role, appCtx);

  return (
    <aside
      data-testid="app-sidebar"
      className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 shrink-0 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-slate-800">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-white tracking-tight">NER-SHIELD</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={onCollapse}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/app/admin' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/20'
                  : item.highlight
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <Icon className={`shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-blue-500'}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.tag && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400">
                      {item.tag}
                    </span>
                  )}
                </>
              )}
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function AppTopbar({ collapsed, onToggleMobile, mobileOpen, user, dataMode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const contextLabel = user?.district_ids?.length > 0 && user.district_ids[0] !== '*'
    ? user.district_ids.map(d => d.replace('dist-', '').replace(/-/g, ' ')).join(', ')
    : user?.vehicle_ids?.length > 0 && user.vehicle_ids[0] !== '*'
    ? `${user.vehicle_ids.length} vehicle(s)`
    : null;

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
      {/* Left: mobile menu + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="text-sm font-black text-white tracking-tight md:hidden">NER-SHIELD</span>
      </div>

      {/* Center: context & data mode */}
      <div className="flex items-center gap-2 flex-1 justify-center">
        {contextLabel && (
          <span className="hidden sm:inline text-xs text-slate-500 font-mono truncate max-w-[180px]">
            {contextLabel}
          </span>
        )}
        <DataModeBadge mode={dataMode} />
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-semibold text-white leading-tight">{user?.name}</p>
          </div>
          <RoleBadge role={user?.role} size="xs" />
        </div>
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors"
          >
            <span className="text-sm font-bold text-white">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-800">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5">
                  <RoleBadge role={user?.role} size="xs" />
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  data-testid="logout-button"
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose, role, appCtx }) {
  const location = useLocation();
  const navItems = getNavItems(role, appCtx);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute top-0 left-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-white">NER-SHIELD</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/20'
                    : item.highlight
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-blue-500'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────
export const AppShell = ({ children }) => {
  const { user, dataMode } = useAuth();
  const appCtx = useApp();
  const { toast, closeToast } = appCtx;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || 'admin';

  return (
    <div data-testid="app-shell" className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <SessionExpiredBanner />

      {/* Desktop Sidebar */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        role={role}
        appCtx={appCtx}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        role={role}
        appCtx={appCtx}
      />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">
        <AppTopbar
          collapsed={sidebarCollapsed}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          mobileOpen={mobileOpen}
          user={user}
          dataMode={dataMode}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          title={toast.title}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default AppShell;

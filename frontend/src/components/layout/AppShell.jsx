/**
 * AppShell
 *
 * The unified authenticated application shell used by all role dashboards.
 * Renders:
 *  - Role-specific collapsible Sidebar (using NavLink and unified ROLE_NAV_CONFIG)
 *  - Topbar: context, DataModeBadge, notification link, profile dropdown, logout
 *  - Mobile Drawer (using NavLink)
 *  - SessionExpiredBanner
 *  - Toast renderer
 *  - Main content area rendering child routes via Outlet
 */
import React, { useState } from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import {
  Shield,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { RoleBadge } from '../auth/RoleBadge';
import { DataModeBadge } from '../auth/DataModeBadge';
import { SessionExpiredBanner } from '../auth/SessionExpiredBanner';
import { Toast } from '../ui/Toast';
import { getNavItemsForRole } from '../../config/navigation';

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function AppSidebar({ collapsed, onCollapse, role, appCtx }) {
  const unverified = appCtx?.incidents?.filter((i) => !i.verified)?.length || 0;
  const alertCount = appCtx?.alerts?.length || 0;
  const activeFleet = appCtx?.vehicles?.filter((v) => v.status?.includes('Transit'))?.length || 0;

  const navItems = getNavItemsForRole(role, {
    incidents: appCtx?.incidents?.length || 0,
    unverifiedReports: unverified,
    alerts: alertCount,
    fleetActive: activeFleet,
  });

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
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/20 font-bold'
                    : item.highlight
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                }`
              }
            >
              <Icon className={`shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-blue-500'}`}>
                      {item.badge}
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
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function AppTopbar({ onToggleMobile, mobileOpen, user, dataMode }) {
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
          aria-label="Toggle Navigation Drawer"
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

      {/* Right: common actions + user info + profile dropdown */}
      <div className="flex items-center gap-2">
        <Link
          to="/app/notifications"
          aria-label="Notifications"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </Link>
        <Link
          to="/app/help"
          aria-label="Help"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </Link>

        <div className="hidden sm:flex items-center gap-2 ml-2">
          <div className="text-right">
            <p className="text-xs font-semibold text-white leading-tight">{user?.name}</p>
          </div>
          <RoleBadge role={user?.role} size="xs" />
        </div>

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="User Profile Menu"
            className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors ml-1"
          >
            <span className="text-sm font-bold text-white">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-800">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5">
                  <RoleBadge role={user?.role} size="xs" />
                </div>
              </div>
              <div className="p-1 space-y-0.5">
                <Link
                  to="/app/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 font-medium transition-colors"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  My Profile
                </Link>
                <Link
                  to="/app/notifications"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 font-medium transition-colors"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  Notification Settings
                </Link>
                <Link
                  to="/app/help"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 font-medium transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  Help & Manual
                </Link>
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
  const unverified = appCtx?.incidents?.filter((i) => !i.verified)?.length || 0;
  const alertCount = appCtx?.alerts?.length || 0;
  const activeFleet = appCtx?.vehicles?.filter((v) => v.status?.includes('Transit'))?.length || 0;

  const navItems = getNavItemsForRole(role, {
    incidents: appCtx?.incidents?.length || 0,
    unverifiedReports: unverified,
    alerts: alertCount,
    fleetActive: activeFleet,
  });

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
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/20 font-bold'
                      : item.highlight
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-blue-500'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
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
  const { toast, closeToast } = appCtx || {};

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

        {/* Content rendered via Outlet (or children for backwards compatibility) */}
        <main className="flex-1 overflow-y-auto">
          {children || <Outlet />}
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

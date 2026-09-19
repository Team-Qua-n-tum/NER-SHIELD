/**
 * NER-SHIELD Login Page
 *
 * Authentication-first login. Features:
 *  - Email + password fields with show/hide toggle
 *  - Loading and error states
 *  - Back to portal selection
 *  - In DEMO MODE only: visible demo account selector
 *    (clearly labelled "DEMO SESSION — NOT REAL AUTHENTICATION")
 *  - No hardcoded passwords in UI; demo mode handled via authApi
 *  - On success: redirects to user's role home path
 *
 * ⚠️  SECURITY NOTE: DEMO MODE is for demonstration only.
 *     Real authentication requires backend POST /api/v1/auth/login.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS, DEMO_MODE, ROLE_META } from '../lib/demoUsers';
import {
  Shield, Eye, EyeOff, ArrowLeft, ArrowRight,
  Lock, Mail, Loader2, AlertCircle, FlaskConical,
  Radio, Package, MapPin, User, Sparkles, ChevronDown
} from 'lucide-react';

const PORTAL_CONFIG = {
  ops: {
    title: 'Government & Logistics Operations',
    desc: 'Admin Command, District Officers, and Logistics Coordinators',
    icon: Shield,
    accentClass: 'from-blue-600 to-indigo-600',
    borderClass: 'border-blue-500/30',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-400',
    demoRoles: ['admin', 'district_officer', 'logistics_operator', 'viewer'],
  },
  field: {
    title: 'Field Officer Reporting',
    desc: 'Mobile dispatch and ground incident reporting',
    icon: Radio,
    accentClass: 'from-emerald-600 to-teal-600',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    demoRoles: ['field_officer'],
  },
};

export const Login = () => {
  const { login, isAuthenticated, isLoading: authLoading, getRoleHomePath, isDemoMode, loginError, isLoginLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const portal = searchParams.get('portal') || 'ops';
  const portalCfg = PORTAL_CONFIG[portal] || PORTAL_CONFIG.ops;
  const PortalIcon = portalCfg.icon;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [demoExpanded, setDemoExpanded] = useState(false);

  // If already authenticated, redirect to role home
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const from = location.state?.from?.pathname;
      navigate(from || getRoleHomePath(), { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, getRoleHomePath, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Email address is required.');
      return;
    }
    if (!password) {
      setLocalError('Password is required.');
      return;
    }

    const result = await login(email.trim().toLowerCase(), password);
    if (result.success) {
      const from = location.state?.from?.pathname;
      navigate(from || result.user.homePath || getRoleHomePath(), { replace: true });
    }
    // loginError from AuthContext handles API error display
  };

  const handleDemoLogin = async (demoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.demoPassword);
    setLocalError('');
    const result = await login(demoUser.email, demoUser.demoPassword);
    if (result.success) {
      navigate(demoUser.homePath, { replace: true });
    }
  };

  const displayError = localError || loginError;
  const demoUsers = DEMO_USERS.filter(u => portalCfg.demoRoles.includes(u.role));

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 relative overflow-hidden">
      {/* Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:font-bold focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
      >
        Skip to main content
      </a>

      {/* Ambient glows */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/12 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[350px] h-[250px] bg-cyan-600/8 blur-[140px] pointer-events-none rounded-full" />

      {/* Header Landmark */}
      <header role="banner">
        <nav aria-label="Login Navigation" className="relative z-10 flex items-center justify-between px-4 h-14 border-b border-slate-800/60">
          <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-lg p-1">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to NER-SHIELD
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </div>
            <span className="text-sm font-black text-white tracking-tight">NER-SHIELD</span>
          </div>
        </nav>
      </header>

      {/* Main Landmark */}
      <main id="main-content" role="main" className="flex-1 flex flex-col items-center justify-center py-10 px-4 relative z-10">
        <div className="w-full max-w-md space-y-5">

          {/* Portal badge */}
          <div className="text-center space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${portalCfg.bgClass} border ${portalCfg.borderClass}`}>
              <PortalIcon className={`w-4 h-4 ${portalCfg.textClass}`} aria-hidden="true" />
              <span className={`text-xs font-bold ${portalCfg.textClass}`}>{portalCfg.title}</span>
            </div>
            <p className="text-xs text-slate-300">{portalCfg.desc}</p>
          </div>

          {/* ── DEMO MODE Banner ───────────────────────────────────────────── */}
          {isDemoMode && (
            <div
              data-testid="demo-mode-banner"
              className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30"
            >
              <FlaskConical className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-purple-300">⚠️ DEMO SESSION — NOT REAL AUTHENTICATION</p>
                <p className="text-xs text-purple-300/90 mt-0.5 leading-relaxed">
                  Backend auth service is not connected. Using synthetic demo users.
                  No real credentials are accepted or stored.
                </p>
              </div>
            </div>
          )}

          {/* ── Login Form ─────────────────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            data-testid="login-form"
            className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <h1 className="text-lg font-black text-white">Sign In</h1>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLocalError(''); }}
                  placeholder={isDemoMode ? 'Select a demo account below' : 'you@agency.gov.in'}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
                  placeholder={isDemoMode ? 'demo' : 'Your secure password'}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded p-1 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {displayError && (
              <div
                data-testid="login-error"
                role="alert"
                className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                {displayError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoginLoading}
              data-testid="login-submit"
              className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${portalCfg.accentClass} hover:opacity-90 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-cyan-400`}
            >
              {isLoginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Signing In…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* ── Demo Account Selector (DEMO MODE only) ─────────────────────── */}
          {isDemoMode && (
            <div
              data-testid="demo-account-selector"
              className="bg-slate-900/80 border border-purple-500/20 rounded-3xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setDemoExpanded(!demoExpanded)}
                className="flex items-center justify-between w-full px-5 py-3.5 text-xs font-bold text-purple-300 hover:bg-purple-500/5 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
                aria-expanded={demoExpanded}
              >
                <span className="flex items-center gap-2">
                  <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                  Demo Account Quick Access
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${demoExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {demoExpanded && (
                <div className="px-4 pb-4 space-y-2 border-t border-purple-500/10 pt-3">
                  <p className="text-xs text-purple-300 mb-2">
                    Click any demo account to log in instantly. Password: <code className="font-mono bg-slate-800 text-purple-200 px-1 rounded">demo</code>
                  </p>
                  {demoUsers.map((u) => {
                    const meta = ROLE_META[u.role];
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleDemoLogin(u)}
                        disabled={isLoginLoading}
                        data-testid={`demo-user-${u.role}`}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/30 transition-all text-left disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0" aria-hidden="true">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                          <p className="text-xs text-slate-400 font-mono truncate">{u.email}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${meta?.bgClass}`}>
                          {meta?.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Portal switch */}
          <div className="text-center">
            {portal === 'ops' ? (
              <Link to="/login?portal=field" className="text-xs text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded p-1 transition-colors">
                Field Officer? Switch to Field Portal →
              </Link>
            ) : (
              <Link to="/login?portal=ops" className="text-xs text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded p-1 transition-colors">
                Government/Logistics staff? Switch to Ops Portal →
              </Link>
            )}
          </div>

        </div>
      </main>

      {/* Footer Landmark */}
      <footer role="contentinfo" className="relative z-10 py-4 text-center text-xs text-slate-400">
        NER-SHIELD · Ministry of DoNER Support Prototype · Authentication required for all operational data
      </footer>
    </div>
  );
};

export default Login;

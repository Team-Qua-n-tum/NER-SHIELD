/**
 * NER-SHIELD Public Landing Page
 *
 * Shown BEFORE authentication. Contains ONLY:
 *  - Brand identity
 *  - Platform mission
 *  - Static feature capability cards
 *  - Anonymized aggregate statistics (static, not live data)
 *  - Portal selection CTAs → /login
 *  - Privacy/security statement
 *
 * NEVER shown here before login:
 *  - Live map / vehicle positions
 *  - Operational road layers
 *  - Active incidents / field reports
 *  - Route planning / alert center
 *  - User/admin panel
 */
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Truck, MapPin, Package, Activity, AlertTriangle,
  Compass, CheckCircle2, Cpu, Radio, ArrowRight, Sparkles,
  Globe, BarChart3, FileText, Lock, Eye, Zap, Navigation
} from 'lucide-react';

// ─── Static feature cards (no live data) ─────────────────────────────────────
const FEATURE_CARDS = [
  {
    title: 'Real-Time GIS Intelligence',
    desc: 'Live GPS tracking, district connectivity matrices, and road-status layers across all Northeast highway corridors.',
    icon: Globe,
    gradient: 'from-blue-600/20 to-cyan-600/20',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    badge: 'GIS Engine',
  },
  {
    title: 'AI Disruption Risk Analysis',
    desc: 'Predictive models evaluate monsoon intensity, terrain slope stability, and historic hazard patterns to score route risk before dispatch.',
    icon: Cpu,
    gradient: 'from-indigo-600/20 to-purple-600/20',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    badge: 'AI Engine',
  },
  {
    title: 'Safer Adaptive Routing',
    desc: 'Dynamic re-routing around blocked roads, flooded bridges, and landslide zones. ETA-aware commodity priority dispatch.',
    icon: Navigation,
    gradient: 'from-emerald-600/20 to-teal-600/20',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    badge: 'OSRM Powered',
  },
  {
    title: 'Field Incident Reporting',
    desc: 'Decentralized GPS-tagged hazard reporting by field officers with photo attachments and status timelines.',
    icon: FileText,
    gradient: 'from-amber-600/20 to-yellow-600/20',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    badge: 'Field Network',
  },
  {
    title: 'Emergency Logistics Coordination',
    desc: 'Cold-chain vehicle telemetry, stockpile monitoring, and priority convoy management for critical medical and food supplies.',
    icon: Package,
    gradient: 'from-red-600/20 to-rose-600/20',
    border: 'border-red-500/20',
    text: 'text-red-400',
    badge: 'Supply Chain',
  },
  {
    title: 'Multi-Agency Alert Network',
    desc: 'Synchronized alerts with BRO, SDRF, and State EOCs. Push notifications for flash floods, rockslides, and blockages.',
    icon: Radio,
    gradient: 'from-violet-600/20 to-purple-600/20',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    badge: 'BRO / SDRF',
  },
];

// ─── Static aggregate statistics (anonymized, not live data) ─────────────────
const STATS = [
  { value: '8', label: 'States Covered', icon: Globe },
  { value: '450+', label: 'Highway Corridors Monitored', icon: MapPin },
  { value: '24/7', label: 'Operational Uptime', icon: Activity },
  { value: 'AI', label: 'Disruption Risk Engine', icon: Cpu },
];

export const Home = () => {
  const { isAuthenticated, getRoleHomePath, isLoading } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, send to role home
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(getRoleHomePath(), { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, getRoleHomePath]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* ── Skip to Main Content Link (WCAG 2.2 AA / AAA Best Practice) ──────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:font-bold focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
      >
        Skip to main content
      </a>

      {/* ── Public Header & Navbar Landmark ──────────────────────────────────── */}
      <header role="banner">
        <nav
          aria-label="Main Navigation"
          className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                </div>
              </div>
              <span className="text-base font-black text-white tracking-tight">NER-SHIELD</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Main Landmark Region (WCAG Requirement: Exactly One Main Landmark) ─ */}
      <main id="main-content" role="main">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section aria-labelledby="hero-title" className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
          {/* Ambient glows */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />
          <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-indigo-600/8 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-cyan-600/8 blur-[100px] pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
              Ministry of DoNER · Northeast India
            </div>

            {/* Headline */}
            <h1 id="hero-title" className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.05]">
              Northeast Emergency{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Road Shield
              </span>
            </h1>

            {/* Subline */}
            <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed">
              AI-powered disruption intelligence, GIS fleet tracking, and emergency routing
              for critical supply chains across Northeast India's 8 states.
            </p>

            {/* CTA Portals */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/login?portal=ops"
                data-testid="portal-ops"
                aria-label="Government and Logistics Portal Sign In"
                className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-900/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all w-full sm:w-auto justify-center"
              >
                <Shield className="w-4 h-4" aria-hidden="true" />
                Government &amp; Logistics Portal
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
              <Link
                to="/login?portal=field"
                data-testid="portal-field"
                aria-label="Field Officer Incident Reporting Sign In"
                className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all w-full sm:w-auto justify-center"
              >
                <Radio className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                Field Officer Reporting
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Static Stats ──────────────────────────────────────────────────── */}
        <section aria-label="Platform Statistics" className="py-8 border-y border-slate-800/60 bg-slate-900/30">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center space-y-1">
                    <div className="flex justify-center mb-1.5">
                      <Icon className="w-5 h-5 text-slate-300" aria-hidden="true" />
                    </div>
                    <div className="text-2xl font-black text-white">{stat.value}</div>
                    <div className="text-xs text-slate-300 font-medium">{stat.label}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-slate-400 mt-4 leading-normal">
              Statistics are aggregate platform capabilities. Live operational data is visible only to authenticated users.
            </p>
          </div>
        </section>

        {/* ── Feature Cards ─────────────────────────────────────────────────── */}
        <section aria-labelledby="capabilities-title" className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 id="capabilities-title" className="text-2xl sm:text-3xl font-black text-white mb-3">
                Platform Capabilities
              </h2>
              <p className="text-sm text-slate-300 max-w-xl mx-auto">
                Integrated operational tools for government agencies, district officers,
                field personnel, and logistics teams.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURE_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className={`relative p-5 rounded-2xl bg-gradient-to-br ${card.gradient} border ${card.border} group hover:scale-[1.01] transition-transform duration-200`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60">
                        <Icon className={`w-4 h-4 ${card.text}`} aria-hidden="true" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.border} ${card.text} bg-slate-900/60`}>
                        {card.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5 leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Portal Selection Detail ────────────────────────────────────────── */}
        <section aria-labelledby="portals-title" className="py-16 px-4 bg-slate-900/30 border-y border-slate-800/60">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 id="portals-title" className="text-2xl font-black text-white mb-2">Choose Your Portal</h2>
              <p className="text-sm text-slate-300">
                Access is role-restricted. Log in with your government-issued credentials.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">

              {/* Ops Portal */}
              <Link
                to="/login?portal=ops"
                aria-label="Enter Government and Logistics Operations Portal"
                className="group p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all hover:shadow-xl hover:shadow-blue-900/20"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <Shield className="w-6 h-6 text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-1">Government &amp; Logistics Operations</h3>
                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      For Admin Command, District Disaster Management Officers, and Logistics Coordinators.
                      Full operational dashboard, fleet tracking, incident management, and route planning.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Admin', 'District Officer', 'Logistics Operator'].map(r => (
                        <span key={r} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">{r}</span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors mt-1 shrink-0" aria-hidden="true" />
                </div>
              </Link>

              {/* Field Portal */}
              <Link
                to="/login?portal=field"
                aria-label="Enter Field Officer Incident Reporting Portal"
                className="group p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all hover:shadow-xl hover:shadow-emerald-900/20"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <Radio className="w-6 h-6 text-emerald-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-1">Field Officer Reporting</h3>
                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      Mobile-optimized portal for field patrol officers to report road hazards, capture GPS coordinates,
                      and track report status in real time.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Field Officer', 'Patrol'].map(r => (
                        <span key={r} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">{r}</span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors mt-1 shrink-0" aria-hidden="true" />
                </div>
              </Link>

            </div>
          </div>
        </section>

        {/* ── Privacy / Security Statement ──────────────────────────────────── */}
        <section aria-labelledby="security-title" className="py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex gap-4">
              <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1.5">
                <h3 id="security-title" className="text-xs font-bold text-slate-200">Security &amp; Privacy</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  NER-SHIELD is a government operational platform. All access is authenticated and role-restricted.
                  Live operational data — vehicle positions, incident details, field reports, route geometry —
                  is never visible to unauthenticated users. This public page shows only static platform information.
                  Session data is stored in-browser only and is not transmitted to third parties.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer Landmark ────────────────────────────────────────────────── */}
      <footer role="contentinfo" className="border-t border-slate-800 py-6 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-xs font-bold text-slate-300 tracking-wider">NER-SHIELD</span>
        </div>
        <p className="text-xs text-slate-400">
          Northeast Emergency Road Shield · Ministry of Development of North Eastern Region Support Prototype
        </p>
      </footer>

    </div>
  );
};

export default Home;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Navbar, NotificationPanel, ChatPanel } from '../components/common';
import {
  Shield,
  Truck,
  MapPin,
  Package,
  Activity,
  AlertTriangle,
  Compass,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Radio,
  ArrowRight,
  Sparkles,
  PhoneCall,
  ExternalLink,
  Layers,
  BarChart3,
  Globe,
  Map,
  FileText
} from 'lucide-react';

export const Home = () => {
  const { setRole, vehicles, incidents, alerts, districts } = useApp();
  const navigate = useNavigate();

  const handleSelectRoleAndNavigate = (role, path) => {
    setRole(role);
    navigate(path);
  };

  const featureCards = [
    {
      title: 'Real-Time GIS Fleet Tracking',
      desc: 'Live telemetry, GPS positioning, speed, and cold-chain temperature monitoring across mountainous Northeast corridors.',
      icon: Truck,
      color: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30',
      badge: 'Live Telemetry'
    },
    {
      title: 'AI Predictive Route Safety',
      desc: 'Dynamic re-routing algorithms that evaluate monsoon rainfall, terrain slope stability, and landslide hazards in real time.',
      icon: Cpu,
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
      badge: 'AI Engine'
    },
    {
      title: 'Disaster & Hazard Alert Network',
      desc: 'Instant broadcasts for flash floods, rockslides, fog, and bridge blockages synchronized with BRO, SDRF, and State EOCs.',
      icon: AlertTriangle,
      color: 'from-red-500/20 to-amber-500/20 text-red-400 border-red-500/30',
      badge: 'BRO / SDRF Sync'
    },
    {
      title: 'District Accessibility Matrix',
      desc: 'Live connectivity scoring and isolation vulnerability indices for all 8 Northeastern states to safeguard supply chains.',
      icon: Activity,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      badge: '8 States Cover'
    },
    {
      title: 'Local Officer Verification Protocol',
      desc: 'Decentralized road status updates, ground clearance tracking, and emergency priority convoy clearances from field officers.',
      icon: Shield,
      color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
      badge: 'Field Clearance'
    },
    {
      title: 'Supply Chain Resiliency Analytics',
      desc: 'Critical stockpiles monitoring for medical supplies, food grains (PDS), and fuel with delay impact forecasting.',
      icon: Package,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
      badge: 'Cold Chain & Fuel'
    }
  ];

  const rolePortals = [
    {
      role: 'admin',
      path: '/admin',
      title: 'Regional Admin Command',
      desc: 'Full operational control, fleet roster CRUD, emergency mode triggers, and regional corridor telemetry.',
      icon: Shield,
      theme: 'border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20',
      btnColor: 'bg-indigo-600 hover:bg-indigo-500 text-white'
    },
    {
      role: 'driver',
      path: '/driver',
      title: 'Driver Telemetry & Navigation',
      desc: 'Turn-by-turn route maps, trip ETA, live hazard notifications, vehicle status, and base station chat.',
      icon: Truck,
      theme: 'border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/20',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white'
    },
    {
      role: 'officer',
      path: '/officer',
      title: 'Local Officer Incident Hub',
      desc: 'Verify field hazard reports, update highway pass conditions, and manage local district isolation risks.',
      icon: MapPin,
      theme: 'border-amber-500/40 hover:border-amber-400 bg-amber-950/20',
      btnColor: 'bg-amber-600 hover:bg-amber-500 text-white'
    },
    {
      role: 'supply',
      path: '/supply',
      title: 'Supply & Freight Logistics',
      desc: 'Monitor freight flows, delayed delivery mitigation, high-risk routes, and essential commodity reserves.',
      icon: Package,
      theme: 'border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20',
      btnColor: 'bg-cyan-600 hover:bg-cyan-500 text-white'
    }
  ];

  const corePages = [
    { path: '/map', label: 'GIS Operations Map', desc: 'Live multi-layer geospatial map with road passes & GPS tracking.', icon: Map, color: 'text-cyan-400' },
    { path: '/risk', label: 'Disaster Hazard Center', desc: 'Live alerts, rockslides, floods & BRO emergency updates.', icon: AlertTriangle, color: 'text-red-400' },
    { path: '/analyzer', label: 'AI Route Optimizer', desc: 'Neural corridor evaluation & automated bypass generation.', icon: Compass, color: 'text-indigo-400' },
    { path: '/incidents', label: 'Incident Reporting Log', desc: 'Log ground disruptions, road washouts & clearance ops.', icon: FileText, color: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[400px] bg-blue-600/15 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[400px] sm:w-[600px] h-[400px] bg-cyan-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 right-0 w-[400px] sm:w-[500px] h-[400px] bg-indigo-600/15 blur-[140px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-8 pb-14 sm:pt-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Status Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs text-cyan-300 shadow-lg shadow-cyan-500/10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-semibold tracking-wide uppercase text-[10px] sm:text-[11px] text-center">
              AI Smart Logistics & Accessibility Platform for NER
            </span>
          </div>
        </div>

        {/* Hero Title & Subtext */}
        <div className="text-center space-y-4 sm:space-y-6 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.15]">
            Uninterrupted Supply Chains Across{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Northeastern Terrain
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
            NER SHIELD integrates real-time GIS telemetry, landslide & flood hazard AI prediction, and role-based incident clearance to ensure critical medicine, food grains, and fuel reach every remote hill district.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all hover:scale-105"
            >
              <span>Access Role Portals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/admin"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Launch Command Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Live Key Metrics Banner */}
        <div className="mt-10 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
          <div className="p-3 text-center border-r border-slate-800/80 last:border-0 min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">Active Fleet</p>
            <p className="text-xl sm:text-3xl font-black text-cyan-400 font-mono mt-1">{vehicles.length} Trucks</p>
            <span className="text-[10px] text-emerald-400 font-medium">94% On-Route</span>
          </div>

          <div className="p-3 text-center border-r border-slate-800/80 last:border-0 min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">Monitored Corridors</p>
            <p className="text-xl sm:text-3xl font-black text-white font-mono mt-1">19 Routes</p>
            <span className="text-[10px] text-cyan-400 font-medium">8 NER States</span>
          </div>

          <div className="p-3 text-center border-r border-slate-800/80 last:border-0 min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">Hazard Alerts</p>
            <p className="text-xl sm:text-3xl font-black text-red-400 font-mono mt-1">{alerts.length}</p>
            <span className="text-[10px] text-red-400 font-medium">Dima Hasao P1</span>
          </div>

          <div className="p-3 text-center min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">AI Safety Index</p>
            <p className="text-xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">98.2%</p>
            <span className="text-[10px] text-emerald-400 font-medium">+1.4% Optimal</span>
          </div>
        </div>

      </section>

      {/* Core Pages & Navigation Showcase */}
      <section className="py-12 sm:py-16 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Operational Pages & Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Access dedicated tools for live geospatial mapping, hazard feeds, AI route optimization, and incident logging.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {corePages.map((page) => {
              const Icon = page.icon;
              return (
                <Link
                  key={page.path}
                  to={page.path}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all hover:-translate-y-1 shadow-lg group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-slate-700">
                      <Icon className={`w-5 h-5 ${page.color}`} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {page.label}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {page.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role-Based Portals Section */}
      <section className="py-14 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Role-Based Operations Portals
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select your operational role to launch specialized intelligence tools, telemetry feeds, and dispatch controls.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {rolePortals.map((portal) => {
              const Icon = portal.icon;
              return (
                <div
                  key={portal.role}
                  className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-lg ${portal.theme}`}
                >
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-md">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{portal.title}</h3>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">{portal.desc}</p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleSelectRoleAndNavigate(portal.role, portal.path)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 ${portal.btnColor} cursor-pointer`}
                    >
                      <span>Enter as {portal.role.toUpperCase()}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-14 sm:py-20 bg-slate-900/40 border-t border-slate-800/80 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Key Platform Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Northeast Terrain Challenges
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Overcoming torrential monsoons, landslide chokepoints, remote valley isolation, and difficult mountain passes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {featureCards.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-5 sm:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/5 space-y-3 sm:space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 sm:p-3 rounded-xl bg-gradient-to-br border ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {feat.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Regional Northeast Coverage Matrix */}
      <section className="py-14 sm:py-16 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Regional Grid Status
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                8 Northeast States Monitored Live
              </h2>
            </div>
            <Link
              to="/admin"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>View full district accessibility matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {districts.map((d) => (
              <div
                key={d.id}
                className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-2 min-w-0"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white truncate">{d.state}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold shrink-0 ${
                      d.status === 'OPTIMAL'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : d.status === 'CRITICAL_BOTTLENECK' || d.status === 'ISOLATED'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{d.name}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Score: <strong className="text-white">{d.accessibilityScore}%</strong></span>
                  <span className="text-cyan-400 truncate ml-1">{d.primaryHighways[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsive Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 sm:py-12 text-slate-400 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 p-1 flex items-center justify-center shadow-md">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-sm">NER SHIELD</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Integrated AI Logistics, Disaster Resilience, and Accessibility Platform for the North Eastern Region of India.
              </p>
              <div className="text-[11px] text-slate-500">
                Government of India • Ministry of DoNER Support Prototype
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Dashboards & Portals</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={() => handleSelectRoleAndNavigate('admin', '/admin')} className="hover:text-cyan-400">
                    Regional Admin Command
                  </button>
                </li>
                <li>
                  <button onClick={() => handleSelectRoleAndNavigate('driver', '/driver')} className="hover:text-cyan-400">
                    Driver Telemetry & Maps
                  </button>
                </li>
                <li>
                  <button onClick={() => handleSelectRoleAndNavigate('officer', '/officer')} className="hover:text-cyan-400">
                    Local District Officer Hub
                  </button>
                </li>
                <li>
                  <button onClick={() => handleSelectRoleAndNavigate('supply', '/supply')} className="hover:text-cyan-400">
                    Supply Chain Department
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Emergency Helplines</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center space-x-2 text-slate-300">
                  <PhoneCall className="w-3 h-3 text-red-400 shrink-0" />
                  <span>NER Disaster EOC: 1070 / 1077</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-300">
                  <PhoneCall className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>BRO Highway Rescue: 1800-111-276</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-300">
                  <PhoneCall className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>SDRF Flood Helpline: 112</span>
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Northeast Corridors</h4>
              <div className="flex flex-wrap gap-1.5">
                {['NH-27 (East-West)', 'NH-6 (Dima Hasao)', 'NH-29 (Kohima)', 'NH-306 (Aizawl)', 'NH-13 (Arunachal)', 'NH-10 (Sikkim)'].map((h, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                    {h}
                  </span>
                ))}
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© 2026 NER SHIELD – AI Smart Logistics & Accessibility Platform. All rights reserved.</p>
            <p className="font-mono text-[10px]">Real-Time SAT Telemetry • Level-1 Ready</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;

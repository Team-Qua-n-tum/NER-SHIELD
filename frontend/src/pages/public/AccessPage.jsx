import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, CheckCircle2, ArrowRight, Building2, Key, HelpCircle } from 'lucide-react';

export const AccessPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-black text-white tracking-tight">NER-SHIELD ACCESS</span>
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
          >
            Sign In to Portal
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-mono">
            <Key className="w-3.5 h-3.5" />
            GOVERNMENT & AGENCY CREDENTIALING
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            NER Logistics Command Access Directory
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            NER-SHIELD operational data and routing controls are restricted to authorized government personnel,
            district disaster authorities (DDMA), Border Roads Organisation (BRO), and accredited supply convoys.
          </p>
        </div>

        {/* Roles Directory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Admin Regional Command</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full operational visibility over 8 Northeast states, real-time fleet dispatch, clearance protocols,
              and cross-border corridor coordination.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">Scope: All Northeast Districts (*)</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Building2 className="w-4 h-4" />
              <span>District Disaster Officers (DDMA)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Assigned district incident verification, local road status updates (open/blocked/partial),
              emergency supply route clearance.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">Scope: Assigned district jurisdictions</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Field Highway Officers & Patrol</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mobile-first hazard reporting, GPS road blockage capture, landslide tagging, and tracking own report statuses.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">Scope: Field sector patrol areas</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Lock className="w-4 h-4" />
              <span>Logistics & Freight Operators</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fleet management, commodity routing (medicine, food, fuel), alternate bypass recalculation, and corridor alerts.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">Scope: Assigned convoy vehicle IDs</div>
          </div>
        </div>

        {/* Access Request / Instructions */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-base font-bold text-white">Need Access Credentials?</h2>
            <p className="text-xs text-slate-400">
              Department officers can request access through the Ministry of Development of North Eastern Region (MDoNER).
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-600/20 shrink-0"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
        <p>© 2026 NER-SHIELD. Ministry of Development of North Eastern Region (MDoNER).</p>
      </footer>
    </div>
  );
};

export default AccessPage;

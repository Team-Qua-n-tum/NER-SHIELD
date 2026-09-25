import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';

export const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-black text-white tracking-tight">NER-SHIELD PRIVACY</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            DATA INTEGRITY & OPERATIONAL SECURITY
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            NER-SHIELD Privacy & Operational Data Policy
          </h1>
          <p className="text-xs text-slate-500 font-mono">Effective: 2026-09-25 · Classification: Government Official</p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              1. Public Surface Minimization Rule
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Public routes of NER-SHIELD never expose live telemetry, vehicle GPS coordinates, convoy cargo manifests,
              unverified incident details, or emergency route paths. The public surface is restricted strictly to
              anonymized capability indicators and official disaster advisories.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              2. Role-Based Data Scoping
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Operational datasets are strictly scoped by assigned administrative boundaries:
            </p>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li><strong>Field Patrols:</strong> GPS coordinates collected exclusively during verified incident submissions.</li>
              <li><strong>District Officers:</strong> Data access strictly bound to assigned district boundaries and connecting corridors.</li>
              <li><strong>Logistics Operators:</strong> Telemetry accessible only for assigned emergency convoy vehicles.</li>
              <li><strong>Viewer:</strong> Publicly cleared summaries with precision degradation to prevent tactical disclosure.</li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              3. Telemetry Retention & Audit Logging
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              All incident verifications, road status modifications, emergency reroute dispatches, and level-1 protocol
              activations produce tamper-evident audit logs including timestamp, operator role, and action scope.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
        <p>© 2026 NER-SHIELD. Ministry of Development of North Eastern Region (MDoNER).</p>
      </footer>
    </div>
  );
};

export default PrivacyPage;

import React from 'react';
import { HelpCircle, Phone, BookOpen, ShieldAlert, Radio, Compass, FileText } from 'lucide-react';

export const HelpPage = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-cyan-400" />
          <span>NER Logistics Support & Operations Manual</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Operating procedures, emergency radio channels, and regional command escalation protocols.
        </p>
      </div>

      {/* Emergency Hotline Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <Phone className="w-4 h-4 animate-pulse" />
            <span>24/7 Regional Command Emergency Hotline</span>
          </div>
          <p className="text-xs text-slate-300">
            Guwahati Central Logistics Command Desk · Direct BRO / SDRF Bridge Link
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-red-600 text-white font-mono font-black text-sm tracking-wider shadow-lg shadow-red-600/30">
          +91 (361) 223-9000
        </div>
      </div>

      {/* Quick Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Reporting a Corridor Blockage</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Field patrol officers can submit live hazard reports with GPS coordinates under the "Report Incident" link.
            Reports immediately notify District Disaster Management Officers (DDMA) for verification.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Compass className="w-4 h-4" />
            <span>AI Route Optimization</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            When major corridors like NH-6 (Barapani / Dima Hasao) face landslides, Logistics Operators can compute
            safe alternate corridors (e.g. NH-27 bypass) with live ETA delay breakdown and risk scores.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Radio className="w-4 h-4" />
            <span>Radio Dispatch Protocols</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            In areas with zero cellular reception, drivers are advised to switch VHF emergency transceivers to Channel 16
            (Regional Disaster Net). Satellite relays update convoy telemetry every 15 minutes.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <FileText className="w-4 h-4" />
            <span>Audit Trail & Road Status</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every verification and road status change is logged with officer identity and timestamp to ensure complete
            inter-agency coordination across all 8 Northeastern states.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;

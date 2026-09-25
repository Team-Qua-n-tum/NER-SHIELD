import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { FilePlus, FileText, Map, ShieldCheck, AlertTriangle, Radio, Navigation, CheckCircle2 } from 'lucide-react';

export const FieldHomePage = () => {
  const { user } = useAuth();
  const { incidents, alerts } = useApp();

  const myReports = incidents.filter(
    (inc) => inc.reportedBy === user?.id || inc.verifiedBy?.includes(user?.name) || inc.reportedBy === 'me'
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full min-w-0">
      {/* Officer Status Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                PATROL ACTIVE · HIGHWAY SECTOR
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Field Officer Patrol Portal
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Officer: <strong>{user?.name || 'Ramesh Kumar'}</strong> · Patrol Area: Dima Hasao
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="pt-2">
          <Link
            to="/app/field/report/new"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-xl shadow-cyan-500/20 active:scale-[0.99]"
          >
            <FilePlus className="w-5 h-5" />
            <span>REPORT ROAD DISRUPTION OR HAZARD</span>
          </Link>
        </div>
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/app/field/reports"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-center"
        >
          <FileText className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
          <div className="text-xs font-bold text-white">My Reports</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{myReports.length} Submitted</div>
        </Link>
        <Link
          to="/app/field/map"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-center"
        >
          <Map className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
          <div className="text-xs font-bold text-white">Area Map</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sector GPS</div>
        </Link>
        <Link
          to="/app/field/safety"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-center"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
          <div className="text-xs font-bold text-white">Safety SOP</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Hazard Guide</div>
        </Link>
        <Link
          to="/app/notifications"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-center"
        >
          <Radio className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
          <div className="text-xs font-bold text-white">Alerts Feed</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{alerts.length} Active</div>
        </Link>
      </div>

      {/* Nearby Active Hazards */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Active Highway Hazards in Your Sector</span>
        </h2>

        <div className="space-y-3">
          {alerts.slice(0, 3).map((a) => (
            <div key={a.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{a.title}</span>
                <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10">
                  {a.severity}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{a.location} · {a.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FieldHomePage;

import React from 'react';
import { ClipboardList, Shield, Clock, User, CheckCircle2 } from 'lucide-react';

const AUDIT_EVENTS = [
  { id: 'AUD-892', action: 'Road Status Updated', target: 'NH-6 Km 142 (Dima Hasao)', actor: 'Col. Sanjeev Hazarika (admin)', timestamp: '10 mins ago', status: 'Success' },
  { id: 'AUD-891', action: 'Emergency Reroute Dispatched', target: 'VEH-101 / VEH-102 via NH-27', actor: 'N. Debbarma (logistics_operator)', timestamp: '24 mins ago', status: 'Success' },
  { id: 'AUD-890', action: 'Incident Verified', target: 'INC-2026-042 (Landslide at Barapani)', actor: 'Inspector Debajit Barman (district_officer)', timestamp: '45 mins ago', status: 'Success' },
  { id: 'AUD-889', action: 'Incident Logged', target: 'INC-2026-042 (Landslide Report)', actor: 'Ramesh Kumar (field_officer)', timestamp: '1 hour ago', status: 'Success' },
  { id: 'AUD-888', action: 'Emergency Mode Toggled', target: 'Level-1 Regional Protocol Active', actor: 'Col. Sanjeev Hazarika (admin)', timestamp: '2 hours ago', status: 'Authorized' },
  { id: 'AUD-887', action: 'User Session Initiated', target: 'Portal Login', actor: 'district@ner-shield.demo', timestamp: '3 hours ago', status: 'Success' },
];

export const AdminAuditPage = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-indigo-400" />
          <span>Regional Operations Audit Trail</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable event log tracking incident verifications, road status mutations, and dispatch directives.
        </p>
      </div>

      {/* Events Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4">Event ID</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target Resource</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Time</th>
                <th className="p-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {AUDIT_EVENTS.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 text-cyan-400 font-bold whitespace-nowrap">{evt.id}</td>
                  <td className="p-4 font-bold text-white whitespace-nowrap">{evt.action}</td>
                  <td className="p-4 text-slate-300 font-sans">{evt.target}</td>
                  <td className="p-4 text-slate-400 whitespace-nowrap">{evt.actor}</td>
                  <td className="p-4 text-slate-500 whitespace-nowrap">{evt.timestamp}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      {evt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditPage;

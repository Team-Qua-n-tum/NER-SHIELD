import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  Filter,
  ArrowRight,
  Radio,
  Compass
} from 'lucide-react';

export const NotificationPanel = ({ isOpen, onClose, onLocateAlert }) => {
  const { alerts, showToast } = useApp();
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());

  if (!isOpen) return null;

  const handleAcknowledge = (alertId) => {
    setAcknowledgedAlerts((prev) => {
      const next = new Set(prev);
      next.add(alertId);
      return next;
    });
    showToast(`Alert ${alertId} acknowledged and flagged as monitored.`, 'info');
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter === 'ALL') return true;
    return alert.severity.toLowerCase() === severityFilter.toLowerCase();
  });

  const getSeverityStyle = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-300',
          badge: 'bg-red-500 text-white animate-pulse',
          icon: ShieldAlert,
        };
      case 'high':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          badge: 'bg-amber-500 text-slate-950',
          icon: AlertTriangle,
        };
      case 'moderate':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
          badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
          icon: Clock,
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
          badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
          icon: Bell,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  NER Emergency & Hazard Feed
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {filteredAlerts.length} Active Hazard Notifications
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Severity Filters */}
          <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto text-xs">
            {['ALL', 'Critical', 'High', 'Moderate'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  severityFilter === sev
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Alert Feed Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                No active hazard notifications matching current filter.
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const style = getSeverityStyle(alert.severity);
                const Icon = style.icon;
                const isAck = acknowledgedAlerts.has(alert.id);

                return (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-3.5 space-y-2.5 transition-all ${style.bg} ${
                      isAck ? 'opacity-60 border-slate-700' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {alert.id}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {alert.time}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white leading-snug">
                        {alert.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="truncate">{alert.location}</span>
                    </div>

                    {alert.recommendedAction && (
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-cyan-300">
                        <span className="font-semibold text-slate-400">Action: </span>
                        {alert.recommendedAction}
                      </div>
                    )}

                    {alert.affectedCommodities && alert.affectedCommodities.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {alert.affectedCommodities.map((c, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <button
                        onClick={() => {
                          if (onLocateAlert) onLocateAlert(alert);
                          onClose();
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Locate on Map</span>
                      </button>

                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={isAck}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          isAck
                            ? 'bg-slate-800 text-slate-500'
                            : 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isAck ? 'Acknowledged' : 'Acknowledge'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">
              Integrated with NER State EOC, BRO & SDRF Units
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;

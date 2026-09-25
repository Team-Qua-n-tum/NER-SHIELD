import React, { useState } from 'react';
import { Bell, Radio, CheckCircle2, AlertTriangle, Shield, Settings, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const NotificationsPage = () => {
  const { alerts, showToast } = useApp();
  const { user } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleTogglePush = () => {
    setPushEnabled(!pushEnabled);
    showToast(
      !pushEnabled
        ? 'Browser emergency push dispatch channel registered.'
        : 'Browser emergency push dispatch notifications paused.',
      'info'
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-400" />
          <span>Notification & Broadcast Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure real-time push alerts, corridor disaster broadcasts, and radio dispatch subscriptions.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Radio className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
              <label htmlFor="toggle-push-dispatch" className="cursor-pointer">
                Browser Push Dispatch
              </label>
            </div>
            <button
              id="toggle-push-dispatch"
              type="button"
              aria-pressed={pushEnabled}
              aria-label={`Browser Push Dispatch, currently ${pushEnabled ? 'enabled' : 'disabled'}. Click to ${pushEnabled ? 'disable' : 'enable'}.`}
              onClick={handleTogglePush}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                pushEnabled
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  pushEnabled ? 'bg-cyan-400 ring-2 ring-cyan-400/30' : 'bg-slate-500'
                }`}
                aria-hidden="true"
              />
              <span>{pushEnabled ? 'Emergency alerts enabled' : 'Emergency alerts disabled'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Receive immediate background alerts when high-severity landslides, bridge closures, or corridor blockages occur in your assigned district.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <label htmlFor="toggle-audio-chime" className="cursor-pointer">
                Audio Dispatch Chime
              </label>
            </div>
            <button
              id="toggle-audio-chime"
              type="button"
              aria-pressed={soundEnabled}
              aria-label={`Audio Dispatch Chime, currently ${soundEnabled ? 'enabled' : 'disabled'}. Click to ${soundEnabled ? 'disable' : 'enable'}.`}
              onClick={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                showToast(
                  nextState
                    ? 'Audio dispatch chime enabled for emergency alerts.'
                    : 'Audio dispatch chime muted.',
                  'info'
                );
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                soundEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  soundEnabled ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-slate-500'
                }`}
                aria-hidden="true"
              />
              <span>{soundEnabled ? 'Audio dispatch chime enabled' : 'Audio dispatch chime disabled'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Play an audible alert chime upon receiving urgent priority reroute advisories and Level-1 logistics emergency declarations.
          </p>
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Active Feed Dispatch History ({alerts.length})</span>
        </h2>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border ${
                alert.severity === 'Critical'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-white">{alert.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{alert.location} · {alert.time}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    alert.severity === 'Critical'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">{alert.description || alert.recommendedAction}</p>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-500">
              No active notification alerts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

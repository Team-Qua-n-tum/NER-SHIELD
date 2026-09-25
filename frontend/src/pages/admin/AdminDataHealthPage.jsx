import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, Server, Database, CheckCircle2, XCircle, RefreshCw, Wifi } from 'lucide-react';
import { ApiClient } from '../../lib/api/client';
import { useAuth } from '../../context/AuthContext';
import { DataModeBadge } from '../../components/auth/DataModeBadge';

export const AdminDataHealthPage = () => {
  const { dataMode } = useAuth();
  const [backendStatus, setBackendStatus] = useState('checking');
  const [latency, setLatency] = useState(null);

  const checkHealth = async () => {
    setBackendStatus('checking');
    const start = performance.now();
    try {
      const ok = await ApiClient.checkBackendHealth();
      setLatency(Math.round(performance.now() - start));
      setBackendStatus(ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
      setLatency(null);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>System Telemetry & Data Health</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time API connectivity, data mode status, latency, and telemetry ingestion pipeline metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataModeBadge mode={dataMode} />
          <button
            onClick={checkHealth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-check</span>
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono">FastAPI Backend</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2">
            {backendStatus === 'online' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-lg font-black text-white">Online & Healthy</span>
              </>
            ) : backendStatus === 'checking' ? (
              <span className="text-lg font-black text-slate-400">Verifying...</span>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-lg font-black text-red-400">Offline / Degraded</span>
              </>
            )}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Target: {ApiClient.getBaseUrl()}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono">Endpoint Latency</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {latency !== null ? `${latency} ms` : '—'}
          </div>
          <p className="text-[10px] text-slate-500">FastAPI health probe response time</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono">OSRM Engine</span>
            <Wifi className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-white">Public OSM Routing</div>
          <p className="text-[10px] text-slate-500">Real road coordinates via OpenStreetMap</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDataHealthPage;

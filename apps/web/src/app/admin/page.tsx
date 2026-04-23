'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ProvisionLog {
  timestamp: string;
  package_slug: string;
  token_preview: string;
}

interface TelemetryLog {
  timestamp: string;
  environment: string;
  zeroclaw_status: string;
  google_auth: string;
  openrouter_status: string;
  battery_percentage: string;
  error_count: number;
}

export default function AdminDashboard() {
  const [provisions, setProvisions] = useState<ProvisionLog[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.18:3000';
        const [provRes, telRes] = await Promise.all([
          fetch(`${apiUrl}/api/provision`).then(res => res.ok ? res.json() : { logs: [] }),
          fetch(`${apiUrl}/api/telemetry`).then(res => res.ok ? res.json() : { logs: [] })
        ]);
        
        // Reverse to show newest first
        setProvisions((provRes.logs || []).reverse());
        setTelemetry((telRes.logs || []).reverse());
      } catch (e) {
        console.error('Failed to fetch admin data', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    // Poll every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Calculate most popular package
  const popularity = provisions.reduce((acc, log) => {
    acc[log.package_slug] = (acc[log.package_slug] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const popularPackages = Object.entries(popularity).sort((a, b) => b[1] - a[1]);
  const totalTokens = provisions.length;
  const errorDevices = telemetry.filter(t => t.error_count > 0).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">ZeroClaw Fleet Command</h1>
            <p className="text-neutral-400 mt-1">Real-time provisioning and telemetry dashboard.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/" className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium">
              Exit to Storefront
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-2 bg-neutral-800 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-2 bg-neutral-800 rounded col-span-2"></div>
                  <div className="h-2 bg-neutral-800 rounded col-span-1"></div>
                </div>
                <div className="h-2 bg-neutral-800 rounded"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-neutral-500 text-sm font-medium mb-2">Total Tokens Provisioned</h3>
                <p className="text-4xl font-black text-white">{totalTokens}</p>
              </div>
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-neutral-500 text-sm font-medium mb-2">Most Popular Package</h3>
                <p className="text-2xl font-bold text-emerald-400">
                  {popularPackages.length > 0 ? popularPackages[0][0] : 'None'}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {popularPackages.length > 0 ? `${popularPackages[0][1]} active tokens` : 'Awaiting data'}
                </p>
              </div>
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
                <h3 className="text-neutral-500 text-sm font-medium mb-2">Nodes Requiring Repair</h3>
                <p className="text-4xl font-black text-white">{errorDevices}</p>
                {errorDevices > 0 && (
                  <div className="absolute top-0 right-0 p-4">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Provisioned Tokens Table */}
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Recent Provisioned Tokens</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-neutral-500 border-b border-neutral-800">
                        <th className="pb-3 font-medium">Timestamp</th>
                        <th className="pb-3 font-medium">Package</th>
                        <th className="pb-3 font-medium">Token Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                      {provisions.length === 0 ? (
                        <tr><td colSpan={3} className="py-4 text-center text-neutral-600">No tokens provisioned yet.</td></tr>
                      ) : (
                        provisions.slice(0, 10).map((log, i) => (
                          <tr key={i} className="hover:bg-neutral-800/20 transition-colors">
                            <td className="py-4 text-neutral-400">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="py-4 font-medium text-emerald-400">{log.package_slug}</td>
                            <td className="py-4 text-neutral-500 font-mono text-xs">{log.token_preview}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Telemetry Feed */}
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Device Health Telemetry</h2>
                <div className="space-y-4">
                  {telemetry.length === 0 ? (
                    <div className="text-center py-8 text-neutral-600 border border-dashed border-neutral-800 rounded-xl">
                      Waiting for incoming doctor pings...
                    </div>
                  ) : (
                    telemetry.slice(0, 6).map((log, i) => (
                      <div key={i} className={`p-4 rounded-xl border ${log.error_count > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-neutral-950 border-neutral-800'} flex items-start justify-between`}>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-neutral-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.environment === 'Termux' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>
                              {log.environment}
                            </span>
                          </div>
                          <div className="text-sm text-neutral-300 grid grid-cols-2 gap-x-4 gap-y-1">
                            <div><span className="text-neutral-500">Google:</span> {log.google_auth}</div>
                            <div><span className="text-neutral-500">Daemon:</span> {log.zeroclaw_status}</div>
                            <div><span className="text-neutral-500">Battery:</span> {log.battery_percentage}%</div>
                            <div><span className="text-neutral-500">LLM:</span> {log.openrouter_status}</div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {log.error_count > 0 ? (
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-500/20 text-red-500 font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                              {log.error_count}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

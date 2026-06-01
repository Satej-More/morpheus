'use client';
import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Activity, TrendingDown, Server, Layers, RefreshCw, Play } from 'lucide-react';
import { Sidebar, TopBar } from '../../components/layout/Sidebar';
import { AgentOrb } from '../../components/dashboard/AgentOrb';
import { TopologyGraph } from '../../components/dashboard/TopologyGraph';
import { IncidentCard } from '../../components/incident/IncidentCard';
import { ReasoningStream } from '../../components/reasoning/ReasoningStream';
import { MetricPanel, MttrComparisonChart } from '../../components/charts/MetricCharts';
import { useAgentStatus, useLiveIncidents, useSystemHealth, useReasoningStream } from '../../hooks';
import { mockMttrData, mockIncidents } from '../../mock/data';
import { formatDuration } from '../../lib/utils';

function StatCard({ label, value, sub, color, icon: Icon }: any) {
  return (
    <div className="bg-[#0d1520] rounded-xl border border-[#1e2d3d] p-4 hover:border-[#2a3a4d] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
        </div>
      </div>
      <p className="text-xs text-[#8892a4] uppercase tracking-widest font-mono">{label}</p>
      {sub && <p className="text-[10px] text-[#2a3a4d] font-mono mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const agentStatus = useAgentStatus();
  const incidents = useLiveIncidents();
  const health = useSystemHealth();
  const { lines, isRunning, isComplete, start, reset } = useReasoningStream();
  const [tab, setTab] = useState<'all' | 'active' | 'resolved'>('all');

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved');
  const filtered = tab === 'all' ? incidents : tab === 'active' ? activeIncidents : resolvedIncidents;

  const primaryIncident = mockIncidents[0];

  return (
    <div className="flex min-h-screen bg-[#0A0E17]">
      <Sidebar />
      <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
        <TopBar title="Command Center" subtitle="Real-time incident detection and autonomous resolution" />

        <div className="flex-1 p-6 space-y-6 overflow-auto">

          {/* Agent hero row */}
          <div className="grid grid-cols-4 gap-4">
            {/* Agent status card */}
            <div className="col-span-1 bg-[#0d1520] rounded-xl border border-[#1e2d3d] p-5 flex flex-col items-center justify-center gap-4">
              <AgentOrb state={agentStatus.state} size="lg" showLabel={false} />
              <div className="text-center">
                <div className="text-[10px] text-[#8892a4] uppercase tracking-widest font-mono mb-0.5">Agent Status</div>
                <div className="text-sm font-semibold text-[#00D4FF] capitalize">{agentStatus.state}</div>
                <div className="text-[9px] text-[#8892a4] font-mono mt-1 max-w-[140px] text-center leading-relaxed">
                  {agentStatus.currentTask}
                </div>
              </div>
            </div>

            {/* Stats */}
            <StatCard label="Active Incidents" value={activeIncidents.length}
              sub="2 critical, 0 high" color="#FF3B3B" icon={AlertTriangle} />
            <StatCard label="Avg MTTR" value={`${formatDuration(agentStatus.avgResolutionTime)}`}
              sub="↓ 94% vs manual" color="#00D4FF" icon={Clock} />
            <StatCard label="Resolved Today" value={agentStatus.incidentsResolved}
              sub="All autonomous" color="#00FF88" icon={CheckCircle2} />
          </div>

          {/* Active critical alert banner */}
          {activeIncidents.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 animate-in"
              style={{ boxShadow: '0 0 20px rgba(255,59,59,0.15)' }}>
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute h-2 w-2 rounded-full bg-[#FF3B3B] opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-[#FF3B3B]" />
                </span>
                <div>
                  <span className="text-sm font-semibold text-[#FF3B3B]">[P1] payments-api latency spike</span>
                  <span className="text-xs text-[#8892a4] ml-3 font-mono">Morpheus investigating — 87% confidence on root cause</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#FF3B3B] px-2 py-1 rounded bg-[#FF3B3B]/10 border border-[#FF3B3B]/20">CRITICAL</span>
              </div>
            </div>
          )}

          {/* Main content grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left: incidents + reasoning */}
            <div className="col-span-2 space-y-6">

              {/* Reasoning stream */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#E8EDF5]">Live Reasoning Feed</h2>
                    <p className="text-[10px] text-[#8892a4] font-mono">Morpheus autonomous investigation stream</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={reset}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e2d3d] text-[#8892a4] text-xs hover:text-[#E8EDF5] hover:border-[#2a3a4d] transition-colors">
                      <RefreshCw size={11} /> Reset
                    </button>
                    <button onClick={start} disabled={isRunning}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 text-[#FF3B3B] text-xs hover:bg-[#FF3B3B]/20 transition-colors disabled:opacity-50">
                      <Play size={11} /> Simulate Incident
                    </button>
                  </div>
                </div>
                <ReasoningStream lines={lines} isRunning={isRunning} isComplete={isComplete} onStart={start} compact />
              </div>

              {/* Incident feed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[#E8EDF5]">Incident Feed</h2>
                  <div className="flex gap-1 p-1 bg-[#0d1520] rounded-lg border border-[#1e2d3d]">
                    {(['all', 'active', 'resolved'] as const).map(t => (
                      <button key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 py-1 rounded text-[10px] uppercase tracking-widest font-mono transition-all
                          ${tab === t ? 'bg-[#1e2d3d] text-[#E8EDF5]' : 'text-[#8892a4] hover:text-[#E8EDF5]'}`}>
                        {t}
                        {t === 'active' && activeIncidents.length > 0 && (
                          <span className="ml-1.5 text-[#FF3B3B]">{activeIncidents.length}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {filtered.map(inc => <IncidentCard key={inc.id} incident={inc} />)}
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-2 gap-4">
                <MetricPanel label="Error Rate" value="23.4%" delta="22.6%" deltaPositive={false}
                  data={primaryIncident.metrics.errorRate} color="#FF3B3B" metric="errorRate" threshold={5} />
                <MetricPanel label="Latency P99" value="4,847ms" delta="4,602ms" deltaPositive={false}
                  data={primaryIncident.metrics.latency} color="#FFB800" metric="latency" threshold={500} />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">

              {/* Topology graph */}
              <div className="bg-[#0d1520] rounded-xl border border-[#1e2d3d] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1e2d3d] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={13} className="text-[#00D4FF]" />
                    <span className="text-xs font-semibold text-[#E8EDF5]">Service Topology</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" /> Healthy</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" /> Degraded</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF3B3B]" /> Down</span>
                  </div>
                </div>
                <div className="h-64">
                  <TopologyGraph services={health.services} />
                </div>
              </div>

              {/* MTTR comparison */}
              <div className="bg-[#0d1520] rounded-xl border border-[#1e2d3d] p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-semibold text-[#E8EDF5]">MTTR Comparison</h3>
                    <p className="text-[9px] text-[#8892a4] font-mono mt-0.5">Morpheus vs manual response</p>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2 h-1 rounded bg-[#00D4FF]" /> Morpheus</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-1 rounded bg-[#FF3B3B]/60" /> Manual</span>
                  </div>
                </div>
                <MttrComparisonChart data={mockMttrData} />
              </div>

              {/* Memory & CPU */}
              <MetricPanel label="JVM Heap Memory" value="5.4 GB" delta="3.3 GB" deltaPositive={false}
                data={primaryIncident.metrics.memory} color="#A78BFA" metric="memory" threshold={4000} />

              {/* Recent deployments */}
              <div className="bg-[#0d1520] rounded-xl border border-[#1e2d3d] p-4">
                <h3 className="text-xs font-semibold text-[#E8EDF5] mb-3">Recent Deployments</h3>
                <div className="space-y-2.5">
                  {[
                    { service: 'payments-api', version: 'v2.3.1', author: 'sarah.chen', status: 'rollback', when: '16m ago' },
                    { service: 'auth-service', version: 'v1.8.0', author: 'bob.kim', status: 'success', when: '2h ago' },
                    { service: 'checkout-service', version: 'v3.1.2', author: 'alice.wu', status: 'success', when: '5h ago' },
                  ].map(d => (
                    <div key={d.version} className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-[#E8EDF5] text-[11px]">{d.service}</span>
                        <span className="text-[#8892a4] text-[10px] ml-2">@{d.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#8892a4]">{d.when}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                          d.status === 'rollback' ? 'bg-[#FF3B3B]/20 text-[#FF3B3B]' :
                          'bg-[#00FF88]/10 text-[#00FF88]'
                        }`}>{d.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

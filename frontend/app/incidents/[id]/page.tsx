'use client';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Server, GitBranch, Bell, Database, ChevronDown, ChevronRight, ExternalLink, Terminal, Cpu } from 'lucide-react';
import Link from 'next/link';
import { Sidebar, TopBar } from '../../../components/layout/Sidebar';
import { AgentOrb } from '../../../components/dashboard/AgentOrb';
import { ReasoningStream } from '../../../components/reasoning/ReasoningStream';
import { FullMetricChart, MetricSparkline } from '../../../components/charts/MetricCharts';
import { mockIncidents } from '../../../mock/data';
import {
  formatTimeAgo, formatDuration, formatTimestamp,
  getSeverityColor, getSeverityBg, getStatusColor
} from '../../../lib/utils';
import { useReasoningStream, useElapsedTime } from '../../../hooks';
import type { ReasoningStep, AgentAction, LogEntry } from '../../../types';

function ReasoningStepRow({ step, isLast }: { step: ReasoningStep; isLast: boolean }) {
  const [expanded, setExpanded] = useState(step.status === 'running');

  const statusColor = {
    complete: '#00FF88', running: '#FFB800', pending: '#2a3a4d', failed: '#FF3B3B',
  }[step.status];

  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-7 h-7 rounded-full flex items-center justify-center border-2 relative z-10 bg-[#0a0e17]"
          style={{ borderColor: statusColor }}>
          {step.status === 'complete' ? (
            <CheckCircle2 size={12} style={{ color: statusColor }} />
          ) : step.status === 'running' ? (
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
          ) : step.status === 'failed' ? (
            <span className="text-[10px]" style={{ color: statusColor }}>✕</span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
          )}
        </div>
        {!isLast && <div className="w-px flex-1 mt-1" style={{ backgroundColor: `${statusColor}30`, minHeight: 24 }} />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-start justify-between gap-3 group text-left"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: statusColor }}>
                Step {step.step}
              </span>
              {step.duration && (
                <span className="text-[9px] font-mono text-[#2a3a4d]">{(step.duration / 1000).toFixed(1)}s</span>
              )}
              {step.status === 'running' && (
                <span className="text-[9px] text-[#FFB800] animate-pulse font-mono">RUNNING…</span>
              )}
            </div>
            <p className="text-sm font-medium text-[#E8EDF5] group-hover:text-[#00D4FF] transition-colors">
              {step.title}
            </p>
          </div>
          {(step.dqlQuery || step.detail.length > 80) && (
            expanded ? <ChevronDown size={13} className="text-[#8892a4] flex-shrink-0 mt-1" />
                      : <ChevronRight size={13} className="text-[#8892a4] flex-shrink-0 mt-1" />
          )}
        </button>

        <p className="text-xs text-[#8892a4] mt-1 leading-relaxed">{step.detail}</p>

        {expanded && step.dqlQuery && (
          <div className="mt-3 rounded-xl border border-[#1e2d3d] overflow-hidden">
            <div className="px-3 py-2 bg-[#070b12] border-b border-[#1e2d3d] flex items-center gap-2">
              <Database size={10} className="text-[#A78BFA]" />
              <span className="text-[9px] font-mono text-[#A78BFA] uppercase tracking-widest">Dynatrace DQL Query</span>
            </div>
            <pre className="p-3 text-[10px] font-mono text-[#c8d0dc] bg-[#070b12] overflow-x-auto leading-relaxed">{step.dqlQuery}</pre>
            {step.dqlResult && (
              <>
                <div className="px-3 py-2 bg-[#0a0e17] border-t border-[#1e2d3d] flex items-center gap-2">
                  <Terminal size={10} className="text-[#00FF88]" />
                  <span className="text-[9px] font-mono text-[#00FF88] uppercase tracking-widest">Result</span>
                </div>
                <pre className="p-3 text-[10px] font-mono text-[#8892a4] bg-[#0a0e17] overflow-x-auto leading-relaxed">{step.dqlResult}</pre>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: AgentAction }) {
  const typeConfig: Record<string, { color: string; icon: React.ElementType; bg: string }> = {
    dql_query:            { color: '#A78BFA', icon: Database, bg: '#A78BFA15' },
    deployment_check:     { color: '#FFB800', icon: GitBranch, bg: '#FFB80015' },
    memory_search:        { color: '#F472B6', icon: Terminal, bg: '#F472B615' },
    hypothesis_generated: { color: '#FF3B3B', icon: Terminal, bg: '#FF3B3B15' },
    slack_notification:   { color: '#00D4FF', icon: Bell, bg: '#00D4FF15' },
    github_issue:         { color: '#00FF88', icon: GitBranch, bg: '#00FF8815' },
    resolved:             { color: '#00FF88', icon: CheckCircle2, bg: '#00FF8815' },
  };

  const cfg = typeConfig[action.type] ?? typeConfig.dql_query;
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: cfg.bg }}>
        <Icon size={12} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#E8EDF5] truncate">{action.title}</span>
          <span className="text-[9px] font-mono text-[#8892a4] flex-shrink-0">{formatTimeAgo(action.timestamp)}</span>
        </div>
        <p className="text-[10px] text-[#8892a4] mt-0.5">{action.description}</p>
        {action.metadata && (
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {Object.entries(action.metadata).map(([k, v]) => (
              <span key={k} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0a0e17] border border-[#1e2d3d]"
                style={{ color: cfg.color }}>{v}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogLine({ log }: { log: LogEntry }) {
  const levelColor = { ERROR: '#FF3B3B', WARN: '#FFB800', INFO: '#00D4FF', DEBUG: '#8892a4' }[log.level];
  return (
    <div className="flex gap-3 py-0.5 hover:bg-[#0d1520] px-2 -mx-2 rounded group">
      <span className="text-[9px] font-mono text-[#2a3a4d] flex-shrink-0 mt-0.5 group-hover:text-[#8892a4]">
        {formatTimestamp(log.timestamp)}
      </span>
      <span className="text-[9px] font-mono font-bold w-10 flex-shrink-0" style={{ color: levelColor }}>{log.level}</span>
      <span className="text-[9px] font-mono text-[#A78BFA] flex-shrink-0 truncate max-w-[120px]">{log.service}</span>
      <span className="text-[10px] font-mono text-[#c8d0dc] flex-1 leading-relaxed">{log.message}</span>
    </div>
  );
}

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const incident = mockIncidents.find(i => i.id === id) ?? mockIncidents[0];
  const elapsed = useElapsedTime(incident.detectedAt);
  const { lines, isRunning, isComplete } = useReasoningStream(true);
  const [metricTab, setMetricTab] = useState<'errorRate' | 'latency' | 'memory' | 'cpu'>('latency');

  const metricConfig = {
    latency:   { label: 'Latency P99', color: '#FFB800', threshold: 500 },
    errorRate: { label: 'Error Rate', color: '#FF3B3B', threshold: 5 },
    memory:    { label: 'JVM Heap', color: '#A78BFA', threshold: 4000 },
    cpu:       { label: 'CPU Usage', color: '#00D4FF', threshold: 80 },
  };

  return (
    <div className="flex min-h-screen bg-[#0A0E17]">
      <Sidebar />
      <div className="flex-1 ml-[220px] flex flex-col">
        <TopBar
          title={`${incident.dynatraceId} — ${incident.title}`}
          subtitle={`Detected ${formatTimeAgo(incident.detectedAt)} · ${incident.affectedServices.length} services affected`}
        />

        <div className="flex-1 p-6 overflow-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <Link href="/incidents" className="flex items-center gap-1.5 text-xs text-[#8892a4] hover:text-[#E8EDF5] transition-colors mb-3">
                <ArrowLeft size={12} /> All Incidents
              </Link>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-[#E8EDF5]">{incident.title}</h1>
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${getSeverityBg(incident.severity)} ${getSeverityColor(incident.severity)}`}>
                  {incident.severity}
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-widest ${getStatusColor(incident.status)}`}>
                  {incident.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-[#8892a4] font-mono">
                <span className="flex items-center gap-1"><Clock size={10} />{formatDuration(elapsed)}</span>
                <span>{incident.dynatraceId}</span>
                {incident.deployment && (
                  <span className="flex items-center gap-1 text-[#FFB800]">
                    <GitBranch size={10} /> Correlated: {incident.deployment.version}
                  </span>
                )}
              </div>
            </div>

            <AgentOrb state="investigating" size="md" task={`Confidence: ${incident.rootCauseConfidence}%`} />
          </div>

          {/* Root cause banner */}
          {incident.rootCause && (
            <div className="mb-6 px-5 py-4 rounded-xl bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 animate-in"
              style={{ boxShadow: '0 0 25px rgba(255,59,59,0.1)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF3B3B]">Root Cause Identified</span>
                    <span className="text-[10px] font-mono text-[#8892a4]">·</span>
                    <span className="text-[10px] font-mono text-[#00FF88]">{incident.rootCauseConfidence}% confidence</span>
                  </div>
                  <p className="text-sm font-medium text-[#E8EDF5]">{incident.rootCause}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[9px] text-[#8892a4] font-mono uppercase tracking-widest mb-1">Confidence</div>
                  <div className="font-mono text-[10px] text-[#00FF88]">
                    {'█'.repeat(Math.round((incident.rootCauseConfidence ?? 0) / 10))}{'░'.repeat(10 - Math.round((incident.rootCauseConfidence ?? 0) / 10))}
                  </div>
                  <div className="text-xl font-mono font-bold text-[#00FF88] mt-0.5">{incident.rootCauseConfidence}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="grid grid-cols-3 gap-6">

            {/* LEFT: Reasoning trace + actions */}
            <div className="col-span-2 space-y-6">

              {/* Reasoning Chain */}
              <div className="bg-[#0d1520] rounded-xl border border-[#1e2d3d]">
                <div className="px-5 py-4 border-b border-[#1e2d3d] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[#E8EDF5]">Investigation Chain</h2>
                    <p className="text-[10px] text-[#8892a4] font-mono mt-0.5">Step-by-step Morpheus reasoning trace</p>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-1 rounded bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20">
                    {incident.reasoningSteps.filter(s => s.status === 'complete').length}/{incident.reasoningSteps.length} steps complete
                  </span>
                </div>
                <div className="p-5">
                  {incident.reasoningSteps.map((step, i) => (
                    <ReasoningStepRow
                      key={step.id}
                      step={step}
                      isLast={i === incident.reasoningSteps.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Live stream */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-[#E8EDF5]">Live Reasoning Stream</h2>
                  {isRunning && (
                    <span className="text-[9px] font-mono text-[#FFB800] animate-pulse uppercase tracking-widest">● STREAMING</span>
                  )}
                </div>
                <ReasoningStream lines={lines} isRunning={isRunning} isComplete={isComplete} />
              </div>

              {/* Metrics panel */}
              <div className="bg-[#0d1520] rounded-xl border border-[#1e2d3d]">
                <div className="px-5 py-4 border-b border-[#1e2d3d] flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#E8EDF5]">Service Metrics</h2>
                  <div className="flex gap-1 p-1 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]">
                    {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map(k => (
                      <button key={k}
                        onClick={() => setMetricTab(k)}
                        className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-widest font-mono transition-all
                          ${metricTab === k ? 'bg-[#1e2d3d] text-[#E8EDF5]' : 'text-[#8892a4] hover:text-[#E8EDF5]'}`}>
                        {metricConfig[k].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 h-52">
                  <FullMetricChart
                    data={incident.metrics[metricTab]}
                    color={metricConfig[metricTab].color}
                    metric={metricTab}
                    threshold={metricConfig[metricTab].threshold}
                  />
                </div>
              </div>

              {/* Logs */}
              <div className="bg-[#0d1520] rounded-xl border border-[#1e2d3d]">
                <div className="px-5 py-4 border-b border-[#1e2d3d] flex items-center gap-2">
                  <Terminal size={13} className="text-[#8892a4]" />
                  <h2 className="text-sm font-semibold text-[#E8EDF5]">Service Logs</h2>
                  <span className="text-[9px] font-mono text-[#8892a4] ml-auto">{incident.logs.length} entries</span>
                </div>
                <div className="p-4 font-mono space-y-0.5 max-h-64 overflow-y-auto">
                  {incident.logs.map((log, i) => <LogLine key={i} log={log} />)}
                </div>
              </div>
            </div>

            {/* RIGHT column */}
            <div className="space-y-6">

              {/* Hypotheses */}
              <div className="bg-[#0d1520] rounded-xl border border-[#1e2d3d]">
                <div className="px-4 py-3.5 border-b border-[#1e2d3d]">
                  <h3 className="text-xs font-semibold text-[#E8EDF5]">Agent Hypotheses</h3>
                </div>
                <div className="p-4 space-y-4">
                  {incident.hypotheses.map(h => (
                    <div key={h.id} className={`rounded-lg border p-3.5 ${h.isConfirmed ? 'border-[#00FF88]/30 bg-[#00FF88]/5' : 'border-[#1e2d3d]'}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className={`text-xs font-medium leading-snug ${h.isConfirmed ? 'text-[#00FF88]' : 'text-[#E8EDF5]'}`}>
                          {h.isConfirmed && '✓ '}{h.title}
                        </h4>
                        <span className="text-sm font-mono font-bold flex-shrink-0"
                          style={{ color: h.confidence > 70 ? '#00FF88' : h.confidence > 40 ? '#FFB800' : '#8892a4' }}>
                          {h.confidence}%
                        </span>
                      </div>
                      <div className="h-px rounded bg-[#1e2d3d] mb-2">
                        <div className="h-full rounded transition-all duration-1000"
                          style={{
                            width: `${h.confidence}%`,
                            background: h.confidence > 70 ? '#00FF88' : h.confidence > 40 ? '#FFB800' : '#8892a4'
                          }} />
                      </div>
                      <p className="text-[10px] text-[#8892a4] leading-relaxed mb-2">{h.description}</p>
                      <div className="space-y-0.5">
                        {h.evidence.map(e => (
                          <div key={e} className="flex items-center gap-1.5 text-[9px] font-mono">
                            <span className="text-[#00D4FF]">→</span>
                            <span className="text-[#8892a4]">{e}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions timeline */}
              <div className="bg-[#0d1520] rounded-xl border border-[#1e2d3d]">
                <div className="px-4 py-3.5 border-b border-[#1e2d3d]">
                  <h3 className="text-xs font-semibold text-[#E8EDF5]">Agent Actions</h3>
                </div>
                <div className="p-4 space-y-3.5">
                  {incident.actions.map(a => <ActionBadge key={a.id} action={a} />)}
                </div>
              </div>

              {/* GitHub issue */}
              {incident.githubIssue && (
                <div className="bg-[#0d1520] rounded-xl border border-[#00FF88]/20">
                  <div className="px-4 py-3.5 border-b border-[#1e2d3d] flex items-center gap-2">
                    <GitBranch size={12} className="text-[#00FF88]" />
                    <h3 className="text-xs font-semibold text-[#E8EDF5]">GitHub Issue Created</h3>
                    <span className="ml-auto text-[9px] font-mono text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded">AUTO</span>
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] font-mono text-[#8892a4] mb-1">#{incident.githubIssue.number}</div>
                    <p className="text-xs text-[#E8EDF5] font-medium mb-3 leading-snug">{incident.githubIssue.title}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {incident.githubIssue.labels.map(l => (
                        <span key={l} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1e2d3d] text-[#8892a4]">{l}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#8892a4] font-mono">@{incident.githubIssue.assignee}</span>
                      <a href={incident.githubIssue.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[9px] text-[#00D4FF] font-mono hover:underline">
                        View Issue <ExternalLink size={9} />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Slack preview */}
              {incident.slackNotification && (
                <div className="bg-[#0d1520] rounded-xl border border-[#00D4FF]/20">
                  <div className="px-4 py-3.5 border-b border-[#1e2d3d] flex items-center gap-2">
                    <Bell size={12} className="text-[#00D4FF]" />
                    <h3 className="text-xs font-semibold text-[#E8EDF5]">Slack Notification</h3>
                    <span className="ml-auto text-[9px] font-mono text-[#00D4FF]">{incident.slackNotification.channel}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-1 rounded-full self-stretch bg-[#FF3B3B] flex-shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-[#E8EDF5] mb-0.5">Morpheus</div>
                        <pre className="text-[10px] font-mono text-[#8892a4] whitespace-pre-wrap leading-relaxed">
                          {incident.slackNotification.message}
                        </pre>
                        <div className="text-[9px] text-[#2a3a4d] mt-2 font-mono">
                          {formatTimeAgo(incident.slackNotification.sentAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Affected services */}
              <div className="bg-[#0d1520] rounded-xl border border-[#1e2d3d] p-4">
                <h3 className="text-xs font-semibold text-[#E8EDF5] mb-3">Affected Services</h3>
                <div className="space-y-2">
                  {incident.affectedServices.map(s => (
                    <div key={s} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server size={11} className="text-[#8892a4]" />
                        <span className="text-xs font-mono text-[#E8EDF5]">{s}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#FF3B3B] bg-[#FF3B3B]/10 px-1.5 py-0.5 rounded">DEGRADED</span>
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

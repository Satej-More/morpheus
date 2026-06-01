import type { Severity, IncidentStatus, AgentState } from '../types';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function formatTimeAgo(isoString: string): string {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export function getSeverityColor(severity: Severity): string {
  return {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-blue-400',
  }[severity];
}

export function getSeverityBg(severity: Severity): string {
  return {
    critical: 'bg-red-500/10 border-red-500/30',
    high: 'bg-orange-500/10 border-orange-500/30',
    medium: 'bg-yellow-500/10 border-yellow-500/30',
    low: 'bg-blue-500/10 border-blue-500/30',
  }[severity];
}

export function getSeverityGlow(severity: Severity): string {
  return {
    critical: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    high: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
    medium: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
    low: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
  }[severity];
}

export function getStatusColor(status: IncidentStatus): string {
  return {
    detecting: 'text-red-400',
    investigating: 'text-yellow-400',
    resolving: 'text-cyan-400',
    resolved: 'text-emerald-400',
    monitoring: 'text-blue-400',
  }[status];
}

export function getAgentStateLabel(state: AgentState): string {
  return {
    idle: 'Standby',
    thinking: 'Processing',
    investigating: 'Investigating',
    resolving: 'Resolving',
    monitoring: 'Monitoring',
  }[state];
}

export function getAgentStateColor(state: AgentState): string {
  return {
    idle: '#00D4FF',
    thinking: '#FFB800',
    investigating: '#FF3B3B',
    resolving: '#FF6B35',
    monitoring: '#00FF88',
  }[state];
}

export function formatMetricValue(value: number, metric: string): string {
  if (metric === 'latency') return `${value.toFixed(0)}ms`;
  if (metric === 'errorRate') return `${value.toFixed(1)}%`;
  if (metric === 'memory') return `${(value / 1000).toFixed(1)}GB`;
  if (metric === 'cpu') return `${value.toFixed(0)}%`;
  return value.toFixed(1);
}

export function confidenceBar(confidence: number): string {
  const filled = Math.round(confidence / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

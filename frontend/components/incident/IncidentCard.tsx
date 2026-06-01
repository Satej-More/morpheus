'use client';
import Link from 'next/link';
import { AlertTriangle, Clock, Server, ArrowRight, CheckCircle2, Search, Loader2 } from 'lucide-react';
import type { Incident } from '../../types';
import {
  formatTimeAgo, formatDuration, getSeverityColor,
  getSeverityBg, getSeverityGlow, getStatusColor
} from '../../lib/utils';

interface IncidentCardProps {
  incident: Incident;
  compact?: boolean;
}

const statusIcons = {
  detecting: AlertTriangle,
  investigating: Search,
  resolving: Loader2,
  resolved: CheckCircle2,
  monitoring: Clock,
};

export function IncidentCard({ incident, compact = false }: IncidentCardProps) {
  const StatusIcon = statusIcons[incident.status];
  const isActive = incident.status !== 'resolved';

  return (
    <Link href={`/incidents/${incident.id}`}>
      <div className={`
        group relative rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
        hover:border-[#00D4FF]/40 hover:scale-[1.01]
        ${getSeverityBg(incident.severity)}
        ${isActive ? getSeverityGlow(incident.severity) : ''}
      `}>
        {/* Left severity stripe */}
        <div className={`
          absolute left-0 top-0 bottom-0 w-0.5
          ${incident.severity === 'critical' ? 'bg-red-500' :
            incident.severity === 'high' ? 'bg-orange-500' :
            incident.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}
        `} />

        <div className="px-4 py-3 pl-5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${getSeverityColor(incident.severity)}`}>
                  {incident.severity}
                </span>
                <span className="text-[#2a3a4d] text-[10px]">·</span>
                <span className="text-[#8892a4] text-[10px] font-mono">{incident.dynatraceId}</span>
              </div>
              <h3 className="text-sm font-medium text-[#E8EDF5] truncate group-hover:text-[#00D4FF] transition-colors">
                {incident.title}
              </h3>
            </div>
            <ArrowRight size={14} className="text-[#2a3a4d] group-hover:text-[#00D4FF] transition-colors flex-shrink-0 mt-1" />
          </div>

          {/* Middle row — services */}
          {!compact && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {incident.affectedServices.map(s => (
                <span key={s} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0a0e17] border border-[#1e2d3d] text-[#8892a4] text-[9px] font-mono">
                  <Server size={8} />
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-1.5">
              <StatusIcon
                size={11}
                className={`${getStatusColor(incident.status)} ${incident.status === 'resolving' ? 'animate-spin' : incident.status === 'investigating' ? 'animate-pulse' : ''}`}
              />
              <span className={`text-[10px] font-mono uppercase tracking-widest ${getStatusColor(incident.status)}`}>
                {incident.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[#8892a4] text-[10px] font-mono">
              {incident.mttrSeconds != null && (
                <span className={incident.status === 'resolved' ? 'text-[#00FF88]' : 'text-[#FFB800]'}>
                  {formatDuration(incident.mttrSeconds)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={9} />
                {formatTimeAgo(incident.detectedAt)}
              </span>
            </div>
          </div>

          {/* Confidence bar if available */}
          {incident.rootCauseConfidence != null && (
            <div className="mt-2.5 pt-2.5 border-t border-[#1e2d3d]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-[#8892a4] uppercase tracking-widest">Root Cause Confidence</span>
                <span className="text-[9px] font-mono text-[#00D4FF]">{incident.rootCauseConfidence}%</span>
              </div>
              <div className="h-0.5 rounded-full bg-[#1e2d3d] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#00FF88] transition-all duration-1000"
                  style={{ width: `${incident.rootCauseConfidence}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Active pulse line at bottom */}
        {isActive && (
          <div className="h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30 animate-pulse"
            style={{ color: incident.severity === 'critical' ? '#FF3B3B' : '#FFB800' }} />
        )}
      </div>
    </Link>
  );
}

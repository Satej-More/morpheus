'use client';
import { useEffect, useRef } from 'react';
import { Terminal, Zap, Database, Brain, GitBranch, Bell, CheckCircle2, Eye } from 'lucide-react';

interface ReasoningLine {
  text: string;
  type: string;
  id: number;
}

interface ReasoningStreamProps {
  lines: ReasoningLine[];
  isRunning: boolean;
  isComplete: boolean;
  onStart?: () => void;
  compact?: boolean;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; prefix: string }> = {
  init:           { icon: Eye,          color: '#00D4FF', prefix: '◉ INIT    ' },
  query:          { icon: Database,     color: '#A78BFA', prefix: '⬡ DQL     ' },
  result:         { icon: Terminal,     color: '#E8EDF5', prefix: '→ RESULT  ' },
  analysis:       { icon: Brain,        color: '#FFB800', prefix: '◈ ANALYZE ' },
  match:          { icon: GitBranch,    color: '#00D4FF', prefix: '◎ MATCH   ' },
  memory:         { icon: Brain,        color: '#F472B6', prefix: '◇ MEMORY  ' },
  hypothesis:     { icon: Zap,          color: '#FF3B3B', prefix: '▶ ROOT CA ' },
  confidence:     { icon: CheckCircle2, color: '#00FF88', prefix: '✓ CONF    ' },
  action:         { icon: Bell,         color: '#FFB800', prefix: '⚡ ACTION  ' },
  recommendation: { icon: CheckCircle2, color: '#00FF88', prefix: '→ RECOM   ' },
  monitor:        { icon: Eye,          color: '#00D4FF', prefix: '◉ MONITOR ' },
};

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    el.textContent = '';
    let i = 0;
    const chars = text.split('');
    const t = setTimeout(() => {
      const interval = setInterval(() => {
        el.textContent += chars[i] ?? '';
        i++;
        if (i >= chars.length) clearInterval(interval);
      }, 18);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  return <span ref={spanRef} />;
}

export function ReasoningStream({ lines, isRunning, isComplete, onStart, compact = false }: ReasoningStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const isEmpty = lines.length === 0 && !isRunning;

  return (
    <div className={`
      relative flex flex-col rounded-xl border border-[#1e2d3d] overflow-hidden
      bg-[#070b12] font-mono text-xs
      ${compact ? 'h-64' : 'h-96'}
    `}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2d3d] bg-[#0a0e17] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-[#00D4FF]" />
          <span className="text-[#00D4FF] text-[10px] uppercase tracking-widest font-semibold">
            Morpheus Reasoning Engine
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[#FFB800] text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" />
              LIVE
            </span>
          )}
          {isComplete && (
            <span className="flex items-center gap-1.5 text-[#00FF88] text-[10px]">
              <CheckCircle2 size={10} />
              COMPLETE
            </span>
          )}
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B3B]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF88]" />
          </div>
        </div>
      </div>

      {/* Stream content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#1e2d3d]">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 rounded-full border border-[#1e2d3d] flex items-center justify-center">
              <Terminal size={20} className="text-[#2a3a4d]" />
            </div>
            <p className="text-[#2a3a4d] text-[10px] uppercase tracking-widest">Awaiting incident signal</p>
            {onStart && (
              <button
                onClick={onStart}
                className="mt-2 px-4 py-1.5 rounded border border-[#00D4FF]/40 text-[#00D4FF] text-[10px] uppercase tracking-widest hover:bg-[#00D4FF]/10 transition-colors"
              >
                Simulate Incident →
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="text-[#2a3a4d] mb-3 text-[9px]">
              $ morpheus-agent --mode=autonomous --watch=payments-api
            </div>
            {lines.map((line, idx) => {
              const cfg = typeConfig[line.type] ?? typeConfig.result;
              const Icon = cfg.icon;
              return (
                <div
                  key={line.id}
                  className="flex gap-2 group animate-in fade-in slide-in-from-bottom-1 duration-300"
                >
                  <span
                    className="text-[9px] uppercase tracking-widest mt-0.5 whitespace-nowrap opacity-70 flex-shrink-0"
                    style={{ color: cfg.color }}
                  >
                    {cfg.prefix}
                  </span>
                  <span className="text-[#c8d0dc] leading-relaxed">
                    {idx === lines.length - 1 && isRunning ? (
                      <TypewriterText text={line.text} />
                    ) : (
                      line.text
                    )}
                  </span>
                </div>
              );
            })}
            {isRunning && (
              <div className="flex gap-2 mt-2">
                <span className="text-[9px] uppercase tracking-widest text-[#00D4FF] opacity-70">
                  ◉ PROC    
                </span>
                <span className="text-[#00D4FF] animate-pulse">█</span>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

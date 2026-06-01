'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Zap, ArrowRight, Github, Activity, Clock, Shield, Brain, Server, Database, GitBranch, Bell, CheckCircle2 } from 'lucide-react';
import { useReasoningStream, useCounter } from '../hooks';

function FloatingParticle({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  return (
    <div
      className="absolute rounded-full bg-[#00D4FF] opacity-0 animate-ping-slow"
      style={{
        width: size, height: size, left: `${x}%`, top: `${y}%`,
        animationDelay: `${delay}s`, animationDuration: `${3 + delay}s`,
      }}
    />
  );
}

function LiveReasoningDemo() {
  const { lines, isRunning, isComplete, start } = useReasoningStream();

  useEffect(() => { setTimeout(start, 1500); }, [start]);

  const typeColors: Record<string, string> = {
    init: '#00D4FF', query: '#A78BFA', result: '#E8EDF5',
    analysis: '#FFB800', match: '#00D4FF', memory: '#F472B6',
    hypothesis: '#FF3B3B', confidence: '#00FF88', action: '#FFB800',
    recommendation: '#00FF88', monitor: '#00D4FF',
  };

  return (
    <div className="relative rounded-2xl border border-[#1e2d3d] bg-[#070b12] overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d3d] bg-[#0a0e17]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B3B]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF88]" />
          </div>
          <span className="text-[#8892a4] text-[10px] ml-2">morpheus-agent — reasoning engine</span>
        </div>
        {isRunning && (
          <span className="flex items-center gap-1 text-[#FFB800] text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" /> LIVE
          </span>
        )}
      </div>
      <div className="p-4 h-64 overflow-y-auto space-y-1.5">
        {lines.length === 0 && (
          <div className="flex items-center gap-2 text-[#2a3a4d]">
            <span className="animate-pulse">$</span>
            <span className="animate-pulse">initializing morpheus-agent…</span>
          </div>
        )}
        {lines.map(line => (
          <div key={line.id} className="flex gap-2 animate-in">
            <span className="text-[9px] uppercase tracking-wider opacity-60 flex-shrink-0 mt-0.5 w-20"
              style={{ color: typeColors[line.type] ?? '#E8EDF5' }}>
              {line.type}
            </span>
            <span className="text-[#c8d0dc] leading-relaxed">{line.text}</span>
          </div>
        ))}
        {isRunning && (
          <div className="flex gap-2">
            <span className="text-[9px] text-[#00D4FF] opacity-60 w-20">proc</span>
            <span className="text-[#00D4FF] animate-pulse">█</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BentoCard({ icon: Icon, title, desc, color, span = '' }: any) {
  return (
    <div className={`rounded-2xl border border-[#1e2d3d] bg-[#0d1520] p-5 hover:border-[#2a3a4d] transition-all duration-300 hover:scale-[1.01] ${span}`}>
      <div className="w-9 h-9 rounded-xl mb-4 flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <h3 className="text-[#E8EDF5] font-semibold text-sm mb-1.5">{title}</h3>
      <p className="text-[#8892a4] text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  const mttrReduction = useCounter(94, 2500);
  const incidentsResolved = useCounter(4600, 2000);
  const costSaved = useCounter(820, 3000);

  return (
    <div className="min-h-screen bg-[#0A0E17] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 border-b border-[#1e2d3d]/50 bg-[#0A0E17]/80 backdrop-blur-xl flex items-center px-8 justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#0088aa] flex items-center justify-center">
            <Zap size={14} className="text-[#0a0e17]" strokeWidth={2.5} />
          </div>
          <span className="text-[#E8EDF5] font-semibold text-sm">Morpheus</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#1e2d3d] text-[#8892a4]">v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/incidents" className="text-sm text-[#8892a4] hover:text-[#E8EDF5] transition-colors">Incidents</Link>
          <Link href="/settings" className="text-sm text-[#8892a4] hover:text-[#E8EDF5] transition-colors">Settings</Link>
          <Link href="https://github.com" className="text-[#8892a4] hover:text-[#E8EDF5] transition-colors">
            <Github size={16} />
          </Link>
          <Link href="/incidents"
            className="px-4 py-1.5 rounded-lg bg-[#00D4FF] text-[#0a0e17] text-sm font-semibold hover:bg-[#00bbee] transition-colors">
            Open Dashboard →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-8 max-w-7xl mx-auto grid-bg">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00D4FF] opacity-[0.04] rounded-full blur-[120px]" />
          <div className="absolute top-40 left-1/4 w-96 h-96 bg-[#FF3B3B] opacity-[0.03] rounded-full blur-[100px]" />
          {[[1, 4, 15, 20], [0.5, 3, 70, 35], [2, 5, 45, 65], [1.5, 4, 85, 25], [0.8, 3, 25, 75]].map(([delay, size, x, y], i) => (
            <FloatingParticle key={i} delay={delay as number} size={size as number} x={x as number} y={y as number} />
          ))}
        </div>

        <div className="relative grid lg:grid-cols-2 gap-16 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF3B3B]/30 bg-[#FF3B3B]/10 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B3B] animate-pulse" />
              <span className="text-[#FF3B3B] text-xs font-mono uppercase tracking-widest">Production incident detected</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-[1.05] mb-6 tracking-tight">
              <span className="text-[#E8EDF5]">The SRE that</span>
              <br />
              <span className="gradient-text">never sleeps.</span>
            </h1>

            <p className="text-[#8892a4] text-lg leading-relaxed mb-8 max-w-lg">
              Morpheus autonomously detects production incidents, traces root cause via Dynatrace DQL,
              and closes the loop — all in under 3 minutes.
            </p>

            {/* MTTR proof point */}
            <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0d1520] border border-[#1e2d3d] mb-8">
              <div className="w-2 h-8 rounded-full bg-gradient-to-b from-[#00D4FF] to-[#00FF88]" />
              <div>
                <p className="text-xs text-[#8892a4] font-mono uppercase tracking-widest">Latest incident resolved</p>
                <p className="text-[#E8EDF5] font-mono font-semibold">payments-api memory leak — <span className="text-[#00FF88]">2m 14s</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/incidents"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00D4FF] text-[#0a0e17] font-semibold hover:bg-[#00bbee] transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(0,212,255,0.3)]">
                Open Command Center
                <ArrowRight size={16} />
              </Link>
              <Link href="https://github.com"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#1e2d3d] text-[#8892a4] hover:text-[#E8EDF5] hover:border-[#2a3a4d] transition-all">
                <Github size={16} />
                View on GitHub
              </Link>
            </div>
          </div>

          {/* Live reasoning demo */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#00D4FF]/10 to-[#00FF88]/5 rounded-3xl blur-xl" />
            <div className="relative">
              <LiveReasoningDemo />
              <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-[#8892a4] px-1">
                <span>morpheus-agent v1.0.0 · autonomous mode</span>
                <span className="flex items-center gap-1 text-[#00FF88]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" />
                  LIVE FEED
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-8 border-y border-[#1e2d3d] bg-[#070b12]">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: `${mttrReduction}%`, label: 'MTTR Reduction', sub: 'vs manual incident response', color: '#00D4FF' },
            { value: incidentsResolved.toLocaleString(), label: 'Incidents Resolved', sub: 'since deployment', color: '#00FF88' },
            { value: `$${costSaved}K`, label: 'Downtime Cost Saved', sub: 'at $5,600/min average', color: '#FFB800' },
          ].map(({ value, label, sub, color }) => (
            <div key={label}>
              <div className="text-4xl font-mono font-bold mb-1" style={{ color }}>{value}</div>
              <div className="text-sm font-medium text-[#E8EDF5] mb-1">{label}</div>
              <div className="text-xs text-[#8892a4] font-mono">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[#00D4FF] text-xs font-mono uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl font-bold text-[#E8EDF5]">Detect → Diagnose → Resolve</h2>
          <p className="text-[#8892a4] text-sm mt-3 max-w-lg mx-auto">
            A fully autonomous incident lifecycle managed by Gemini reasoning + Dynatrace superpowers
          </p>
        </div>

        <div className="relative flex items-center justify-center gap-0 overflow-x-auto pb-4">
          {[
            { icon: Activity, label: 'Detect', desc: 'DQL anomaly detection', color: '#FF3B3B' },
            { icon: Brain, label: 'Diagnose', desc: 'Gemini root cause analysis', color: '#FFB800' },
            { icon: Database, label: 'Correlate', desc: 'Historical pattern matching', color: '#A78BFA' },
            { icon: Bell, label: 'Alert', desc: 'Slack + GitHub actions', color: '#00D4FF' },
            { icon: CheckCircle2, label: 'Resolve', desc: 'Auto-verify + close loop', color: '#00FF88' },
          ].map(({ icon: Icon, label, desc, color }, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center w-32 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 relative"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={22} style={{ color }} />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#070b12] border border-[#1e2d3d] flex items-center justify-center text-[9px] font-mono text-[#8892a4]">
                    {i + 1}
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#E8EDF5] mb-0.5">{label}</p>
                <p className="text-[10px] text-[#8892a4]">{desc}</p>
              </div>
              {i < 4 && (
                <div className="flex items-center mx-1 text-[#1e2d3d]">
                  <div className="w-8 h-px bg-gradient-to-r from-[#1e2d3d] to-[#2a3a4d]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2a3a4d] ml-0.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bento grid */}
      <section className="py-12 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          <BentoCard span="col-span-2" icon={Brain} color="#00D4FF" title="Gemini-Powered Root Cause Analysis"
            desc="Advanced reasoning engine correlates deployment events, log anomalies, and historical patterns to generate confident root cause hypotheses with evidence." />
          <BentoCard icon={Database} color="#A78BFA" title="Dynatrace DQL Engine"
            desc="Deep integration with Dynatrace Grail — runs complex DQL queries across logs, metrics, and traces." />
          <BentoCard icon={Activity} color="#FF3B3B" title="Real-Time Anomaly Detection"
            desc="Monitors 100+ services every 60 seconds. Detects latency, error rate, and saturation anomalies instantly." />
          <BentoCard span="col-span-2" icon={GitBranch} color="#00FF88" title="Closed-Loop Incident Management"
            desc="Creates GitHub issues, sends Slack notifications, monitors resolution, and auto-closes tickets when metrics normalize. Zero human toil required." />
          <BentoCard icon={Shield} color="#FFB800" title="Institutional Memory"
            desc="MongoDB-backed pattern matching learns from every incident to solve future ones faster." />
          <BentoCard icon={Clock} color="#00D4FF" title="2-Minute MTTR"
            desc="Mean time to resolution 94% faster than manual response. Continuously improving." />
          <BentoCard icon={Server} color="#F472B6" title="Multi-Service Topology"
            desc="Maps service dependencies in real time to identify blast radius and upstream root causes." />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/10 mb-6">
            <Zap size={12} className="text-[#00D4FF]" />
            <span className="text-[#00D4FF] text-xs font-mono">Built with Dynatrace + Gemini + Google Cloud</span>
          </div>
          <h2 className="text-4xl font-bold text-[#E8EDF5] mb-4">Ready to watch it work?</h2>
          <p className="text-[#8892a4] mb-8">Open the live dashboard and simulate a production incident.</p>
          <Link href="/incidents"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#00D4FF] text-[#0a0e17] font-bold text-base hover:bg-[#00bbee] transition-all hover:scale-[1.02] shadow-[0_0_40px_rgba(0,212,255,0.3)]">
            Enter Command Center
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2d3d] py-8 px-8 flex items-center justify-between text-[10px] font-mono text-[#2a3a4d]">
        <span>Morpheus © 2026 — Google Cloud Rapid Agent Hackathon</span>
        <span>Built with Dynatrace · Gemini · MongoDB · Google Cloud Agent Builder</span>
      </footer>
    </div>
  );
}

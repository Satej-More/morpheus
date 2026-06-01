'use client';
import { useState } from 'react';
import { Check, Eye, EyeOff, RefreshCw, Zap, AlertCircle, ChevronRight, Activity, GitBranch, Bell, Brain, Sliders, Shield } from 'lucide-react';
import { Sidebar, TopBar } from '../../components/layout/Sidebar';
import { mockConnectionConfig } from '../../mock/data';
import type { ConnectionConfig } from '../../types';

function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest
      ${connected ? 'text-[#00FF88]' : 'text-[#8892a4]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#00FF88] animate-pulse' : 'bg-[#2a3a4d]'}`} />
      {connected ? 'Connected' : 'Not connected'}
    </span>
  );
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#070b12] border border-[#1e2d3d] rounded-lg px-3 py-2.5 text-xs font-mono text-[#E8EDF5] placeholder-[#2a3a4d] pr-10 focus:outline-none focus:border-[#00D4FF]/50 transition-colors"
      />
      <button onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a3a4d] hover:text-[#8892a4] transition-colors">
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  );
}

function SectionCard({ icon: Icon, color, title, subtitle, connected, children }: {
  icon: React.ElementType; color: string; title: string; subtitle: string;
  connected: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`rounded-xl border transition-colors ${connected ? 'border-[#1e2d3d] hover:border-[#2a3a4d]' : 'border-[#1e2d3d]'} bg-[#0d1520]`}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon size={17} style={{ color }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-[#E8EDF5]">{title}</h3>
              <ConnectionStatus connected={connected} />
            </div>
            <p className="text-[10px] text-[#8892a4] mt-0.5">{subtitle}</p>
          </div>
        </div>
        <ChevronRight size={14} className={`text-[#8892a4] transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[#1e2d3d] pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8892a4] mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[9px] text-[#2a3a4d] mt-1 font-mono">{hint}</p>}
    </div>
  );
}

function SliderControl({ label, value, min, max, unit, color, onChange }: {
  label: string; value: number; min: number; max: number; unit: string; color: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-[#8892a4]">{label}</label>
        <span className="text-xs font-mono" style={{ color }}>{value}{unit}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-[#1e2d3d]">
        <div className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${((value - min) / (max - min)) * 100}%`, backgroundColor: color }} />
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
      <div className="flex justify-between text-[8px] font-mono text-[#2a3a4d] mt-1">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [config, setConfig] = useState<ConnectionConfig>(mockConnectionConfig);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // Agent config state
  const [pollInterval, setPollInterval] = useState(60);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [mttrTarget, setMttrTarget] = useState(300);
  const [autoCreateIssues, setAutoCreateIssues] = useState(true);
  const [autoSlack, setAutoSlack] = useState(true);
  const [agentMode, setAgentMode] = useState<'autonomous' | 'supervised'>('autonomous');

  async function handleSave(section: string) {
    setSaving(section);
    await new Promise(r => setTimeout(r, 1100));
    setSaving(null);
    setSaved(section);
    setTimeout(() => setSaved(null), 3000);
  }

  function renderSaveButton(section: string) {
    const isSaving = saving === section;
    const isSaved = saved === section;
    return (
      <button onClick={() => handleSave(section)}
        disabled={isSaving}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all
          ${isSaved
            ? 'bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88]'
            : 'bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/20'
          } disabled:opacity-50`}>
        {isSaving ? <RefreshCw size={12} className="animate-spin" /> :
         isSaved ? <Check size={12} /> : <Zap size={12} />}
        {isSaving ? 'Saving…' : isSaved ? 'Saved!' : 'Save Configuration'}
      </button>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A0E17]">
      <Sidebar />
      <div className="flex-1 ml-[220px] flex flex-col">
        <TopBar title="Settings" subtitle="Configure integrations and agent behavior" />

        <div className="flex-1 p-6 max-w-3xl space-y-6 overflow-auto">

          {/* Status overview */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Dynatrace', ok: config.dynatrace.connected, icon: Activity },
              { label: 'GitHub', ok: config.github.connected, icon: GitBranch },
              { label: 'Slack', ok: config.slack.connected, icon: Bell },
            ].map(({ label, ok, icon: Icon }) => (
              <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${ok ? 'border-[#00FF88]/25 bg-[#00FF88]/5' : 'border-[#1e2d3d] bg-[#0d1520]'}`}>
                <Icon size={14} className={ok ? 'text-[#00FF88]' : 'text-[#2a3a4d]'} />
                <div>
                  <p className="text-xs font-medium text-[#E8EDF5]">{label}</p>
                  <p className={`text-[9px] font-mono ${ok ? 'text-[#00FF88]' : 'text-[#2a3a4d]'}`}>{ok ? 'Active' : 'Disconnected'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dynatrace */}
          <SectionCard icon={Activity} color="#00D4FF" title="Dynatrace" subtitle="Connect to Dynatrace Grail for DQL queries and problem events" connected={config.dynatrace.connected}>
            <div className="space-y-4">
              <FormRow label="Environment URL" hint="e.g. https://abc12345.live.dynatrace.com">
                <input
                  type="url"
                  value={config.dynatrace.apiUrl}
                  onChange={e => setConfig(c => ({ ...c, dynatrace: { ...c.dynatrace, apiUrl: e.target.value } }))}
                  className="w-full bg-[#070b12] border border-[#1e2d3d] rounded-lg px-3 py-2.5 text-xs font-mono text-[#E8EDF5] placeholder-[#2a3a4d] focus:outline-none focus:border-[#00D4FF]/50 transition-colors"
                  placeholder="https://{env-id}.live.dynatrace.com"
                />
              </FormRow>
              <FormRow label="API Token" hint="Requires scopes: logs.read, metrics.read, problems.read, events.read">
                <SecretInput
                  value={config.dynatrace.apiToken}
                  onChange={v => setConfig(c => ({ ...c, dynatrace: { ...c.dynatrace, apiToken: v } }))}
                  placeholder="dt0c01.xxxxxxxx…"
                />
              </FormRow>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#8892a4]">
                  <AlertCircle size={11} />
                  MCP server: dynatrace-mcp-server v0.2.1
                </div>
                {renderSaveButton("dynatrace")}
              </div>
            </div>
          </SectionCard>

          {/* GitHub */}
          <SectionCard icon={GitBranch} color="#00FF88" title="GitHub" subtitle="Auto-create issues and pull requests for incidents" connected={config.github.connected}>
            <div className="space-y-4">
              <FormRow label="Repository URL" hint="Full repo URL where issues will be created">
                <input
                  type="url"
                  value={config.github.repoUrl}
                  onChange={e => setConfig(c => ({ ...c, github: { ...c.github, repoUrl: e.target.value } }))}
                  className="w-full bg-[#070b12] border border-[#1e2d3d] rounded-lg px-3 py-2.5 text-xs font-mono text-[#E8EDF5] placeholder-[#2a3a4d] focus:outline-none focus:border-[#00FF88]/50 transition-colors"
                  placeholder="https://github.com/org/repo"
                />
              </FormRow>
              <FormRow label="Personal Access Token" hint="Requires: repo, issues:write">
                <SecretInput
                  value={config.github.token}
                  onChange={v => setConfig(c => ({ ...c, github: { ...c.github, token: v } }))}
                  placeholder="ghp_xxxxxxxx…"
                />
              </FormRow>

              {/* Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-[#1e2d3d]">
                <div>
                  <p className="text-xs text-[#E8EDF5]">Auto-create issues</p>
                  <p className="text-[9px] text-[#8892a4] font-mono mt-0.5">Automatically file GitHub issues when incidents are detected</p>
                </div>
                <button onClick={() => setAutoCreateIssues(v => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${autoCreateIssues ? 'bg-[#00FF88]' : 'bg-[#1e2d3d]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoCreateIssues ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="flex justify-end">
                {renderSaveButton("github")}
              </div>
            </div>
          </SectionCard>

          {/* Slack */}
          <SectionCard icon={Bell} color="#FFB800" title="Slack" subtitle="Send real-time incident notifications to your team" connected={config.slack.connected}>
            <div className="space-y-4">
              <FormRow label="Webhook URL" hint="Create at api.slack.com/apps → Incoming Webhooks">
                <SecretInput
                  value={config.slack.webhookUrl}
                  onChange={v => setConfig(c => ({ ...c, slack: { ...c.slack, webhookUrl: v } }))}
                  placeholder="https://hooks.slack.com/services/…"
                />
              </FormRow>
              <FormRow label="Default Channel" hint="Channel to post incident notifications">
                <input
                  type="text"
                  value={config.slack.channel}
                  onChange={e => setConfig(c => ({ ...c, slack: { ...c.slack, channel: e.target.value } }))}
                  className="w-full bg-[#070b12] border border-[#1e2d3d] rounded-lg px-3 py-2.5 text-xs font-mono text-[#E8EDF5] placeholder-[#2a3a4d] focus:outline-none focus:border-[#FFB800]/50 transition-colors"
                  placeholder="#incidents-critical"
                />
              </FormRow>

              <div className="flex items-center justify-between py-2 border-t border-[#1e2d3d]">
                <div>
                  <p className="text-xs text-[#E8EDF5]">Auto-notify on detection</p>
                  <p className="text-[9px] text-[#8892a4] font-mono mt-0.5">Post to Slack immediately when agent detects an incident</p>
                </div>
                <button onClick={() => setAutoSlack(v => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${autoSlack ? 'bg-[#FFB800]' : 'bg-[#1e2d3d]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoSlack ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="flex justify-end">
                {renderSaveButton("slack")}
              </div>
            </div>
          </SectionCard>

          {/* Agent config */}
          <SectionCard icon={Brain} color="#A78BFA" title="Agent Configuration" subtitle="Tune Morpheus reasoning behavior and thresholds" connected={true}>
            <div className="space-y-5">

              {/* Mode select */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8892a4] mb-2">Operation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['autonomous', 'supervised'] as const).map(mode => (
                    <button key={mode}
                      onClick={() => setAgentMode(mode)}
                      className={`px-4 py-3 rounded-xl border text-left transition-all ${
                        agentMode === mode
                          ? 'border-[#A78BFA]/40 bg-[#A78BFA]/10 text-[#A78BFA]'
                          : 'border-[#1e2d3d] text-[#8892a4] hover:border-[#2a3a4d]'
                      }`}>
                      <p className="text-xs font-semibold capitalize">{mode}</p>
                      <p className="text-[9px] mt-0.5 opacity-70">
                        {mode === 'autonomous' ? 'Agent acts without approval' : 'Agent asks before acting'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 pt-1 border-t border-[#1e2d3d]">
                <SliderControl label="Poll Interval" value={pollInterval} min={15} max={300} unit="s"
                  color="#00D4FF" onChange={setPollInterval} />
                <SliderControl label="Min Confidence to Act" value={confidenceThreshold} min={50} max={95} unit="%"
                  color="#A78BFA" onChange={setConfidenceThreshold} />
                <SliderControl label="MTTR Target" value={mttrTarget} min={60} max={1800} unit="s"
                  color="#00FF88" onChange={setMttrTarget} />
              </div>

              {/* Severity thresholds */}
              <div className="pt-1 border-t border-[#1e2d3d]">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8892a4] mb-3">Severity Thresholds</label>
                <div className="space-y-2.5">
                  {[
                    { label: 'Critical', color: '#FF3B3B', latency: '2000ms', errorRate: '10%' },
                    { label: 'High', color: '#FFB800', latency: '1000ms', errorRate: '5%' },
                    { label: 'Medium', color: '#A78BFA', latency: '500ms', errorRate: '2%' },
                  ].map(({ label, color, latency, errorRate }) => (
                    <div key={label} className="flex items-center gap-4 px-3 py-2.5 rounded-lg bg-[#070b12] border border-[#1e2d3d]">
                      <span className="w-16 text-[10px] font-mono font-bold" style={{ color }}>{label}</span>
                      <div className="flex-1 flex gap-6 text-[10px] font-mono text-[#8892a4]">
                        <span>Latency ≥ <span className="text-[#E8EDF5]">{latency}</span></span>
                        <span>Error rate ≥ <span className="text-[#E8EDF5]">{errorRate}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                {renderSaveButton("agent")}
              </div>
            </div>
          </SectionCard>

          {/* Security */}
          <SectionCard icon={Shield} color="#FF3B3B" title="Security" subtitle="API key rotation and audit settings" connected={true}>
            <div className="space-y-4">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#070b12] border border-[#1e2d3d]">
                <div>
                  <p className="text-xs text-[#E8EDF5]">Rotate API keys on next save</p>
                  <p className="text-[9px] text-[#8892a4] font-mono mt-0.5">Generates new internal service tokens automatically</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg border border-[#FF3B3B]/30 text-[#FF3B3B] text-[10px] font-mono hover:bg-[#FF3B3B]/10 transition-colors">
                  Rotate
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#070b12] border border-[#1e2d3d]">
                <div>
                  <p className="text-xs text-[#E8EDF5]">Audit log</p>
                  <p className="text-[9px] text-[#8892a4] font-mono mt-0.5">All agent actions are logged to MongoDB with full trace</p>
                </div>
                <span className="text-[9px] font-mono text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded">ENABLED</span>
              </div>
            </div>
          </SectionCard>

          {/* Footer info */}
          <div className="text-center py-4">
            <p className="text-[10px] font-mono text-[#2a3a4d]">
              Morpheus v1.0.0 · Google Cloud Rapid Agent Hackathon · Built with Dynatrace + Gemini + MongoDB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

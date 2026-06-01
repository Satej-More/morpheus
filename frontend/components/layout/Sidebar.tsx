'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertTriangle, Settings, Activity, Zap, Circle } from 'lucide-react';
import { useLiveTime } from '../../hooks';

const nav = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/incidents', icon: AlertTriangle, label: 'Incidents' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const time = useLiveTime();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#070b12] border-r border-[#1e2d3d] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1e2d3d]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#0088aa] flex items-center justify-center">
              <Zap size={14} className="text-[#0a0e17]" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
          </div>
          <div>
            <span className="text-[#E8EDF5] font-semibold text-sm tracking-tight">Morpheus</span>
            <p className="text-[#8892a4] text-[9px] font-mono uppercase tracking-widest">SRE Agent</p>
          </div>
        </div>
      </div>

      {/* Agent status pill */}
      <div className="px-3 py-3 border-b border-[#1e2d3d]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FF3B3B]/10 border border-[#FF3B3B]/25">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B3B] animate-pulse" />
          <span className="text-[9px] font-mono text-[#FF3B3B] uppercase tracking-widest">2 Active Incidents</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group
                ${active
                  ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20'
                  : 'text-[#8892a4] hover:text-[#E8EDF5] hover:bg-[#1e2d3d]/50'}
              `}
            >
              <Icon size={15} className={active ? 'text-[#00D4FF]' : 'group-hover:text-[#E8EDF5]'} />
              <span className="font-medium">{label}</span>
              {href === '/incidents' && (
                <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#FF3B3B]/20 text-[#FF3B3B]">2</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — time + version */}
      <div className="px-4 py-4 border-t border-[#1e2d3d] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[#8892a4] text-[10px] font-mono">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
          <div className="flex items-center gap-1">
            <Circle size={6} className="text-[#00FF88] fill-[#00FF88]" />
            <span className="text-[#00FF88] text-[9px] font-mono">ONLINE</span>
          </div>
        </div>
        <p className="text-[#2a3a4d] text-[9px] font-mono">v1.0.0-hackathon · MIT</p>
      </div>
    </aside>
  );
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-40 h-14 bg-[#070b12]/90 backdrop-blur border-b border-[#1e2d3d] flex items-center px-6 gap-4">
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-[#E8EDF5]">{title}</h1>
        {subtitle && <p className="text-[10px] text-[#8892a4] font-mono">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#0d1520] border border-[#1e2d3d]">
          <Activity size={11} className="text-[#00D4FF]" />
          <span className="text-[10px] font-mono text-[#8892a4]">Dynatrace connected</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" />
        </div>
      </div>
    </header>
  );
}

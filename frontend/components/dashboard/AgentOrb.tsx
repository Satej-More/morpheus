'use client';
import { useEffect, useRef } from 'react';
import type { AgentState } from '../../types';
import { getAgentStateColor, getAgentStateLabel } from '../../lib/utils';

interface AgentOrbProps {
  state: AgentState;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  task?: string;
}

export function AgentOrb({ state, size = 'md', showLabel = true, task }: AgentOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const color = getAgentStateColor(state);

  const sizes = { sm: 48, md: 80, lg: 120 };
  const px = sizes[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const cx = px / 2, cy = px / 2, r = px * 0.3;
    let frame = 0;

    function draw() {
      ctx.clearRect(0, 0, px, px);
      frame++;
      const t = frame * 0.03;

      // Outer glow rings
      for (let ring = 3; ring >= 1; ring--) {
        const alpha = state === 'idle' ? 0.04 : (0.04 + Math.sin(t * 2 + ring) * 0.03);
        const rr = r + ring * (px * 0.08) + (state !== 'idle' ? Math.sin(t + ring * 1.5) * (px * 0.02) : 0);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
        grad.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Core sphere
      const coreGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
      coreGrad.addColorStop(0, `${color}ff`);
      coreGrad.addColorStop(0.4, `${color}cc`);
      coreGrad.addColorStop(1, `${color}44`);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Inner highlight
      const hlGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.35, cy - r * 0.35, r * 0.5);
      hlGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
      hlGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = hlGrad;
      ctx.fill();

      // Orbit particles (active states)
      if (state !== 'idle') {
        const numParticles = state === 'investigating' ? 6 : state === 'resolving' ? 4 : 3;
        for (let i = 0; i < numParticles; i++) {
          const angle = t * (1 + i * 0.3) + (i * Math.PI * 2) / numParticles;
          const orbitR = r * (1.4 + i * 0.15);
          const px2 = cx + Math.cos(angle) * orbitR;
          const py2 = cy + Math.sin(angle) * orbitR;
          const pSize = 1.5 + Math.sin(t * 3 + i) * 1;
          ctx.beginPath();
          ctx.arc(px2, py2, pSize, 0, Math.PI * 2);
          ctx.fillStyle = `${color}cc`;
          ctx.fill();
        }
      }

      // Pulse wave
      if (state === 'investigating' || state === 'resolving') {
        const pulseR = r + (px * 0.25) * ((frame % 60) / 60);
        const pulseAlpha = 1 - (frame % 60) / 60;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `${color}${Math.round(pulseAlpha * 80).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current!);
  }, [state, color, px]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <canvas ref={canvasRef} width={px} height={px} className="block" />
      </div>
      {showLabel && (
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono font-semibold uppercase tracking-widest"
              style={{ color }}
            >
              {getAgentStateLabel(state)}
            </span>
            {state !== 'idle' && (
              <span className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="inline-block w-1 h-1 rounded-full animate-bounce"
                    style={{ backgroundColor: color, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            )}
          </div>
          {task && (
            <p className="text-xs text-[#8892a4] mt-0.5 max-w-[200px] truncate font-mono">{task}</p>
          )}
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useRef } from 'react';
import type { Service } from '../../types';

interface Node {
  id: string;
  label: string;
  type: string;
  status: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface Edge {
  from: string;
  to: string;
}

function getStatusColor(status: string): string {
  return status === 'healthy' ? '#00FF88' : status === 'degraded' ? '#FFB800' : '#FF3B3B';
}

function getTypeIcon(type: string): string {
  return { api: 'API', database: 'DB', cache: '⚡', queue: 'Q', gateway: 'GW' }[type] ?? '?';
}

export function TopologyGraph({ services }: { services: Service[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Build nodes
    if (nodesRef.current.length === 0) {
      nodesRef.current = services.map((s, i) => {
        const angle = (i / services.length) * Math.PI * 2;
        const radius = Math.min(W, H) * 0.3;
        return {
          id: s.id,
          label: s.name,
          type: s.type,
          status: s.status,
          x: W / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
          y: H / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
          vx: 0, vy: 0,
          r: s.type === 'gateway' ? 28 : s.type === 'database' || s.type === 'cache' ? 22 : 24,
        };
      });
    } else {
      // Update status colors without re-positioning
      nodesRef.current = nodesRef.current.map(n => {
        const svc = services.find(s => s.id === n.id);
        return svc ? { ...n, status: svc.status } : n;
      });
    }

    // Build edges from service dependencies
    const edges: Edge[] = [];
    services.forEach(s => {
      s.dependencies.forEach(depName => {
        const dep = services.find(d => d.name === depName);
        if (dep) edges.push({ from: s.id, to: dep.id });
      });
    });

    let frame = 0;

    function simulate() {
      const nodes = nodesRef.current;
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 2000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }
      // Attraction on edges
      edges.forEach(e => {
        const a = nodes.find(n => n.id === e.from);
        const b = nodes.find(n => n.id === e.to);
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * 0.03;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      });
      // Center gravity
      nodes.forEach(n => {
        n.vx += (W / 2 - n.x) * 0.01;
        n.vy += (H / 2 - n.y) * 0.01;
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(n.r + 10, Math.min(W - n.r - 10, n.x));
        n.y = Math.max(n.r + 10, Math.min(H - n.r - 10, n.y));
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      frame++;
      if (frame < 100) simulate();

      const nodes = nodesRef.current;

      // Draw edges
      edges.forEach(e => {
        const a = nodes.find(n => n.id === e.from);
        const b = nodes.find(n => n.id === e.to);
        if (!a || !b) return;
        const isDegraded = a.status !== 'healthy' || b.status !== 'healthy';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isDegraded ? `rgba(255,59,59,0.4)` : 'rgba(30,45,61,0.8)';
        ctx.lineWidth = isDegraded ? 1.5 : 1;
        if (isDegraded) ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated packet on degraded edges
        if (isDegraded) {
          const t = ((frame * 2) % 120) / 120;
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#FF3B3B';
          ctx.fill();
        }
      });

      // Draw nodes
      nodes.forEach(n => {
        const color = getStatusColor(n.status);
        const pulse = n.status !== 'healthy' ? Math.sin(frame * 0.08) * 0.3 + 0.7 : 1;

        // Glow
        if (n.status !== 'healthy') {
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 2);
          glow.addColorStop(0, `${color}40`);
          glow.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 2, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.globalAlpha = pulse;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Node bg
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = '#0d1520';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = n.status !== 'healthy' ? pulse : 1;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Icon text
        ctx.font = `bold 9px "JetBrains Mono", monospace`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getTypeIcon(n.type), n.x, n.y - 4);

        // Label
        const shortLabel = n.label.length > 10 ? n.label.substring(0, 9) + '…' : n.label;
        ctx.font = `8px "JetBrains Mono", monospace`;
        ctx.fillStyle = n.status !== 'healthy' ? color : '#8892a4';
        ctx.fillText(shortLabel, n.x, n.y + 6);
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current!);
  }, [services]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

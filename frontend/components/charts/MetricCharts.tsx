'use client';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import type { Metric, MttrDataPoint } from '../../types';
import { formatMetricValue } from '../../lib/utils';

interface SparklineProps {
  data: Metric[];
  color: string;
  height?: number;
  showAxes?: boolean;
  metric?: string;
  threshold?: number;
  filled?: boolean;
}

const CustomTooltip = ({ active, payload, metric }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0e17] border border-[#1e2d3d] rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <p className="text-[#E8EDF5]">{formatMetricValue(payload[0].value, metric ?? '')}</p>
      <p className="text-[#8892a4] text-[10px]">{new Date(payload[0].payload.timestamp).toLocaleTimeString()}</p>
    </div>
  );
};

export function MetricSparkline({ data, color, height = 60, showAxes = false, metric = '', threshold, filled = true }: SparklineProps) {
  const chartData = data.map(d => ({ t: d.timestamp, v: d.value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showAxes && (
          <>
            <XAxis dataKey="t" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <CartesianGrid strokeDasharray="2 4" stroke="#1e2d3d" vertical={false} />
          </>
        )}
        {threshold && (
          <ReferenceLine y={threshold} stroke="#FF3B3B" strokeDasharray="3 3" strokeOpacity={0.6} />
        )}
        <Tooltip content={<CustomTooltip metric={metric} />} />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={filled ? `url(#grad-${color.replace('#', '')})` : 'none'}
          dot={false}
          activeDot={{ r: 3, fill: color, stroke: '#0a0e17', strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface MetricPanelProps {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  data: Metric[];
  color: string;
  metric?: string;
  threshold?: number;
}

export function MetricPanel({ label, value, delta, deltaPositive, data, color, metric, threshold }: MetricPanelProps) {
  return (
    <div className="bg-[#0d1520] rounded-xl border border-[#1e2d3d] p-4 hover:border-[#2a3a4d] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] text-[#8892a4] uppercase tracking-widest font-mono mb-1">{label}</p>
          <p className="text-xl font-mono font-semibold" style={{ color }}>{value}</p>
        </div>
        {delta && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            deltaPositive ? 'text-[#00FF88] bg-[#00FF88]/10' : 'text-[#FF3B3B] bg-[#FF3B3B]/10'
          }`}>
            {deltaPositive ? '▲' : '▼'} {delta}
          </span>
        )}
      </div>
      <MetricSparkline data={data} color={color} height={56} metric={metric} threshold={threshold} />
    </div>
  );
}

export function MttrComparisonChart({ data }: { data: MttrDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }} barGap={4}>
        <CartesianGrid strokeDasharray="2 4" stroke="#1e2d3d" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#8892a4', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#8892a4', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${Math.floor(v / 60)}m`}
        />
        <Tooltip
          contentStyle={{
            background: '#0a0e17', border: '1px solid #1e2d3d',
            borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '11px',
          }}
          formatter={(v: number, name: string) => [`${Math.floor(v / 60)}m ${v % 60}s`, name === 'morpheus' ? 'Morpheus MTTR' : 'Manual MTTR']}
          labelStyle={{ color: '#8892a4' }}
        />
        <Bar dataKey="manual" fill="#FF3B3B" fillOpacity={0.3} radius={[3, 3, 0, 0]} name="manual" />
        <Bar dataKey="morpheus" fill="#00D4FF" fillOpacity={0.8} radius={[3, 3, 0, 0]} name="morpheus" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FullMetricChart({ data, color, metric, threshold }: {
  data: Metric[]; color: string; metric?: string; threshold?: number;
}) {
  const chartData = data.map(d => ({ t: d.timestamp, v: d.value }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id={`full-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="#1e2d3d" vertical={false} />
        <XAxis
          dataKey="t"
          tickFormatter={t => new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          tick={{ fill: '#8892a4', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => formatMetricValue(v, metric ?? '')}
          tick={{ fill: '#8892a4', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
        />
        {threshold && (
          <ReferenceLine y={threshold} stroke="#FF3B3B" strokeDasharray="4 4" strokeOpacity={0.7}
            label={{ value: 'THRESHOLD', fill: '#FF3B3B', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
        )}
        <Tooltip content={<CustomTooltip metric={metric} />} />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#full-grad-${color.replace('#', '')})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: '#0a0e17', strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

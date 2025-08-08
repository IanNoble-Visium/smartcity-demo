import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Metrics } from '../types';

interface ResourceAllocationChartProps {
  metrics: Metrics | null;
  className?: string;
}

// Color palette aligned with TruContext design system
const colors = {
  Energy: '#eab308',
  Traffic: '#f97316',
  Infrastructure: '#22c55e',
  Security: '#06b6d4',
  Budget: '#a855f7'
};

export function ResourceAllocationChart({ metrics, className = '' }: ResourceAllocationChartProps) {
  // Build bar chart data based on metrics; fallback to zeros while loading
  const data = useMemo(() => {
    if (!metrics) {
      return [
        { name: 'Energy', value: 0 },
        { name: 'Traffic', value: 0 },
        { name: 'Infrastructure', value: 0 },
        { name: 'Security', value: 0 },
        { name: 'Budget', value: 0 }
      ];
    }
    return [
      { name: 'Energy', value: Number(metrics.energyConsumption.toFixed(1)) },
      { name: 'Traffic', value: Number((metrics.trafficFlow * 100).toFixed(1)) },
      { name: 'Infrastructure', value: Number((metrics.infrastructureHealth * 100).toFixed(1)) },
      { name: 'Security', value: Number((metrics.securityScore * 100).toFixed(1)) },
      { name: 'Budget', value: Number((metrics.budgetUtilization * 100).toFixed(1)) }
    ];
  }, [metrics]);
  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <XAxis type="number" domain={[0, 100]} hide={true} />
          <YAxis type="category" dataKey="name" width={60} tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip
            cursor={{ fill: '#1e293b' }}
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px' }}
            labelStyle={{ color: '#cbd5e1' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value: number, name: string) => [value + '%', name]}
          />
          <Bar dataKey="value" radius={[4, 4, 4, 4]}>
            {data.map(entry => (
              <Cell key={`cell-${entry.name}`} fill={colors[entry.name as keyof typeof colors]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ResourceAllocationChart;
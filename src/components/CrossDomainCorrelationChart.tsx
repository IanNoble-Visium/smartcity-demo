import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';

// A simple radar chart illustrating correlations across different city domains.
// This chart uses random values seeded at mount to approximate a correlation
// matrix. In a production system, these values would come from actual
// correlation analysis across city KPIs and incidents.

interface CrossDomainCorrelationChartProps {
  className?: string;
}

export function CrossDomainCorrelationChart({ className = '' }: CrossDomainCorrelationChartProps) {
  // Generate mock correlation values once on component mount
  const data = useMemo(() => {
    const domains = ['Energy', 'Traffic', 'Air Quality', 'Security', 'Infrastructure'];
    return domains.map((subject, i) => ({
      subject,
      value: 0.3 + Math.abs(Math.sin((i + 1) * 1.3)) * 0.7
    }));
  }, []);
  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 8 }} tickCount={5} />
          <Radar
            name="Correlation"
            dataKey="value"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CrossDomainCorrelationChart;
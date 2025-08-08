import { useMemo } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import type { Metrics } from '../types';

interface CitizenSatisfactionGaugeProps {
  metrics: Metrics | null;
  className?: string;
}

export function CitizenSatisfactionGauge({ metrics, className = '' }: CitizenSatisfactionGaugeProps) {
  // Derive satisfaction percentage
  const value = useMemo(() => {
    return metrics ? Math.round(metrics.citizenSatisfaction * 100) : 0;
  }, [metrics]);
  const data = useMemo(() => [{ name: 'Satisfaction', value }], [value]);
  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="100%"
          startAngle={180}
          endAngle={0}
          innerRadius="70%"
          outerRadius="100%"
          barSize={18}
          data={data}
        >
          {/*
            Recharts' RadialBar component doesn't expose `minAngle` and `clockWise`
            in its TypeScript definitions.  We create a local alias of
            RadialBar typed as `any` to allow passing these properties
            without compiler errors.  See https://recharts.org/en-US/api/RadialBar
            for runtime documentation.
          */}
          {(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SafeRadialBar: any = RadialBar;
            return (
              <SafeRadialBar
                minAngle={5}
                clockWise
                dataKey="value"
                cornerRadius={10}
                fill="#f472b6"
                background={{ fill: '#334155' }}
              />
            );
          })()}
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-sm text-slate-400">Satisfaction</div>
        <div className="text-2xl font-bold text-fuchsia-400">
          {value}<span className="text-base font-normal text-slate-400">%</span>
        </div>
      </div>
    </div>
  );
}

export default CitizenSatisfactionGauge;
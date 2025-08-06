
import type { Metrics } from "../types";

interface MetricCardProps {
  label: string;
  value: string;
  change?: number;
  status?: 'normal' | 'warning' | 'critical';
  unit?: string;
}

function MetricCard({ label, value, change, status = 'normal', unit }: MetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'warning': return 'border-warning';
      case 'critical': return 'border-critical';
      default: return 'border-success';
    }
  };



  return (
    <div className={`metric-card ${getStatusColor()}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {value}
        {unit && <span className="text-sm text-muted ml-1">{unit}</span>}
      </div>
      {change !== undefined && (
        <div className={`metric-change ${change > 0 ? 'positive' : 'negative'}`}>
          <span>{change > 0 ? '↗' : '↘'}</span>
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}

export function ExecutiveKpis({ metrics }: { metrics: Metrics | null }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="metric-card skeleton h-24"></div>
        ))}
      </div>
    );
  }

  const getStatus = (condition1: boolean, condition2: boolean): 'normal' | 'warning' | 'critical' => {
    if (condition1) return 'critical';
    if (condition2) return 'warning';
    return 'normal';
  };

  const kpiData = [
    {
      label: 'Energy Load',
      value: metrics.energyConsumption.toFixed(1),
      unit: 'MW',
      status: getStatus(metrics.energyConsumption > 80, metrics.energyConsumption > 70)
    },
    {
      label: 'Traffic Flow',
      value: (metrics.trafficFlow * 100).toFixed(0),
      unit: '%',
      status: getStatus(metrics.trafficFlow < 0.3, metrics.trafficFlow < 0.5)
    },
    {
      label: 'Air Quality',
      value: metrics.airQuality.toFixed(0),
      unit: 'AQI',
      status: getStatus(metrics.airQuality > 100, metrics.airQuality > 50)
    },
    {
      label: 'Infrastructure',
      value: (metrics.infrastructureHealth * 100).toFixed(0),
      unit: '%',
      status: getStatus(metrics.infrastructureHealth < 0.8, metrics.infrastructureHealth < 0.9)
    },
    {
      label: 'Network Latency',
      value: metrics.networkLatency.toFixed(0),
      unit: 'ms',
      status: getStatus(metrics.networkLatency > 100, metrics.networkLatency > 50)
    },
    {
      label: 'Security Score',
      value: (metrics.securityScore * 100).toFixed(0),
      unit: '%',
      status: getStatus(metrics.securityScore < 0.7, metrics.securityScore < 0.8)
    },
    {
      label: 'Citizen Satisfaction',
      value: (metrics.citizenSatisfaction * 100).toFixed(0),
      unit: '%',
      status: getStatus(metrics.citizenSatisfaction < 0.6, metrics.citizenSatisfaction < 0.7)
    },
    {
      label: 'Budget Utilization',
      value: (metrics.budgetUtilization * 100).toFixed(0),
      unit: '%',
      status: getStatus(false, metrics.budgetUtilization > 0.9)
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {kpiData.map((kpi, i) => (
        <MetricCard
          key={i}
          label={kpi.label}
          value={kpi.value}
          unit={kpi.unit}
          status={kpi.status}
        />
      ))}
    </div>
  );
}
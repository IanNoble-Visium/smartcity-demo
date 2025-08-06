import React from "react";

export interface Metrics {
  energyConsumption: number;
  trafficFlow: number;
  airQuality: number;
  infrastructureHealth: number;
}

export function ExecutiveKpis({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: 'Energy Load (MW)', value: metrics.energyConsumption.toFixed(1) },
        { label: 'Traffic Flow Index', value: metrics.trafficFlow.toFixed(2) },
        { label: 'Air Quality (AQI)', value: metrics.airQuality.toFixed(0) },
        { label: 'Infra Health (%)', value: (metrics.infrastructureHealth * 100).toFixed(0) }
      ].map((k, i) => (
        <div key={i} className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="text-slate-400 text-xs">{k.label}</div>
          <div className="text-2xl font-semibold mt-1">{k.value}</div>
        </div>
      ))}
    </div>
  );
}
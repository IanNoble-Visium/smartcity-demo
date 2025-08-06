import React from "react";
import type { Metrics } from "./ExecutiveKpis";

export function EnergyPanel({ metrics }: { metrics: Metrics }) {
  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
      <div className="font-medium mb-2">Energy Overview</div>
      <div className="text-sm text-slate-300">
        Current Load: <span className="font-semibold">{metrics.energyConsumption.toFixed(1)} MW</span>
      </div>
      <div className="text-sm text-slate-300">
        Grid Health: <span className="font-semibold">{(metrics.infrastructureHealth * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-3 h-2 bg-slate-800 rounded">
        <div 
          style={{ width: `${Math.min(100, metrics.energyConsumption)}%` }} 
          className="h-2 bg-emerald-500 rounded"
        ></div>
      </div>
    </div>
  );
}
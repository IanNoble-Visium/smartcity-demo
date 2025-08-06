import React from "react";

export interface Incident {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  location: [number, number];
  started: string;
  summary: string;
}

export function IncidentDetail({ incident }: { incident: Incident | undefined }) {
  if (!incident) return null;
  
  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
      <div className="font-medium mb-1">Incident</div>
      <div className="text-sm">
        #{incident.id} • {incident.type} • <span className="uppercase">{incident.severity}</span>
      </div>
      <div className="text-xs text-slate-400">
        Started {new Date(incident.started).toLocaleString()}
      </div>
      <div className="mt-2 text-slate-200 text-sm">{incident.summary}</div>
    </div>
  );
}
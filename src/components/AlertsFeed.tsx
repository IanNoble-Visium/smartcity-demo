import React from "react";

export interface Alert {
  id: string;
  time: string;
  severity: "info" | "warn" | "crit";
  title: string;
  details: string;
}

const severityStyles = {
  info: "bg-emerald-500/20 text-emerald-300",
  warn: "bg-amber-500/20 text-amber-300",
  crit: "bg-rose-500/20 text-rose-300"
};

export function AlertsFeed({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 h-full overflow-auto">
      <div className="font-medium mb-2">Alerts</div>
      <ul className="space-y-2">
        {alerts.map(alert => (
          <li key={alert.id} className={`rounded-md p-3 ${severityStyles[alert.severity]}`}>
            <div className="text-xs opacity-70">{new Date(alert.time).toLocaleTimeString()}</div>
            <div className="font-semibold">{alert.title}</div>
            <div className="text-sm opacity-90">{alert.details}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
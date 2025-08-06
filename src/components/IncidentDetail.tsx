import type { Incident, AlertSeverity, IncidentStatus } from "../types";

const severityStyles: Record<AlertSeverity, string> = {
  info: "status-info",
  low: "status-info",
  medium: "status-warning", 
  high: "status-alert",
  critical: "status-critical"
};

const statusStyles: Record<IncidentStatus, string> = {
  reported: "text-warning",
  investigating: "text-info",
  responding: "text-info",
  mitigating: "text-warning",
  resolved: "text-success",
  closed: "text-muted"
};

const statusIcons: Record<IncidentStatus, string> = {
  reported: "🔴",
  investigating: "🔍",
  responding: "🚑",
  mitigating: "⚠️",
  resolved: "✅",
  closed: "📁"
};

function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffDays}d ${diffHours % 24}h`;
}

export function IncidentDetail({ incident }: { incident: Incident | null }) {
  if (!incident) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <div className="text-muted">
          <div className="text-4xl mb-2">📋</div>
          <p>No incident selected</p>
          <p className="text-xs mt-1">Select an incident to view details</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-accent pb-4 mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{statusIcons[incident.status]}</span>
            <h3 className="font-semibold text-lg">Incident #{incident.id}</h3>
          </div>
          <div className={`status-indicator ${severityStyles[incident.severity]}`}>
            {incident.severity.toUpperCase()}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-secondary">
          <span className="flex items-center gap-1">
            <span className={statusStyles[incident.status]}>●</span>
            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
          </span>
          <span>Type: {incident.type}</span>
          <span>Duration: {formatDuration(incident.startTime, incident.endTime)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto space-y-4">
        {/* Description */}
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-secondary leading-relaxed">
            {incident.description}
          </p>
        </div>

        {/* Location */}
        {incident.location && (
          <div>
            <h4 className="font-medium mb-2">Location</h4>
            <div className="text-sm text-secondary">
              <div>Coordinates: {incident.location.latitude.toFixed(6)}, {incident.location.longitude.toFixed(6)}</div>
              {incident.location.address && (
                <div className="mt-1">Address: {incident.location.address}</div>
              )}
            </div>
          </div>
        )}

        {/* Affected Systems */}
        {incident.affectedSystems && incident.affectedSystems.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Affected Systems</h4>
            <div className="space-y-1">
              {incident.affectedSystems.map((system: string, index: number) => (
                <div key={index} className="text-sm bg-tertiary px-2 py-1 rounded inline-block mr-2 mb-1">
                  {system}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <h4 className="font-medium mb-2">Timeline</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">Reported:</span>
              <span>{new Date(incident.startTime).toLocaleString()}</span>
            </div>
            {incident.responders && incident.responders.length > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary">Responders:</span>
                <span>{incident.responders.slice(0, 2).join(', ')}</span>
              </div>
            )}
            {incident.endTime && (
              <div className="flex justify-between">
                <span className="text-secondary">Resolved:</span>
                <span>{new Date(incident.endTime).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Root Cause */}
        {incident.rootCause && (
          <div>
            <h4 className="font-medium mb-2">Root Cause</h4>
            <p className="text-sm text-secondary">{incident.rootCause}</p>
          </div>
        )}

        {/* Evidence */}
        {incident.evidence && incident.evidence.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Evidence</h4>
            <div className="space-y-2">
              {incident.evidence.map((item, index) => (
                <div key={index} className="border border-accent rounded p-2">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-xs text-muted">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-secondary">{item.filename}</div>
                  {item.url && (
                    <a href={item.url} className="text-xs text-info hover:underline mt-1 inline-block">
                      View Evidence →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-accent pt-4 mt-4">
        <div className="flex gap-2">
          {incident.status === 'reported' && (
            <button className="btn btn-primary text-xs">
              Start Investigation
            </button>
          )}
          {incident.status === 'investigating' && (
            <button className="btn btn-success text-xs">
              Mark Resolved
            </button>
          )}
          <button className="btn btn-ghost text-xs">
            Add Evidence
          </button>
          <button className="btn btn-ghost text-xs">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
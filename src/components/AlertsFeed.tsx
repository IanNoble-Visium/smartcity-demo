
import type { Alert, AlertSeverity } from "../types";

const severityStyles: Record<AlertSeverity, string> = {
  info: "status-info",
  low: "status-info",
  medium: "status-warning",
  high: "status-alert",
  critical: "status-critical"
};

const severityIcons: Record<AlertSeverity, string> = {
  info: "ℹ",
  low: "⚠",
  medium: "⚠",
  high: "⚠",
  critical: "🚨"
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const alertTime = new Date(timestamp);
  const diffMs = now.getTime() - alertTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function AlertsFeed({ alerts }: { alerts: Alert[] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <div className="text-muted">
          <div className="text-4xl mb-2">✓</div>
          <p>No active alerts</p>
          <p className="text-xs mt-1">All systems operating normally</p>
        </div>
      </div>
    );
  }

  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="space-y-2">
          {sortedAlerts.slice(0, 20).map(alert => (
            <div key={alert.id} className="alert border-l-4 p-3 rounded-md transition-all hover:shadow-md">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{severityIcons[alert.severity]}</span>
                  <span className={`status-indicator ${severityStyles[alert.severity]}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {formatTimeAgo(alert.timestamp)}
                </div>
              </div>
              
              <div className="mb-1">
                <div className="font-medium text-sm leading-tight">{alert.title}</div>
              </div>
              
              <div className="text-xs text-secondary leading-relaxed">
                {alert.description}
              </div>
              
              {alert.source && (
                <div className="text-xs text-muted mt-2 flex items-center gap-2">
                  <span>Source:</span>
                  <code className="bg-tertiary px-1 py-0.5 rounded text-xs">
                    {alert.source}
                  </code>
                </div>
              )}
              
              {alert.affectedAssets && alert.affectedAssets.length > 0 && (
                <div className="text-xs text-muted mt-1">
                  <span>Assets: </span>
                  <span>{alert.affectedAssets.slice(0, 2).join(', ')}</span>
                  {alert.affectedAssets.length > 2 && (
                    <span> +{alert.affectedAssets.length - 2} more</span>
                  )}
                </div>
              )}
              
              {alert.correlationId && (
                <div className="text-xs text-purple mt-1">
                  Correlated Event: {alert.correlationId.slice(-8)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {alerts.length > 20 && (
        <div className="border-t border-accent mt-2 pt-2 text-center">
          <button className="btn btn-ghost text-xs">
            View All {alerts.length} Alerts
          </button>
        </div>
      )}
    </div>
  );
}
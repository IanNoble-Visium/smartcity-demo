import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Replace the old 3D map with a deck.gl driven map
import { ExecutiveMapDeck } from './ExecutiveMapDeck';
import { CrossDomainCorrelationChart } from './CrossDomainCorrelationChart';
import { ResourceAllocationChart } from './ResourceAllocationChart';
import { CitizenSatisfactionGauge } from './CitizenSatisfactionGauge';
// Import the inline alert detail panel instead of always using a modal
import { AlertDetailInline } from './AlertDetailInline';
import { IncidentDetail } from './IncidentDetail';
import type { Metrics, Alert, Incident } from '../types';

interface OptimizedExecutiveDashboardProps {
  metrics: Metrics | null;
  alerts: Alert[];
  incidents: Incident[];
  topology: any | null;
}



function CompactKpiGrid({ metrics }: { metrics: Metrics | null }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-slate-800/50 rounded p-2 h-16 animate-pulse"></div>
        ))}
      </div>
    );
  }

  const kpiData = [
    { label: 'Energy', value: metrics.energyConsumption.toFixed(1), unit: 'MW', status: metrics.energyConsumption > 80 ? 'critical' : metrics.energyConsumption > 70 ? 'warning' : 'normal' },
    { label: 'Traffic', value: (metrics.trafficFlow * 100).toFixed(0), unit: '%', status: metrics.trafficFlow < 0.3 ? 'critical' : metrics.trafficFlow < 0.5 ? 'warning' : 'normal' },
    { label: 'Air Quality', value: metrics.airQuality.toFixed(0), unit: 'AQI', status: metrics.airQuality > 100 ? 'critical' : metrics.airQuality > 50 ? 'warning' : 'normal' },
    { label: 'Infrastructure', value: (metrics.infrastructureHealth * 100).toFixed(0), unit: '%', status: metrics.infrastructureHealth < 0.8 ? 'critical' : metrics.infrastructureHealth < 0.9 ? 'warning' : 'normal' },
    { label: 'Network', value: metrics.networkLatency.toFixed(0), unit: 'ms', status: metrics.networkLatency > 100 ? 'critical' : metrics.networkLatency > 50 ? 'warning' : 'normal' },
    { label: 'Security', value: (metrics.securityScore * 100).toFixed(0), unit: '%', status: metrics.securityScore < 0.7 ? 'critical' : metrics.securityScore < 0.8 ? 'warning' : 'normal' },
    { label: 'Satisfaction', value: (metrics.citizenSatisfaction * 100).toFixed(0), unit: '%', status: metrics.citizenSatisfaction < 0.6 ? 'critical' : metrics.citizenSatisfaction < 0.7 ? 'warning' : 'normal' },
    { label: 'Budget', value: (metrics.budgetUtilization * 100).toFixed(0), unit: '%', status: metrics.budgetUtilization > 0.9 ? 'warning' : 'normal' }
  ];

  const statusColors = {
    normal: 'text-green-400 bg-green-400/20',
    warning: 'text-yellow-400 bg-yellow-400/20',
    critical: 'text-red-400 bg-red-400/20'
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {kpiData.map((kpi, i) => (
        <div key={i} className="bg-slate-800/50 rounded p-2 text-center">
          <div className="text-xs text-slate-400 mb-1">{kpi.label}</div>
          <div className={`text-lg font-bold ${statusColors[kpi.status as keyof typeof statusColors].split(' ')[0]}`}>
            {kpi.value}<span className="text-xs ml-1">{kpi.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// CompactAlertsList was previously defined for an isolated alerts component.  The
// alerts list is now rendered inline within the dashboard, so this helper
// component is no longer used.  It is intentionally left commented out to
// avoid unused variable warnings while preserving the original implementation
// for reference.
/*
function CompactAlertsList({ alerts }: { alerts: Alert[] }) {
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').slice(0, 3);
  if (criticalAlerts.length === 0) {
    return (
      <div className="text-center text-slate-400 py-4">
        <div className="text-2xl mb-1">✓</div>
        <div className="text-xs">No critical alerts</div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {criticalAlerts.map(alert => (
        <div key={alert.id} className="bg-slate-800/50 rounded p-2 border-l-2 border-red-400">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-red-400 font-medium">{alert.severity.toUpperCase()}</span>
            <span className="text-xs text-slate-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="text-sm text-white font-medium">{alert.title}</div>
          <div className="text-xs text-slate-300 mt-1 line-clamp-2">{alert.description}</div>
        </div>
      ))}
    </div>
  );
}
*/

export function OptimizedExecutiveDashboard({
  metrics,
  alerts,
  incidents,
  topology: _topology
}: OptimizedExecutiveDashboardProps) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  // Track selected alert for displaying associated video details
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  // Focused alert for map fly-to; separate from selectedAlert so we can keep
  // map state in sync even if the details dialog is closed.
  const [focusedAlert, setFocusedAlert] = useState<Alert | null>(null);
  // Collapse state for KPI grid; when collapsed, show a compact bar to free vertical space
  // Collapse KPI section by default to prioritise map/alert visibility; users can expand as needed
  const [kpiCollapsed, setKpiCollapsed] = useState(true);

  // Render a compact horizontal KPI bar when the grid is collapsed.  This bar
  // displays each metric in a condensed format with minimal spacing to
  // maximize available screen real estate.  Icons could be substituted in
  // place of labels for further compactness.
  const KpiBar = ({ metrics }: { metrics: Metrics | null }) => {
    if (!metrics) return null;
    const items = [
      { label: 'Energy', value: `${metrics.energyConsumption.toFixed(1)} MW` },
      { label: 'Traffic', value: `${(metrics.trafficFlow * 100).toFixed(0)}%` },
      { label: 'Air', value: `${metrics.airQuality.toFixed(0)} AQI` },
      { label: 'Infra', value: `${(metrics.infrastructureHealth * 100).toFixed(0)}%` },
      { label: 'Net', value: `${metrics.networkLatency.toFixed(0)} ms` },
      { label: 'Sec', value: `${(metrics.securityScore * 100).toFixed(0)}%` },
      { label: 'Sat', value: `${(metrics.citizenSatisfaction * 100).toFixed(0)}%` },
      { label: 'Budget', value: `${(metrics.budgetUtilization * 100).toFixed(0)}%` }
    ];
    return (
      <div className="flex flex-wrap items-center gap-3 text-xs text-cyan-200">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <span className="font-medium text-slate-200">{item.label}:</span>
            <span className="text-slate-400 whitespace-nowrap">{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 12×12 grid layout to ensure a single viewport without scrolling */}
      <div className="h-full grid grid-cols-12 grid-rows-12 gap-2 p-2">
        {/* Header Status Bar */}
        <div className="col-span-12 row-span-1 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Executive Dashboard</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-medium">LIVE</span>
              <span className="text-slate-400 text-sm">Updated just now</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-300">System Health: <span className="text-green-400 font-medium">98.5%</span></span>
            <span className="text-slate-300">Active Incidents: <span className="text-yellow-400 font-medium">{incidents.length}</span></span>
          </div>
        </div>
        {/* KPI Cards with collapsible option */}
        <div
          className={`col-span-12 ${kpiCollapsed ? 'row-span-1' : 'row-span-2'} bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 relative`}
        >
          {/* Collapse/expand toggle */}
          <button
            onClick={() => setKpiCollapsed(prev => !prev)}
            className="absolute top-2 right-2 text-slate-400 hover:text-cyan-300 text-sm focus:outline-none"
            title={kpiCollapsed ? 'Expand metrics' : 'Collapse metrics'}
          >
            {kpiCollapsed ? '▾' : '▴'}
          </button>
          {kpiCollapsed ? (
            <KpiBar metrics={metrics} />
          ) : (
            <CompactKpiGrid metrics={metrics} />
          )}
        </div>
        {/* Main content: Map and sidebars */}
        <div className={`col-span-8 ${kpiCollapsed ? 'row-span-4' : 'row-span-3'} bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden`}>
          <div className="h-full relative">
            {/* Map labels */}
            <div className="absolute top-2 left-2 z-10 bg-slate-900/80 backdrop-blur-md rounded px-2 py-1">
              <span className="text-cyan-300 text-sm font-medium">Live City Map</span>
              <span className="text-slate-400 text-xs ml-2">Baltimore Metropolitan Area</span>
            </div>
            <div className="absolute top-2 right-2 z-10 bg-slate-900/80 backdrop-blur-md rounded px-2 py-1">
              <span className="text-green-300 text-sm">ONLINE</span>
            </div>
            <ExecutiveMapDeck
              alerts={alerts}
              focusedAlert={focusedAlert}
              onAlertSelect={(alert: Alert) => {
                setSelectedAlert(alert);
                setFocusedAlert(alert);
              }}
            />
          </div>
        </div>
        {/* Sidebar: Critical Alerts and Recent Incidents */}
        <div className={`col-span-4 ${kpiCollapsed ? 'row-span-4' : 'row-span-3'} flex flex-col space-y-2`}>
          {/* Critical Alerts Panel */}
          <div className="flex-1 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
              <h3 className="text-sm font-semibold text-white">Critical Alerts</h3>
            </div>
            <div className="p-3 flex-1 overflow-y-auto">
              {(() => {
                // Display all critical/high severity alerts. The panel scrolls internally to prevent
                // it from expanding and pushing other sections off-screen when new alerts arrive.
                const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
                if (criticalAlerts.length === 0) {
                  return (
                    <div className="text-center text-slate-400 py-6">
                      <div className="text-2xl mb-1">✓</div>
                      <div className="text-xs">No critical alerts</div>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {criticalAlerts.map(alert => (
                      <div
                        key={alert.id}
                        className="bg-slate-800/50 rounded p-2 cursor-pointer hover:bg-slate-700/50 transition-colors border-l-2 border-red-400"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setFocusedAlert(alert);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-red-400 font-medium">{alert.severity.toUpperCase()}</span>
                          <span className="text-xs text-slate-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-sm text-white font-medium truncate" title={alert.title}>{alert.title}</div>
                        <div className="text-xs text-slate-300 mt-1 line-clamp-2">{alert.description}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
          {/* Recent Incidents Panel */}
          <div className="flex-1 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              <h3 className="text-sm font-semibold text-white">Recent Incidents</h3>
            </div>
            <div className="p-3 flex-1 overflow-y-auto">
              {incidents.length > 0 ? (
                <div className="space-y-2">
                  {incidents.slice(0, 4).map(incident => (
                    <div
                      key={incident.id}
                      className="bg-slate-800/50 rounded p-2 cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={() => setSelectedIncident(incident)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${
                          incident.severity === 'critical'
                            ? 'text-red-400'
                            : incident.severity === 'high'
                            ? 'text-orange-400'
                            : incident.severity === 'medium'
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                        }`}>{incident.severity.toUpperCase()}</span>
                        <span className="text-xs text-slate-400">{new Date(incident.startTime).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-sm text-white font-medium truncate" title={incident.summary}>{incident.summary}</div>
                      <div className="text-xs text-slate-300 mt-1 line-clamp-2">{incident.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-6">
                  <div className="text-2xl mb-1">✓</div>
                  <div className="text-xs">No active incidents</div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Bottom section: Analytics and Alert Detail */}
        <div className="col-span-12 row-span-5 grid grid-cols-12 gap-2">
          {/* Analytics panels occupy 8 columns */}
          <div className="col-span-8 grid grid-cols-3 gap-2">
            <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 flex flex-col">
              <h3 className="text-sm font-semibold text-white mb-2">Cross‑Domain Correlation</h3>
              <div className="flex-1">
                <CrossDomainCorrelationChart />
              </div>
            </div>
            <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 flex flex-col">
              <h3 className="text-sm font-semibold text-white mb-2">Resource Allocation</h3>
              <div className="flex-1">
                <ResourceAllocationChart metrics={metrics} />
              </div>
            </div>
            <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 flex flex-col">
              <h3 className="text-sm font-semibold text-white mb-2">Citizen Satisfaction</h3>
              <div className="flex-1">
                <CitizenSatisfactionGauge metrics={metrics} />
              </div>
            </div>
          </div>
          {/* Alert detail panel occupies 4 columns */}
          <div className="col-span-4">
            <AlertDetailInline alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
          </div>
        </div>
        {/* Bottom status bar */}
        <div className="col-span-12 row-span-1 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg flex items-center justify-between px-4 text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-slate-300">Network: <span className="text-blue-400">Optimal</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-slate-300">Infrastructure: <span className="text-green-400">{metrics ? (metrics.infrastructureHealth * 100).toFixed(0) : '93'}%</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-slate-300">Traffic: <span className="text-yellow-400">{metrics ? (metrics.trafficFlow * 100).toFixed(0) : '36'}%</span></span>
            </div>
          </div>
          <div className="text-xs text-slate-400 whitespace-nowrap">
            TruContext Smart City Operations • Baltimore, MD • {new Date().toLocaleString()}
          </div>
        </div>
      </div>
      {/* Incident modal */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIncident(null)}
          >
            <motion.div
              className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Incident Details</h2>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <IncidentDetail incident={selectedIncident} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

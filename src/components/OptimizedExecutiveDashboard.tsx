import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExecutiveKpis } from './ExecutiveKpis';
import { EnhancedLiveMap } from './EnhancedLiveMap';
import { Enhanced3DCityMap } from './Enhanced3DCityMap';
import { AlertsFeed } from './AlertsFeed';
import { EnergyPanel } from './EnergyPanel';
import { TopologyView } from './TopologyView';
import { IncidentDetail } from './IncidentDetail';
import type { Metrics, Alert, Incident, Topology } from '../types';

interface OptimizedExecutiveDashboardProps {
  metrics: Metrics | null;
  alerts: Alert[];
  incidents: Incident[];
  topology: Topology | null;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  statusIndicator?: React.ReactNode;
  compact?: boolean;
}

function CollapsibleSection({ 
  title, 
  children, 
  defaultExpanded = false, 
  statusIndicator,
  compact = false 
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden ${compact ? 'text-sm' : ''}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>{title}</h3>
          {statusIndicator}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400"
        >
          ▼
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`p-4 ${compact ? 'p-3' : 'p-4'}`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
          <div className={`text-lg font-bold ${statusColors[kpi.status].split(' ')[0]}`}>
            {kpi.value}<span className="text-xs ml-1">{kpi.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

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

export function OptimizedExecutiveDashboard({ 
  metrics, 
  alerts, 
  incidents, 
  topology 
}: OptimizedExecutiveDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  const [is3DMode, setIs3DMode] = useState(true);
  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
  const openIncidentsCount = incidents.filter(i => i.status !== 'resolved').length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Responsive Header */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-2 sm:px-4 py-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Executive Dashboard</h1>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Live
              </span>
              <span className="hidden sm:inline">Updated 2s ago</span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {/* 3D Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Map:</span>
              <button
                onClick={() => setIs3DMode(!is3DMode)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  is3DMode 
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {is3DMode ? '3D 🏙️' : '2D 🗺️'}
              </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex bg-slate-800/50 rounded-lg p-1 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'details' 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full p-2 sm:p-4 overflow-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 h-full max-h-full">
                {/* Left Column - Map and KPIs */}
                <div className="lg:col-span-8 col-span-1 flex flex-col gap-2 sm:gap-4 min-h-0">
                  {/* Compact KPIs */}
                  <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-2 sm:p-4 flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-white">Key Performance Indicators</h2>
                      <span className="status-indicator status-success text-xs">All Systems</span>
                    </div>
                    <CompactKpiGrid metrics={metrics} />
                  </div>

                  {/* Enhanced Live Map - Now takes more space and supports 3D */}
                  <div className="flex-1 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden min-h-0" style={{ minHeight: '300px' }}>
                    <div className="px-2 sm:px-4 py-2 sm:py-3 bg-slate-800/50 border-b border-slate-700/50 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                          {is3DMode ? '3D Live City Map' : 'Live City Map'}
                          {is3DMode && <span className="text-cyan-400 text-xs">🏙️</span>}
                        </h2>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="status-indicator status-success">Active</span>
                            <span className="text-slate-400">{incidents.length} Incidents</span>
                          </div>
                          <motion.button
                            onClick={() => setIs3DMode(!is3DMode)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              is3DMode 
                                ? 'bg-cyan-500 text-white' 
                                : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {is3DMode ? '→ 2D' : '→ 3D'}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0" style={{ height: 'calc(100% - 60px)' }}>
                      <AnimatePresence mode="wait">
                        {is3DMode ? (
                          <motion.div
                            key="3d-map"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                            className="h-full"
                          >
                            <Enhanced3DCityMap incidents={incidents} />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="2d-map"
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5 }}
                            className="h-full"
                          >
                            <EnhancedLiveMap incidents={incidents} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Right Column - Alerts and Quick Info */}
                <div className="lg:col-span-4 col-span-1 flex flex-col gap-2 sm:gap-4 min-h-0">
                  {/* Critical Alerts */}
                  <CollapsibleSection
                    title="Critical Alerts"
                    defaultExpanded={true}
                    compact={true}
                    statusIndicator={
                      criticalAlertsCount > 0 ? (
                        <span className="status-indicator status-critical text-xs">
                          {criticalAlertsCount} Active
                        </span>
                      ) : (
                        <span className="status-indicator status-success text-xs">Clear</span>
                      )
                    }
                  >
                    <CompactAlertsList alerts={alerts} />
                  </CollapsibleSection>

                  {/* Active Incidents */}
                  <CollapsibleSection
                    title="Active Incidents"
                    defaultExpanded={openIncidentsCount > 0}
                    compact={true}
                    statusIndicator={
                      <span className={`status-indicator text-xs ${
                        openIncidentsCount > 0 ? 'status-warning' : 'status-success'
                      }`}>
                        {openIncidentsCount} Open
                      </span>
                    }
                  >
                    {incidents.length > 0 ? (
                      <div className="space-y-2">
                        {incidents.filter(i => i.status !== 'resolved').slice(0, 3).map(incident => (
                          <div key={incident.id} className="bg-slate-800/50 rounded p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-yellow-400 font-medium">#{incident.id}</span>
                              <span className="text-xs text-slate-400">{incident.severity}</span>
                            </div>
                            <div className="text-sm text-white font-medium line-clamp-1">{incident.title}</div>
                            <div className="text-xs text-slate-300 mt-1 line-clamp-2">{incident.description}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 py-4">
                        <div className="text-2xl mb-1">✓</div>
                        <div className="text-xs">No active incidents</div>
                      </div>
                    )}
                  </CollapsibleSection>

                  {/* System Status */}
                  <CollapsibleSection
                    title="System Status"
                    defaultExpanded={false}
                    compact={true}
                    statusIndicator={
                      <span className="status-indicator status-success text-xs">Operational</span>
                    }
                  >
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Network Health:</span>
                        <span className="text-green-400">98.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Data Processing:</span>
                        <span className="text-green-400">Normal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">API Response:</span>
                        <span className="text-green-400">{metrics?.networkLatency.toFixed(0)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Active Connections:</span>
                        <span className="text-cyan-400">1,247</span>
                      </div>
                    </div>
                  </CollapsibleSection>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full p-2 sm:p-4 overflow-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4">
                {/* Full KPIs */}
                <div className="col-span-12">
                  <CollapsibleSection
                    title="Detailed Performance Metrics"
                    defaultExpanded={true}
                  >
                    <ExecutiveKpis metrics={metrics} />
                  </CollapsibleSection>
                </div>

                {/* Energy Management */}
                <div className="lg:col-span-6 col-span-1">
                  <CollapsibleSection
                    title="Energy Management"
                    defaultExpanded={false}
                    statusIndicator={<span className="status-indicator status-success text-xs">Grid Stable</span>}
                  >
                    <EnergyPanel metrics={metrics} />
                  </CollapsibleSection>
                </div>

                {/* Network Topology */}
                <div className="lg:col-span-6 col-span-1">
                  <CollapsibleSection
                    title="Network Topology"
                    defaultExpanded={false}
                    statusIndicator={
                      <span className="status-indicator status-success text-xs">
                        {topology?.nodes.length || 0} Nodes
                      </span>
                    }
                  >
                    <TopologyView topology={topology} />
                  </CollapsibleSection>
                </div>

                {/* All Alerts */}
                <div className="lg:col-span-6 col-span-1">
                  <CollapsibleSection
                    title="All Alerts"
                    defaultExpanded={false}
                    statusIndicator={
                      <span className={`status-indicator text-xs ${
                        criticalAlertsCount > 0 ? 'status-warning' : 'status-success'
                      }`}>
                        {alerts.length} Total
                      </span>
                    }
                  >
                    <div style={{ height: '400px', overflow: 'auto' }}>
                      <AlertsFeed alerts={alerts} />
                    </div>
                  </CollapsibleSection>
                </div>

                {/* Incident Details */}
                <div className="lg:col-span-6 col-span-1">
                  <CollapsibleSection
                    title="Incident Management"
                    defaultExpanded={false}
                    statusIndicator={
                      <span className={`status-indicator text-xs ${
                        openIncidentsCount > 0 ? 'status-warning' : 'status-success'
                      }`}>
                        {openIncidentsCount} Open
                      </span>
                    }
                  >
                    <div style={{ height: '400px', overflow: 'auto' }}>
                      {incidents.length > 0 ? (
                        <IncidentDetail incident={incidents[0]} />
                      ) : (
                        <div className="text-center text-slate-400 py-8">
                          <p>No active incidents</p>
                          <p className="text-xs mt-1">All systems operating normally</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

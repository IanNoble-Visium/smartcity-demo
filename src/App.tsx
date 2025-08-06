import { useEffect } from 'react';
import "./index.css";
import { ExecutiveKpis } from "./components/ExecutiveKpis";
import { LiveMap } from "./components/LiveMap";
import { AlertsFeed } from "./components/AlertsFeed";
import { EnergyPanel } from "./components/EnergyPanel";
import { TopologyView } from "./components/TopologyView";
import { IncidentDetail } from "./components/IncidentDetail";
import { useMockRealtime } from "./mock/useMockRealtime";
import { useDataStore, useUIStore } from "./store";

export default function App() {
  const { metrics, alerts, incidents, topology, newAlert, newIncident, isConnected } = useMockRealtime();
  const { updateMetrics, addAlert, addIncident, updateTopology, setConnectionStatus } = useDataStore();
  const { theme, addNotification } = useUIStore();

  // Update store with real-time data
  useEffect(() => {
    if (metrics) {
      updateMetrics(metrics);
    }
  }, [metrics, updateMetrics]);

  useEffect(() => {
    if (newAlert) {
      addAlert(newAlert);
      addNotification({
        type: newAlert.severity === 'critical' ? 'error' : 
              newAlert.severity === 'high' ? 'warning' : 'info',
        title: 'New Alert',
        message: newAlert.title
      });
    }
  }, [newAlert, addAlert, addNotification]);

  useEffect(() => {
    if (newIncident) {
      addIncident(newIncident);
      addNotification({
        type: 'error',
        title: 'New Incident',
        message: newIncident.summary
      });
    }
  }, [newIncident, addIncident, addNotification]);

  useEffect(() => {
    if (topology) {
      updateTopology(topology);
    }
  }, [topology, updateTopology]);

  useEffect(() => {
    setConnectionStatus(isConnected);
  }, [isConnected, setConnectionStatus]);

  return (
    <div className={`min-h-screen bg-primary text-primary ${theme}`}>
      <header className="nav-header">
        <div className="nav-brand">
          <span className="text-purple font-bold">TruContext</span>
          <span className="ml-2">Smart City Operations</span>
        </div>
        <div className="nav-meta">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-success' : 'bg-critical'
              }`}></div>
              <span className="text-xs">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <span className="text-xs text-muted">
              Visium Technologies • Baltimore Operations Center
            </span>
            <span className="text-xs text-muted">
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </header>
      
      <main className="p-4 grid grid-cols-12 gap-4">
        {/* Executive KPIs */}
        <section className="col-span-12">
          <ExecutiveKpis metrics={metrics} />
        </section>
        
        {/* Main Content Area */}
        <section className="col-span-8 row-span-2">
          <div className="card h-full">
            <div className="card-header">
              <h2 className="card-title">Live City Map</h2>
              <div className="flex items-center gap-2">
                <span className="status-indicator status-success">Active</span>
                <span className="text-xs text-muted">
                  {incidents.length} Active Incidents
                </span>
              </div>
            </div>
            <div className="card-content">
              <LiveMap incidents={incidents} />
            </div>
          </div>
        </section>
        
        {/* Alerts Feed */}
        <aside className="col-span-4 row-span-2">
          <div className="card h-full">
            <div className="card-header">
              <h2 className="card-title">Real-time Alerts</h2>
              <div className="flex items-center gap-2">
                <span className="status-indicator status-info">
                  {alerts.length} Active
                </span>
              </div>
            </div>
            <div className="card-content">
              <AlertsFeed alerts={alerts} />
            </div>
          </div>
        </aside>
        
        {/* Energy Panel */}
        <section className="col-span-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Energy Management</h2>
              <span className="status-indicator status-success">Optimal</span>
            </div>
            <div className="card-content">
              <EnergyPanel metrics={metrics} />
            </div>
          </div>
        </section>
        
        {/* Network Topology */}
        <section className="col-span-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Network Topology</h2>
              <span className="status-indicator status-success">
                {topology?.nodes.length || 0} Nodes
              </span>
            </div>
            <div className="card-content">
              <TopologyView topology={topology} />
            </div>
          </div>
        </section>
        
        {/* Incident Detail */}
        <section className="col-span-12">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Active Incidents</h2>
              <div className="flex items-center gap-2">
                <span className="status-indicator status-warning">
                  {incidents.filter(i => i.status !== 'resolved').length} Open
                </span>
                <button className="btn btn-ghost text-xs">
                  View All
                </button>
              </div>
            </div>
            <div className="card-content">
              {incidents.length > 0 ? (
                <IncidentDetail incident={incidents[0]} />
              ) : (
                <div className="text-center text-muted py-8">
                  <p>No active incidents</p>
                  <p className="text-xs mt-1">All systems operating normally</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

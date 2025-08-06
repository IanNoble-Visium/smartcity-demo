import { useEffect } from 'react';
import "./index.css";
import { ExecutiveKpis } from "./components/ExecutiveKpis";
import { LiveMap } from "./components/LiveMap";
import { AlertsFeed } from "./components/AlertsFeed";
import { EnergyPanel } from "./components/EnergyPanel";
import { TopologyView } from "./components/TopologyView";
import { IncidentDetail } from "./components/IncidentDetail";
import { Header } from "./components/Header";
import { AuthProvider, withAuth, ProtectedComponent } from "./components/AuthProvider";
import { useMockRealtime } from "./mock/useMockRealtime";
import { useDataStore, useUIStore } from "./store";

function Dashboard() {
  const { metrics, alerts, incidents, topology } = useMockRealtime();
  const { updateMetrics, addAlert, addIncident, updateTopology } = useDataStore();
  const { addNotification } = useUIStore();

  // Update global stores with real-time data
  useEffect(() => {
    if (metrics) updateMetrics(metrics);
  }, [metrics, updateMetrics]);

  useEffect(() => {
    alerts.forEach(alert => addAlert(alert));
  }, [alerts, addAlert]);

  useEffect(() => {
    incidents.forEach(incident => addIncident(incident));
  }, [incidents, addIncident]);

  useEffect(() => {
    if (topology) updateTopology(topology);
  }, [topology, updateTopology]);

  // Generate notifications for new alerts and incidents
  useEffect(() => {
    alerts.forEach(alert => {
      if (alert.severity === 'critical' || alert.severity === 'high') {
        addNotification({
          type: alert.severity === 'critical' ? 'error' : 'warning',
          title: `${alert.severity.toUpperCase()} Alert`,
          message: alert.title
        });
      }
    });
  }, [alerts, addNotification]);

  useEffect(() => {
    incidents.forEach(incident => {
      if (incident.severity === 'critical' || incident.severity === 'high') {
        addNotification({
          type: 'error',
          title: 'New Incident',
          message: incident.description
        });
      }
    });
  }, [incidents, addNotification]);

  return (
    <div className="min-h-screen bg-primary text-primary">
      <Header />
      
      {/* Main Dashboard Grid */}
      <main className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Executive KPIs - Available to all authenticated users */}
          <section className="col-span-12">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Executive Dashboard</h2>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-success">Live</span>
                  <span className="text-xs text-muted">Updated 2s ago</span>
                </div>
              </div>
              <div className="card-content">
                <ExecutiveKpis metrics={metrics} />
              </div>
            </div>
          </section>

          {/* Live Map - Requires read access */}
          <ProtectedComponent permission="read_all">
            <section className="col-span-12 lg:col-span-8">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Live City Map</h2>
                  <div className="flex items-center gap-2">
                    <span className="status-indicator status-success">Active</span>
                    <span className="text-xs text-muted">{incidents.length} Incidents</span>
                  </div>
                </div>
                <div className="card-content">
                  <LiveMap incidents={incidents} />
                </div>
              </div>
            </section>
          </ProtectedComponent>

          {/* Real-time Alerts - Available to most users */}
          <ProtectedComponent permission="read_all" fallback={
            <ProtectedComponent permission="read_public_safety">
              <section className="col-span-12 lg:col-span-4">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Public Safety Alerts</h2>
                    <div className="flex items-center gap-2">
                      <span className="status-indicator status-info">Limited View</span>
                    </div>
                  </div>
                  <div className="card-content">
                    <AlertsFeed alerts={alerts.filter(a => a.category === 'public_safety')} />
                  </div>
                </div>
              </section>
            </ProtectedComponent>
          }>
            <section className="col-span-12 lg:col-span-4">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Real-time Alerts</h2>
                  <div className="flex items-center gap-2">
                    <span className="status-indicator status-warning">
                      {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} Active
                    </span>
                    <button className="btn btn-ghost text-xs">
                      Filter
                    </button>
                  </div>
                </div>
                <div className="card-content">
                  <AlertsFeed alerts={alerts} />
                </div>
              </div>
            </section>
          </ProtectedComponent>

          {/* Energy Management - Requires full read access */}
          <ProtectedComponent permission="read_all">
            <section className="col-span-12 lg:col-span-6">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Energy Management</h2>
                  <span className="status-indicator status-success">
                    Grid Stable
                  </span>
                </div>
                <div className="card-content">
                  <EnergyPanel metrics={metrics} />
                </div>
              </div>
            </section>
          </ProtectedComponent>

          {/* Network Topology - Admin and Operator access */}
          <ProtectedComponent permission="read_all">
            <section className="col-span-12 lg:col-span-6">
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
          </ProtectedComponent>

          {/* Incident Detail - Available to users with incident permissions */}
          <ProtectedComponent permission="view_incidents">
            <section className="col-span-12">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Active Incidents</h2>
                  <div className="flex items-center gap-2">
                    <span className="status-indicator status-warning">
                      {incidents.filter(i => i.status !== 'resolved').length} Open
                    </span>
                    <ProtectedComponent permission="write_incidents">
                      <button className="btn btn-primary text-xs">
                        Create Incident
                      </button>
                    </ProtectedComponent>
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
          </ProtectedComponent>
        </div>
      </main>
    </div>
  );
}

// Wrap Dashboard with authentication
const AuthenticatedDashboard = withAuth(Dashboard);

function App() {
  return (
    <AuthProvider>
      <AuthenticatedDashboard />
    </AuthProvider>
  );
}

export default App;

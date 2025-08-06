import { useEffect, useState } from 'react';
import "./index.css";
import { ExecutiveKpis } from "./components/ExecutiveKpis";
import { EnhancedLiveMap } from "./components/EnhancedLiveMap";
import { AlertsFeed } from "./components/AlertsFeed";
import { EnergyPanel } from "./components/EnergyPanel";
import { TopologyView } from "./components/TopologyView";
import { IncidentDetail } from "./components/IncidentDetail";
import { Header } from "./components/Header";
import { AdvancedAnalytics } from "./components/AdvancedAnalytics";
import { AnomalyDetectionEngine } from "./components/AnomalyDetectionEngine";
import { GeospatialTrackingSystem } from "./components/GeospatialTrackingSystem";
import { ExternalSystemsIntegration } from "./components/ExternalSystemsIntegration";
import { AdvancedIncidentManagement } from "./components/AdvancedIncidentManagement";
import { ContextualVideoBackground } from "./components/VideoBackground";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider, withAuth, ProtectedComponent } from "./components/AuthProvider";
import { useMockRealtime } from "./mock/useMockRealtime";
import { useDataStore, useUIStore } from "./store";

function Dashboard() {
  const { metrics, alerts, incidents, topology } = useMockRealtime();
  const { updateMetrics, addAlert, addIncident, updateTopology } = useDataStore();
  const { addNotification } = useUIStore();
  const [activeView, setActiveView] = useState<'dashboard' | 'analytics' | 'anomaly' | 'geospatial' | 'systems' | 'incidents'>('dashboard');

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

  // Navigation Component
  const Navigation = () => (
    <div className="bg-secondary border-b border-secondary mb-6">
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        <button
          className={`btn text-xs whitespace-nowrap ${activeView === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveView('dashboard')}
        >
          Executive Dashboard
        </button>
        <button
          className={`btn text-xs whitespace-nowrap ${activeView === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveView('analytics')}
        >
          Advanced Analytics
        </button>
        <button
          className={`btn text-xs whitespace-nowrap ${activeView === 'anomaly' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveView('anomaly')}
        >
          AI/ML Detection
        </button>
        <button
          className={`btn text-xs whitespace-nowrap ${activeView === 'geospatial' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveView('geospatial')}
        >
          Geospatial Tracking
        </button>
        <button
          className={`btn text-xs whitespace-nowrap ${activeView === 'systems' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveView('systems')}
        >
          External Systems
        </button>
        <button
          className={`btn text-xs whitespace-nowrap ${activeView === 'incidents' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveView('incidents')}
        >
          Incident Management
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-primary text-primary relative">
      {/* Background Video for Executive Dashboard */}
      {activeView === 'dashboard' && (
        <ContextualVideoBackground
          context="executive"
          className="fixed inset-0 -z-10"
          overlayOpacity={0.9}
        />
      )}
      
      <Header />
      <Navigation />
      
      {/* Main Content */}
      <main className="p-6 relative z-10">
        {activeView === 'dashboard' && (
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
                  <EnhancedLiveMap incidents={incidents} />
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
        )}
        
        {activeView === 'analytics' && (
          <AdvancedAnalytics />
        )}
        
        {activeView === 'anomaly' && (
          <AnomalyDetectionEngine />
        )}
        
        {activeView === 'geospatial' && (
          <GeospatialTrackingSystem />
        )}
        
        {activeView === 'systems' && (
          <ExternalSystemsIntegration />
        )}
        
        {activeView === 'incidents' && (
          <AdvancedIncidentManagement />
        )}
      </main>
    </div>
  );
}

// Wrap Dashboard with authentication
const AuthenticatedDashboard = withAuth(Dashboard);

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Application Error:', error, errorInfo);
        // Here you could send error reports to a logging service
      }}
    >
      <AuthProvider>
        <AuthenticatedDashboard />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

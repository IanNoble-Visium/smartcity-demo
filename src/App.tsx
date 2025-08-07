import { useEffect, useState } from 'react';
import "./index.css";
import { Header } from "./components/Header";
import { AdvancedAnalytics } from "./components/AdvancedAnalytics";
import { AnomalyDetectionEngine } from "./components/AnomalyDetectionEngine";
import { GeospatialTrackingSystem } from "./components/GeospatialTrackingSystem";
import { ExternalSystemsIntegration } from "./components/ExternalSystemsIntegration";
import { AdvancedIncidentManagement } from "./components/AdvancedIncidentManagement";
import { OptimizedExecutiveDashboard } from "./components/OptimizedExecutiveDashboard";
import { ContextualVideoBackground } from "./components/VideoBackground";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider, withAuth } from "./components/AuthProvider";
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
      <main className="relative z-10">
        {activeView === 'dashboard' && (
          <OptimizedExecutiveDashboard
            metrics={metrics}
            alerts={alerts}
            incidents={incidents}
            topology={topology}
          />
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

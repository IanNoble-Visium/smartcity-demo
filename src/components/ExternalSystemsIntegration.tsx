import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useDataStore, useUIStore } from '../store';
import { ContextualVideoBackground } from './VideoBackground';

interface ExternalSystemsIntegrationProps {
  className?: string;
}

interface ExternalSystem {
  id: string;
  name: string;
  type: 'erp' | 'scada' | 'cad_rms' | 'gis' | 'iot' | 'legacy' | 'api' | 'database';
  status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  lastSync: string;
  dataPoints: number;
  latency: number;
  uptime: number;
  version: string;
  endpoint: string;
  authentication: 'oauth2' | 'api_key' | 'basic' | 'certificate';
  dataFlow: 'bidirectional' | 'inbound' | 'outbound';
  criticality: 'high' | 'medium' | 'low';
}

interface DataStream {
  id: string;
  systemId: string;
  name: string;
  type: 'real_time' | 'batch' | 'event_driven';
  status: 'active' | 'paused' | 'error';
  recordsPerMinute: number;
  lastRecord: string;
  errorRate: number;
  schema: string;
}

interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  successRate: number;
  requestsPerMinute: number;
  lastCall: string;
}

export function ExternalSystemsIntegration({ className = '' }: ExternalSystemsIntegrationProps) {
  const { addNotification } = useUIStore();
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'systems' | 'streams' | 'apis'>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock external systems
  const externalSystems = useMemo((): ExternalSystem[] => [
    {
      id: 'sys-001',
      name: 'Baltimore City ERP',
      type: 'erp',
      status: 'connected',
      lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      dataPoints: 15420,
      latency: 45,
      uptime: 99.8,
      version: '2.1.4',
      endpoint: 'https://erp.baltimorecity.gov/api/v2',
      authentication: 'oauth2',
      dataFlow: 'bidirectional',
      criticality: 'high'
    },
    {
      id: 'sys-002',
      name: 'Traffic Control SCADA',
      type: 'scada',
      status: 'connected',
      lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      dataPoints: 8750,
      latency: 12,
      uptime: 99.9,
      version: '3.2.1',
      endpoint: 'scada://traffic.control.local:502',
      authentication: 'certificate',
      dataFlow: 'bidirectional',
      criticality: 'high'
    },
    {
      id: 'sys-003',
      name: 'Emergency CAD/RMS',
      type: 'cad_rms',
      status: 'connected',
      lastSync: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      dataPoints: 2340,
      latency: 8,
      uptime: 99.95,
      version: '4.1.2',
      endpoint: 'https://cad.baltimore911.gov/api',
      authentication: 'api_key',
      dataFlow: 'inbound',
      criticality: 'high'
    },
    {
      id: 'sys-004',
      name: 'GIS Data Platform',
      type: 'gis',
      status: 'connected',
      lastSync: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      dataPoints: 45600,
      latency: 120,
      uptime: 98.5,
      version: '1.8.3',
      endpoint: 'https://gis.baltimorecity.gov/arcgis/rest',
      authentication: 'oauth2',
      dataFlow: 'inbound',
      criticality: 'medium'
    },
    {
      id: 'sys-005',
      name: 'IoT Sensor Network',
      type: 'iot',
      status: 'error',
      lastSync: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      dataPoints: 125000,
      latency: 200,
      uptime: 95.2,
      version: '2.0.1',
      endpoint: 'mqtt://iot.sensors.local:1883',
      authentication: 'certificate',
      dataFlow: 'inbound',
      criticality: 'medium'
    },
    {
      id: 'sys-006',
      name: 'Legacy Mainframe',
      type: 'legacy',
      status: 'maintenance',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      dataPoints: 890,
      latency: 500,
      uptime: 92.1,
      version: 'COBOL-85',
      endpoint: 'tn3270://mainframe.city.local:23',
      authentication: 'basic',
      dataFlow: 'outbound',
      criticality: 'low'
    }
  ], []);

  // Mock data streams
  const dataStreams = useMemo((): DataStream[] => [
    {
      id: 'stream-001',
      systemId: 'sys-002',
      name: 'Traffic Signal Status',
      type: 'real_time',
      status: 'active',
      recordsPerMinute: 450,
      lastRecord: new Date(Date.now() - 30 * 1000).toISOString(),
      errorRate: 0.2,
      schema: 'traffic_signal_v2.json'
    },
    {
      id: 'stream-002',
      systemId: 'sys-003',
      name: 'Emergency Incidents',
      type: 'event_driven',
      status: 'active',
      recordsPerMinute: 12,
      lastRecord: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      errorRate: 0.1,
      schema: 'incident_v1.json'
    },
    {
      id: 'stream-003',
      systemId: 'sys-005',
      name: 'Environmental Sensors',
      type: 'real_time',
      status: 'error',
      recordsPerMinute: 0,
      lastRecord: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      errorRate: 15.3,
      schema: 'sensor_data_v3.json'
    }
  ], []);

  // Mock API endpoints
  const apiEndpoints = useMemo((): APIEndpoint[] => [
    {
      id: 'api-001',
      name: 'City Data API',
      method: 'GET',
      url: '/api/v1/city/data',
      status: 'healthy',
      responseTime: 85,
      successRate: 99.7,
      requestsPerMinute: 245,
      lastCall: new Date(Date.now() - 10 * 1000).toISOString()
    },
    {
      id: 'api-002',
      name: 'Incident Reporting',
      method: 'POST',
      url: '/api/v1/incidents',
      status: 'healthy',
      responseTime: 120,
      successRate: 98.9,
      requestsPerMinute: 15,
      lastCall: new Date(Date.now() - 2 * 60 * 1000).toISOString()
    },
    {
      id: 'api-003',
      name: 'Asset Management',
      method: 'PUT',
      url: '/api/v1/assets/{id}',
      status: 'degraded',
      responseTime: 450,
      successRate: 94.2,
      requestsPerMinute: 78,
      lastCall: new Date(Date.now() - 30 * 1000).toISOString()
    }
  ], []);

  // Filter systems based on status
  const filteredSystems = useMemo(() => {
    if (filterStatus === 'all') return externalSystems;
    return externalSystems.filter(system => system.status === filterStatus);
  }, [externalSystems, filterStatus]);

  // System Overview Component
  const SystemOverview = () => {
    const statusCounts = externalSystems.reduce((acc, system) => {
      acc[system.status] = (acc[system.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      fill: status === 'connected' ? '#10b981' :
            status === 'error' ? '#ef4444' :
            status === 'maintenance' ? '#f59e0b' : '#6b7280'
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">System Status Overview</h3>
            <span className="text-xs text-muted">{externalSystems.length} total systems</span>
          </div>
          
          <div className="card-content">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Integration Health Metrics</h3>
          </div>
          
          <div className="card-content">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary rounded-lg">
                <div className="text-sm text-muted">Avg Uptime</div>
                <div className="text-2xl font-bold text-success">
                  {(externalSystems.reduce((sum, sys) => sum + sys.uptime, 0) / externalSystems.length).toFixed(1)}%
                </div>
              </div>
              
              <div className="p-3 bg-secondary rounded-lg">
                <div className="text-sm text-muted">Avg Latency</div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(externalSystems.reduce((sum, sys) => sum + sys.latency, 0) / externalSystems.length)}ms
                </div>
              </div>
              
              <div className="p-3 bg-secondary rounded-lg">
                <div className="text-sm text-muted">Total Data Points</div>
                <div className="text-2xl font-bold text-info">
                  {(externalSystems.reduce((sum, sys) => sum + sys.dataPoints, 0) / 1000).toFixed(0)}K
                </div>
              </div>
              
              <div className="p-3 bg-secondary rounded-lg">
                <div className="text-sm text-muted">Active Streams</div>
                <div className="text-2xl font-bold text-warning">
                  {dataStreams.filter(s => s.status === 'active').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Systems List Component
  const SystemsList = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">External Systems</h3>
        <div className="flex items-center gap-2">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="btn btn-ghost text-xs"
          >
            <option value="all">All Status</option>
            <option value="connected">Connected</option>
            <option value="error">Error</option>
            <option value="maintenance">Maintenance</option>
            <option value="disconnected">Disconnected</option>
          </select>
        </div>
      </div>
      
      <div className="card-content">
        <div className="space-y-3">
          {filteredSystems.map((system) => (
            <motion.div
              key={system.id}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedSystem === system.id ? 'bg-primary/20 border border-primary' : 'bg-secondary hover:bg-secondary/80'
              }`}
              onClick={() => setSelectedSystem(system.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${
                    system.status === 'connected' ? 'bg-success' :
                    system.status === 'error' ? 'bg-error' :
                    system.status === 'maintenance' ? 'bg-warning' : 'bg-muted'
                  }`} />
                  <div>
                    <h4 className="font-medium">{system.name}</h4>
                    <p className="text-xs text-muted capitalize">{system.type.replace('_', ' ')}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`status-indicator ${
                    system.criticality === 'high' ? 'status-error' :
                    system.criticality === 'medium' ? 'status-warning' : 'status-info'
                  }`}>
                    {system.criticality} priority
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-muted">Uptime:</span>
                  <span className="ml-2 font-medium">{system.uptime}%</span>
                </div>
                <div>
                  <span className="text-muted">Latency:</span>
                  <span className="ml-2 font-medium">{system.latency}ms</span>
                </div>
                <div>
                  <span className="text-muted">Data Points:</span>
                  <span className="ml-2 font-medium">{(system.dataPoints / 1000).toFixed(1)}K</span>
                </div>
                <div>
                  <span className="text-muted">Last Sync:</span>
                  <span className="ml-2 font-medium">
                    {new Date(system.lastSync).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-secondary/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Endpoint: {system.endpoint}</span>
                  <span className="px-2 py-1 bg-primary/20 text-primary rounded">
                    {system.authentication}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // Data Streams Component
  const DataStreamsList = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Active Data Streams</h3>
        <span className="text-xs text-muted">{dataStreams.length} streams configured</span>
      </div>
      
      <div className="card-content">
        <div className="space-y-3">
          {dataStreams.map((stream) => (
            <div key={stream.id} className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    stream.status === 'active' ? 'bg-success' :
                    stream.status === 'error' ? 'bg-error' : 'bg-warning'
                  }`} />
                  <span className="font-medium">{stream.name}</span>
                </div>
                <span className="text-xs text-muted capitalize">{stream.type.replace('_', ' ')}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted">Records/min:</span>
                  <span className="ml-2 font-medium">{stream.recordsPerMinute}</span>
                </div>
                <div>
                  <span className="text-muted">Error Rate:</span>
                  <span className={`ml-2 font-medium ${
                    stream.errorRate > 5 ? 'text-error' : 'text-success'
                  }`}>
                    {stream.errorRate}%
                  </span>
                </div>
                <div>
                  <span className="text-muted">Schema:</span>
                  <span className="ml-2 font-medium">{stream.schema}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // API Endpoints Component
  const APIEndpointsList = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">API Endpoints</h3>
        <span className="text-xs text-muted">{apiEndpoints.length} endpoints monitored</span>
      </div>
      
      <div className="card-content">
        <div className="space-y-3">
          {apiEndpoints.map((endpoint) => (
            <div key={endpoint.id} className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                    endpoint.method === 'GET' ? 'bg-success/20 text-success' :
                    endpoint.method === 'POST' ? 'bg-info/20 text-info' :
                    endpoint.method === 'PUT' ? 'bg-warning/20 text-warning' : 'bg-error/20 text-error'
                  }`}>
                    {endpoint.method}
                  </span>
                  <span className="font-medium">{endpoint.name}</span>
                </div>
                <span className={`status-indicator ${
                  endpoint.status === 'healthy' ? 'status-success' :
                  endpoint.status === 'degraded' ? 'status-warning' : 'status-error'
                }`}>
                  {endpoint.status}
                </span>
              </div>
              
              <div className="text-xs text-muted mb-2">{endpoint.url}</div>
              
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted">Response Time:</span>
                  <span className="ml-2 font-medium">{endpoint.responseTime}ms</span>
                </div>
                <div>
                  <span className="text-muted">Success Rate:</span>
                  <span className="ml-2 font-medium text-success">{endpoint.successRate}%</span>
                </div>
                <div>
                  <span className="text-muted">Requests/min:</span>
                  <span className="ml-2 font-medium">{endpoint.requestsPerMinute}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`external-systems-integration ${className}`}>
      {/* Video Background */}
      <ContextualVideoBackground 
        context="network"
        className="absolute inset-0 -z-10"
        overlayOpacity={0.85}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">External City Systems Integration</h2>
          <p className="text-muted">Real-time connectivity with municipal databases, IoT networks, and legacy systems</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost text-xs">
            Sync All Systems
          </button>
          <button className="btn btn-primary text-xs">
            Add Integration
          </button>
        </div>
      </div>

      {/* View Mode Navigation */}
      <div className="relative z-10 bg-secondary border border-secondary rounded-lg p-1 mb-6 inline-flex">
        {(['overview', 'systems', 'streams', 'apis'] as const).map((mode) => (
          <button
            key={mode}
            className={`px-4 py-2 text-xs rounded transition-all ${
              viewMode === mode ? 'bg-primary text-white' : 'text-muted hover:text-primary'
            }`}
            onClick={() => setViewMode(mode)}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Content based on view mode */}
      <div className="relative z-10">
        {viewMode === 'overview' && <SystemOverview />}
        {viewMode === 'systems' && <SystemsList />}
        {viewMode === 'streams' && <DataStreamsList />}
        {viewMode === 'apis' && <APIEndpointsList />}
      </div>
    </div>
  );
}
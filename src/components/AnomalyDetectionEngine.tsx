import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
// import { useDataStore } from '../store';
import { ContextualVideoBackground } from './VideoBackground';
import { ChartErrorBoundary } from './ErrorBoundary';

interface AnomalyDetectionEngineProps {
  className?: string;
}

interface Anomaly {
  id: string;
  timestamp: string;
  type: 'statistical' | 'pattern' | 'behavioral' | 'predictive';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  confidence: number;
  description: string;
  mitreAttack?: string[];
  recommendations: string[];
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

interface MLModel {
  id: string;
  name: string;
  type: 'isolation_forest' | 'lstm' | 'autoencoder' | 'svm' | 'ensemble';
  status: 'training' | 'ready' | 'updating' | 'error';
  accuracy: number;
  lastTrained: string;
  features: string[];
  anomaliesDetected: number;
}

export function AnomalyDetectionEngine({ className = '' }: AnomalyDetectionEngineProps) {
  // Avoid subscribing to global metrics to prevent periodic re-renders
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('ml.selectedModel') || 'ensemble');
  const [timeWindow, setTimeWindow] = useState<'1h' | '4h' | '24h' | '7d'>(() => (localStorage.getItem('ml.timeWindow') as any) || '24h');
  const [severityFilter, setSeverityFilter] = useState<string>(() => localStorage.getItem('ml.severity') || 'all');
  const [isAnomalyListExpanded, setIsAnomalyListExpanded] = useState<boolean>(() => JSON.parse(localStorage.getItem('ml.listExpanded') || 'true'));
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [modelCategory, setModelCategory] = useState<'all' | 'predictive' | 'statistical' | 'network'>(() => (localStorage.getItem('ml.modelCategory') as any) || 'all');

  // Persist key states
  const persist = (key: string, value: any) => localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));

  // Mock ML Models
  const mlModels = useMemo((): MLModel[] => [
    {
      id: 'ensemble',
      name: 'Ensemble Anomaly Detector',
      type: 'ensemble',
      status: 'ready',
      accuracy: 94.2,
      lastTrained: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      features: ['energy_consumption', 'traffic_flow', 'network_latency', 'security_events'],
      anomaliesDetected: 23
    },
    {
      id: 'lstm',
      name: 'LSTM Time Series Predictor',
      type: 'lstm',
      status: 'ready',
      accuracy: 91.8,
      lastTrained: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      features: ['temporal_patterns', 'seasonal_trends', 'cyclical_behavior'],
      anomaliesDetected: 15
    },
    {
      id: 'isolation_forest',
      name: 'Isolation Forest Detector',
      type: 'isolation_forest',
      status: 'ready',
      accuracy: 89.5,
      lastTrained: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      features: ['multivariate_outliers', 'feature_interactions'],
      anomaliesDetected: 18
    },
    {
      id: 'autoencoder',
      name: 'Deep Autoencoder',
      type: 'autoencoder',
      status: 'training',
      accuracy: 87.3,
      lastTrained: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      features: ['reconstruction_error', 'latent_space_analysis'],
      anomaliesDetected: 12
    }
  ], []);

  const categorizedModels = useMemo(() => {
    const categories: Record<string, MLModel[]> = {
      predictive: mlModels.filter(m => ['lstm', 'autoencoder'].includes(m.type)),
      statistical: mlModels.filter(m => ['isolation_forest', 'svm', 'ensemble'].includes(m.type)),
      network: mlModels.filter(m => ['ensemble', 'isolation_forest'].includes(m.type)),
      all: mlModels
    };
    return categories as Record<'predictive' | 'statistical' | 'network' | 'all', MLModel[]>;
  }, [mlModels]);

  // Generate mock anomalies - static to prevent unnecessary re-renders
  const detectedAnomalies = useMemo((): Anomaly[] => {
    const anomalies: Anomaly[] = [
      {
        id: 'anom-001',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        type: 'statistical',
        severity: 'high',
        metric: 'Traffic Flow',
        value: 0.21,
        expectedValue: 0.70,
        deviation: 70,
        confidence: 96.5,
        description: 'Significant drop in traffic flow detected on I-95 corridor',
        mitreAttack: ['T1565.001', 'T1498'],
        recommendations: [
          'Investigate traffic control systems',
          'Check for potential cyber interference',
          'Verify sensor integrity'
        ],
        status: 'investigating'
      },
      {
        id: 'anom-002',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        type: 'behavioral',
        severity: 'medium',
        metric: 'Energy Consumption',
        value: 105.6,
        expectedValue: 75.4,
        deviation: 40,
        confidence: 89.2,
        description: 'Unusual energy consumption pattern in downtown district',
        recommendations: [
          'Review HVAC system operations',
          'Check for unauthorized energy usage',
          'Analyze building automation systems'
        ],
        status: 'new'
      },
      {
        id: 'anom-003',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'pattern',
        severity: 'critical',
        metric: 'Network Latency',
        value: 160.8,
        expectedValue: 50.2,
        deviation: 220,
        confidence: 98.7,
        description: 'Severe network latency spike across multiple nodes',
        mitreAttack: ['T1499', 'T1498.001'],
        recommendations: [
          'Immediate network traffic analysis',
          'Check for DDoS attack indicators',
          'Isolate affected network segments'
        ],
        status: 'new'
      },
      {
        id: 'anom-004',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        type: 'predictive',
        severity: 'low',
        metric: 'Air Quality',
        value: 57.5,
        expectedValue: 50.0,
        deviation: 15,
        confidence: 76.3,
        description: 'Predicted air quality degradation based on weather patterns',
        recommendations: [
          'Monitor industrial emissions',
          'Prepare air quality alerts',
          'Review traffic management strategies'
        ],
        status: 'resolved'
      }
    ];

    return anomalies;
  }, []); // Remove metrics dependency to prevent re-renders

  // Filter anomalies based on severity
  const filteredAnomalies = useMemo(() => {
    if (severityFilter === 'all') return detectedAnomalies;
    return detectedAnomalies.filter(anomaly => anomaly.severity === severityFilter);
  }, [detectedAnomalies, severityFilter]);

  // Generate time series data with anomalies
  const timeSeriesData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseValue = 50 + Math.sin(i * 0.5) * 20;
      const noise = (Math.random() - 0.5) * 10;
      const normalValue = Math.max(0, baseValue + noise);
      
      // Add anomalies at specific points
      let anomalyValue = null;
      if (i === 15 || i === 8 || i === 3) {
        anomalyValue = Math.max(0, baseValue + (Math.random() > 0.5 ? 40 : -30));
      }
      
      data.push({
        time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        value: normalValue,
        anomaly: anomalyValue
      });
    }
    
    return data;
  }, [timeWindow]);

  // Model Performance Component
  const ModelPerformance = () => (
    <div className="card h-full flex flex-col">
      <div className="card-header flex-shrink-0 p-2">
        <h3 className="card-title text-xs">ML Model Performance</h3>
        <div className="flex items-center gap-1">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="btn btn-ghost text-xs px-1 py-0.5"
          >
            {mlModels.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-content flex-1 min-h-0 p-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-1">
          {mlModels.map((model) => (
            <div
              key={model.id}
              className={`p-1.5 rounded cursor-pointer transition-all text-xs ${
                selectedModel === model.id ? 'bg-primary/20 border border-primary' : 'bg-secondary'
              }`}
              onClick={() => setSelectedModel(model.id)}
            >
              <div className="flex items-center justify-between mb-0.5">
                <div className="font-medium truncate flex-1 mr-1 text-xs">{model.name}</div>
                <span className={`status-indicator text-xs px-1 py-0.5 ${
                  model.status === 'ready' ? 'status-success' :
                  model.status === 'training' ? 'status-warning' : 'status-error'
                }`}>
                  {model.status}
                </span>
              </div>
              <div className="text-xs text-muted mb-0.5">{model.type.replace('_', ' ').toUpperCase()}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">{model.accuracy}%</span>
                <span className="text-xs text-muted">
                  {model.anomaliesDetected} anomalies
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Anomaly Timeline Chart
  const AnomalyTimeline = () => (
    <div className="card h-full flex flex-col">
      <div className="card-header flex-shrink-0 p-2">
        <h3 className="card-title text-xs">Real-time Anomaly Detection</h3>
        <div className="flex items-center gap-1">
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value as typeof timeWindow)}
            className="btn btn-ghost text-xs px-1 py-0.5"
          >
            <option value="1h">Last Hour</option>
            <option value="4h">Last 4 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <span className="status-indicator status-success text-xs px-1 py-0.5">Live</span>
        </div>
      </div>

      <div className="card-content flex-1 min-h-0 p-1">
        <ChartErrorBoundary>
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={200}
            minHeight={150}
          >
            <ComposedChart data={timeSeriesData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9ca3af"
                fontSize={9}
                tick={{ fontSize: 9 }}
                height={20}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={9}
                tick={{ fontSize: 9 }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                  fontSize: '10px',
                  padding: '4px 6px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '9px' }} />

              {/* Normal values */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={1.5}
                name="Metric Value"
                dot={false}
              />

              {/* Anomalies */}
              <Line
                type="monotone"
                dataKey="anomaly"
                stroke="#ef4444"
                strokeWidth={2}
                name="Detected Anomalies"
                dot={{ fill: '#ef4444', strokeWidth: 1, r: 3 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      </div>
    </div>
  );

  // Anomaly List Component
  const AnomalyList = () => (
    <div className="card h-full flex flex-col">
      <div
        className="card-header cursor-pointer p-2 flex-shrink-0"
        onClick={() => setIsAnomalyListExpanded(!isAnomalyListExpanded)}
      >
        <h3 className="card-title text-xs flex items-center gap-1">
          Detected Anomalies
          <span className="text-xs">{isAnomalyListExpanded ? '▼' : '▶'}</span>
        </h3>
        <div className="flex items-center gap-1">
          <select
            value={severityFilter}
            onChange={(e) => { e.stopPropagation(); setSeverityFilter(e.target.value); }}
            className="btn btn-ghost text-xs px-1 py-0.5"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <span className="text-xs text-muted">{filteredAnomalies.length} anomalies</span>
        </div>
      </div>

      {isAnomalyListExpanded && (
        <div className="card-content p-1 flex-1 min-h-0">
          <div className="space-y-1 h-full overflow-y-auto">
          {filteredAnomalies.map((anomaly) => (
            <motion.div
              key={anomaly.id}
              className="p-1.5 bg-secondary rounded border-l-2 border-l-primary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-medium text-primary truncate">{anomaly.metric}</h4>
                  <p className="text-xs text-muted truncate">{anomaly.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                  <span className={`status-indicator text-xs px-1 py-0.5 ${
                    anomaly.severity === 'critical' ? 'status-error' :
                    anomaly.severity === 'high' ? 'status-warning' :
                    anomaly.severity === 'medium' ? 'status-info' : 'status-success'
                  }`}>
                    {anomaly.severity}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(anomaly.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 mb-1 text-xs">
                <div>
                  <span className="text-muted">Det:</span>
                  <span className="ml-1 font-medium">{anomaly.value.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-muted">Exp:</span>
                  <span className="ml-1 font-medium">{anomaly.expectedValue.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-muted">Dev:</span>
                  <span className="ml-1 font-medium text-warning">{anomaly.deviation}%</span>
                </div>
                <div>
                  <span className="text-muted">Conf:</span>
                  <span className="ml-1 font-medium text-success">{anomaly.confidence}%</span>
                </div>
              </div>

              {anomaly.mitreAttack && (
                <div className="mb-1">
                  <span className="text-xs text-muted">MITRE:</span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap">
                    {anomaly.mitreAttack.map(tactic => (
                      <span key={tactic} className="px-1 py-0.5 bg-primary/20 text-primary text-xs rounded">
                        {tactic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className={`status-indicator text-xs px-1 py-0.5 ${
                  anomaly.status === 'new' ? 'status-warning' :
                  anomaly.status === 'investigating' ? 'status-info' :
                  anomaly.status === 'resolved' ? 'status-success' : 'status-error'
                }`}>
                  {anomaly.status.replace('_', ' ')}
                </span>
                <div className="flex gap-0.5">
                  <button className="btn btn-ghost text-xs px-1 py-0.5">Investigate</button>
                  <button className="btn btn-ghost text-xs px-1 py-0.5">Resolve</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      )}
    </div>
  );

  return (
    <div className={`relative h-full min-h-0 overflow-hidden flex flex-col ${className}`}>
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 opacity-60" />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-primary leading-tight truncate">AI/ML Anomaly Detection Engine</h2>
          <p className="text-xs text-muted leading-tight truncate">Advanced machine learning for real-time anomaly detection and threat analysis</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button className="btn btn-ghost text-xs px-1 py-0.5">Retrain</button>
          <button className="btn btn-primary text-xs px-1 py-0.5">Export</button>
        </div>
      </div>

      {/* Content Grid: 12x12 no-scroll layout */}
      <div className="flex-1 min-h-0 px-3 pb-2">
        <div className="h-full min-h-0 grid grid-cols-12 grid-rows-12 gap-2">
          {/* Model Performance */}
          <div className="col-span-12 md:col-span-4 row-span-8 min-h-0">
            <ModelPerformance />
          </div>
          {/* Anomaly Timeline */}
          <div className="col-span-12 md:col-span-8 row-span-8 min-h-0">
            <AnomalyTimeline />
          </div>
          {/* Anomaly List */}
          <div className="col-span-12 row-span-4 min-h-0">
            <AnomalyList />
          </div>
        </div>
      </div>
    </div>
  );
}
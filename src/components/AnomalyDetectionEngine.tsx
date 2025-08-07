import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useDataStore } from '../store';
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
  const { metrics } = useDataStore();
  const [selectedModel, setSelectedModel] = useState<string>('ensemble');
  const [timeWindow, setTimeWindow] = useState<'1h' | '4h' | '24h' | '7d'>('24h');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

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

  // Generate mock anomalies
  const detectedAnomalies = useMemo((): Anomaly[] => {
    if (!metrics) return [];

    const anomalies: Anomaly[] = [
      {
        id: 'anom-001',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        type: 'statistical',
        severity: 'high',
        metric: 'Traffic Flow',
        value: metrics.trafficFlow * 0.3,
        expectedValue: metrics.trafficFlow,
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
        value: metrics.energyConsumption * 1.4,
        expectedValue: metrics.energyConsumption,
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
        value: metrics.networkLatency * 3.2,
        expectedValue: metrics.networkLatency,
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
        value: metrics.airQuality * 1.15,
        expectedValue: metrics.airQuality,
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
  }, [metrics]);

  // Filter anomalies based on severity
  const filteredAnomalies = useMemo(() => {
    if (severityFilter === 'all') return detectedAnomalies;
    return detectedAnomalies.filter(anomaly => anomaly.severity === severityFilter);
  }, [detectedAnomalies, severityFilter]);

  // Generate time series data with anomalies
  const generateAnomalyTimeSeriesData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseValue = 50 + Math.sin(i * 0.5) * 20;
      const noise = (Math.random() - 0.5) * 10;
      
      // Add anomalies at specific points
      let isAnomaly = false;
      let anomalyValue = baseValue + noise;
      
      if (i === 15 || i === 8 || i === 3) {
        isAnomaly = true;
        anomalyValue = baseValue + (Math.random() > 0.5 ? 40 : -30);
      }
      
      data.push({
        time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        value: baseValue + noise,
        anomaly: isAnomaly ? anomalyValue : null,
        upperBound: baseValue + 25,
        lowerBound: baseValue - 25
      });
    }
    
    return data;
  };

  const timeSeriesData = generateAnomalyTimeSeriesData();

  // Model Performance Component
  const ModelPerformance = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">ML Model Performance</h3>
        <div className="flex items-center gap-2">
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="btn btn-ghost text-xs"
          >
            {mlModels.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="card-content">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {mlModels.map((model) => (
            <div 
              key={model.id} 
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedModel === model.id ? 'bg-primary/20 border border-primary' : 'bg-secondary'
              }`}
              onClick={() => setSelectedModel(model.id)}
            >
              <div className="text-sm font-medium">{model.name}</div>
              <div className="text-xs text-muted mb-2">{model.type.replace('_', ' ').toUpperCase()}</div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">{model.accuracy}%</span>
                <span className={`status-indicator ${
                  model.status === 'ready' ? 'status-success' : 
                  model.status === 'training' ? 'status-warning' : 'status-error'
                }`}>
                  {model.status}
                </span>
              </div>
              <div className="text-xs text-muted mt-1">
                {model.anomaliesDetected} anomalies detected
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Anomaly Timeline Chart
  const AnomalyTimeline = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Real-time Anomaly Detection</h3>
        <div className="flex items-center gap-2">
          <select 
            value={timeWindow} 
            onChange={(e) => setTimeWindow(e.target.value as typeof timeWindow)}
            className="btn btn-ghost text-xs"
          >
            <option value="1h">Last Hour</option>
            <option value="4h">Last 4 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <span className="status-indicator status-success">Live</span>
        </div>
      </div>
      
      <div className="card-content" style={{ minHeight: '400px' }}>
        <ChartErrorBoundary>
          <ResponsiveContainer
            width="100%"
            height={400}
            minWidth={300}
            minHeight={400}
          >
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#e5e7eb'
                }}
              />
              <Legend />
              
              {/* Normal data range */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stackId="1"
                stroke="none"
                fill="#10b981"
                fillOpacity={0.1}
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stackId="1"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
              />
              
              {/* Normal values */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Metric Value"
                dot={false}
              />
              
              {/* Anomalies */}
              <Line
                type="monotone"
                dataKey="anomaly"
                stroke="#ef4444"
                strokeWidth={3}
                name="Detected Anomalies"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      </div>
    </div>
  );

  // Anomaly List Component
  const AnomalyList = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Detected Anomalies</h3>
        <div className="flex items-center gap-2">
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="btn btn-ghost text-xs"
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
      
      <div className="card-content">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAnomalies.map((anomaly) => (
            <motion.div
              key={anomaly.id}
              className="p-4 bg-secondary rounded-lg border-l-4 border-l-primary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-primary">{anomaly.metric}</h4>
                  <p className="text-sm text-muted">{anomaly.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`status-indicator ${
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
              
              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div>
                  <span className="text-muted">Detected Value:</span>
                  <span className="ml-2 font-medium">{anomaly.value.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted">Expected Value:</span>
                  <span className="ml-2 font-medium">{anomaly.expectedValue.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted">Deviation:</span>
                  <span className="ml-2 font-medium text-warning">{anomaly.deviation}%</span>
                </div>
                <div>
                  <span className="text-muted">Confidence:</span>
                  <span className="ml-2 font-medium text-success">{anomaly.confidence}%</span>
                </div>
              </div>
              
              {anomaly.mitreAttack && (
                <div className="mb-3">
                  <span className="text-xs text-muted">MITRE ATT&CK:</span>
                  <div className="flex gap-1 mt-1">
                    {anomaly.mitreAttack.map(tactic => (
                      <span key={tactic} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                        {tactic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-3">
                <span className="text-xs text-muted">Recommendations:</span>
                <ul className="mt-1 text-xs space-y-1">
                  {anomaly.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`status-indicator ${
                  anomaly.status === 'new' ? 'status-warning' :
                  anomaly.status === 'investigating' ? 'status-info' :
                  anomaly.status === 'resolved' ? 'status-success' : 'status-error'
                }`}>
                  {anomaly.status.replace('_', ' ')}
                </span>
                <div className="flex gap-2">
                  <button className="btn btn-ghost text-xs">Investigate</button>
                  <button className="btn btn-ghost text-xs">Mark Resolved</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`anomaly-detection-engine ${className}`}>
      {/* Video Background */}
      <ContextualVideoBackground
        context="cybersecurity"
        className="absolute inset-0 -z-10"
        overlayOpacity={0.6}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">AI/ML Anomaly Detection Engine</h2>
          <p className="text-muted">Advanced machine learning for real-time anomaly detection and threat analysis</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost text-xs">
            Retrain Models
          </button>
          <button className="btn btn-primary text-xs">
            Export Report
          </button>
        </div>
      </div>

      {/* Model Performance */}
      <div className="relative z-10 mb-6">
        <ModelPerformance />
      </div>

      {/* Anomaly Timeline */}
      <div className="relative z-10 mb-6">
        <AnomalyTimeline />
      </div>

      {/* Anomaly List */}
      <div className="relative z-10">
        <AnomalyList />
      </div>
    </div>
  );
}
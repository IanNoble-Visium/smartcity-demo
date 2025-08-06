import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';
import { useDataStore, useUIStore } from '../store';
import type {
  AnalyticsMetric,
  ChartConfig,
  TimeRange,
  KPIDefinition,
  PredictiveModel
} from '../types/analytics';

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const { metrics, alerts, incidents } = useDataStore();
  const { addNotification } = useUIStore();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange['preset']>('24h');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [drillDownLevel, setDrillDownLevel] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Generate analytics metrics from current data
  const analyticsMetrics = useMemo((): AnalyticsMetric[] => {
    if (!metrics) return [];

    const baseMetrics = [
      {
        id: 'energy-efficiency',
        name: 'Energy Efficiency',
        value: metrics.energyConsumption,
        previousValue: metrics.energyConsumption * 0.95,
        unit: 'MW',
        category: 'performance' as const,
        trend: 'up' as const,
        changePercent: 5.2,
        threshold: { warning: 65, critical: 75 },
        timestamp: new Date().toISOString()
      },
      {
        id: 'traffic-optimization',
        name: 'Traffic Flow Optimization',
        value: metrics.trafficFlow * 100,
        previousValue: metrics.trafficFlow * 100 * 0.92,
        unit: '%',
        category: 'infrastructure' as const,
        trend: 'up' as const,
        changePercent: 8.3,
        threshold: { warning: 70, critical: 60 },
        timestamp: new Date().toISOString()
      },
      {
        id: 'air-quality-index',
        name: 'Air Quality Index',
        value: metrics.airQuality,
        previousValue: metrics.airQuality * 1.1,
        unit: 'AQI',
        category: 'environmental' as const,
        trend: 'down' as const,
        changePercent: -9.1,
        threshold: { warning: 50, critical: 100 },
        timestamp: new Date().toISOString()
      },
      {
        id: 'security-score',
        name: 'Security Posture',
        value: metrics.securityScore,
        previousValue: metrics.securityScore * 0.98,
        unit: '/100',
        category: 'security' as const,
        trend: 'up' as const,
        changePercent: 2.1,
        threshold: { warning: 80, critical: 70 },
        timestamp: new Date().toISOString()
      },
      {
        id: 'citizen-satisfaction',
        name: 'Citizen Satisfaction',
        value: metrics.citizenSatisfaction,
        previousValue: metrics.citizenSatisfaction * 0.96,
        unit: '/100',
        category: 'performance' as const,
        trend: 'up' as const,
        changePercent: 4.2,
        threshold: { warning: 75, critical: 65 },
        timestamp: new Date().toISOString()
      },
      {
        id: 'budget-utilization',
        name: 'Budget Utilization',
        value: metrics.budgetUtilization,
        previousValue: metrics.budgetUtilization * 1.05,
        unit: '%',
        category: 'financial' as const,
        trend: 'down' as const,
        changePercent: -4.8,
        threshold: { warning: 85, critical: 95 },
        timestamp: new Date().toISOString()
      }
    ];

    return baseMetrics;
  }, [metrics]);

  // Generate time series data for charts
  const generateTimeSeriesData = (metric: AnalyticsMetric, days: number = 7) => {
    const data = [];
    const now = new Date();
    
    for (let i = days * 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseValue = metric.value;
      const variation = (Math.random() - 0.5) * 0.2 * baseValue;
      const trendFactor = metric.trend === 'up' ? (days * 24 - i) * 0.001 : 
                         metric.trend === 'down' ? -(days * 24 - i) * 0.001 : 0;
      
      data.push({
        x: timestamp.toISOString(),
        y: Math.max(0, baseValue + variation + (baseValue * trendFactor))
      });
    }
    
    return data;
  };

  // KPI Cards Component
  const KPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {analyticsMetrics.map((metric) => (
        <motion.div
          key={metric.id}
          className="card cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => setSelectedMetric(metric.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="card-content p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted">{metric.name}</h3>
              <span className={`status-indicator ${
                metric.trend === 'up' ? 'status-success' : 
                metric.trend === 'down' ? 'status-warning' : 'status-info'
              }`}>
                {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
              </span>
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {metric.value.toFixed(1)}{metric.unit}
                </div>
                <div className={`text-xs ${
                  metric.changePercent > 0 ? 'text-success' : 'text-warning'
                }`}>
                  {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}% vs last period
                </div>
              </div>
              
              {/* Mini sparkline */}
              <div className="w-16 h-8">
                <Plot
                  data={[{
                    x: generateTimeSeriesData(metric, 1).map(d => d.x),
                    y: generateTimeSeriesData(metric, 1).map(d => d.y),
                    type: 'scatter',
                    mode: 'lines',
                    line: {
                      color: metric.trend === 'up' ? '#10b981' :
                             metric.trend === 'down' ? '#f59e0b' : '#6b7280',
                      width: 2
                    },
                    showlegend: false
                  } as Data]}
                  layout={{
                    width: 64,
                    height: 32,
                    margin: { l: 0, r: 0, t: 0, b: 0 },
                    xaxis: { visible: false },
                    yaxis: { visible: false },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent'
                  }}
                  config={{ displayModeBar: false, staticPlot: true }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // Main Chart Component
  const MainChart = () => {
    if (!selectedMetric) return null;
    
    const metric = analyticsMetrics.find(m => m.id === selectedMetric);
    if (!metric) return null;

    const timeSeriesData = generateTimeSeriesData(metric, 7);
    
    return (
      <motion.div
        className="card mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="card-header">
          <h3 className="card-title">{metric.name} - Detailed Analysis</h3>
          <div className="flex items-center gap-2">
            <select 
              value={selectedTimeRange} 
              onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange['preset'])}
              className="btn btn-ghost text-xs"
            >
              <option value="1h">Last Hour</option>
              <option value="4h">Last 4 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button 
              className="btn btn-ghost text-xs"
              onClick={() => setSelectedMetric(null)}
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="card-content">
          <Plot
            data={[
              {
                x: timeSeriesData.map(d => d.x),
                y: timeSeriesData.map(d => d.y),
                type: 'scatter',
                mode: 'lines+markers',
                name: metric.name,
                line: {
                  color: '#3b82f6',
                  width: 3
                },
                marker: {
                  color: '#3b82f6',
                  size: 6
                },
                hovertemplate: `<b>${metric.name}</b><br>` +
                              `Value: %{y:.2f}${metric.unit}<br>` +
                              `Time: %{x}<br>` +
                              '<extra></extra>'
              } as Data,
              // Threshold lines
              ...(metric.threshold ? [
                {
                  x: timeSeriesData.map(d => d.x),
                  y: Array(timeSeriesData.length).fill(metric.threshold.warning),
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Warning Threshold',
                  line: {
                    color: '#f59e0b',
                    width: 2,
                    dash: 'dash'
                  }
                } as Data,
                {
                  x: timeSeriesData.map(d => d.x),
                  y: Array(timeSeriesData.length).fill(metric.threshold.critical),
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Critical Threshold',
                  line: {
                    color: '#ef4444',
                    width: 2,
                    dash: 'dash'
                  }
                } as Data
              ] : [])
            ]}
            layout={{
              autosize: true,
              height: 400,
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              font: { color: '#e5e7eb' },
              xaxis: {
                gridcolor: '#374151',
                title: 'Time'
              },
              yaxis: {
                gridcolor: '#374151',
                title: `${metric.name} (${metric.unit})`
              },
              legend: {
                orientation: 'h',
                y: -0.2
              },
              hovermode: 'x unified'
            }}
            config={{
              displayModeBar: true,
              modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
              displaylogo: false
            }}
            useResizeHandler={true}
            style={{ width: '100%' }}
          />
        </div>
      </motion.div>
    );
  };

  // Correlation Matrix
  const CorrelationMatrix = () => {
    const correlationData = analyticsMetrics.map((metricA, i) => 
      analyticsMetrics.map((metricB, j) => {
        if (i === j) return 1;
        // Simulate correlation based on category similarity
        const sameCategory = metricA.category === metricB.category;
        return sameCategory ? 0.3 + Math.random() * 0.4 : -0.2 + Math.random() * 0.4;
      })
    );

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Metric Correlation Matrix</h3>
          <span className="text-xs text-muted">Correlation strength between different metrics</span>
        </div>
        
        <div className="card-content">
          <Plot
            data={[{
              z: correlationData,
              x: analyticsMetrics.map(m => m.name),
              y: analyticsMetrics.map(m => m.name),
              type: 'heatmap',
              colorscale: [
                [0, '#ef4444'],
                [0.5, '#f3f4f6'],
                [1, '#10b981']
              ],
              showscale: true,
              hovertemplate: 'Correlation: %{z:.2f}<extra></extra>'
            } as Data]}
            layout={{
              autosize: true,
              height: 400,
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              font: { color: '#e5e7eb', size: 10 },
              xaxis: { 
                tickangle: -45,
                gridcolor: '#374151'
              },
              yaxis: { 
                gridcolor: '#374151'
              }
            }}
            config={{
              displayModeBar: false,
              staticPlot: false
            }}
            useResizeHandler={true}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    );
  };

  // Export functionality
  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: `Analytics report exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export analytics report'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`analytics-dashboard ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">Advanced Analytics</h2>
          <p className="text-muted">Interactive charts and predictive insights</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="btn btn-ghost text-xs"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button 
            className="btn btn-ghost text-xs"
            onClick={() => handleExport('excel')}
            disabled={isExporting}
          >
            Export Excel
          </button>
          <button className="btn btn-primary text-xs">
            Create Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Main Chart */}
      <AnimatePresence>
        <MainChart />
      </AnimatePresence>

      {/* Correlation Matrix */}
      <CorrelationMatrix />

      {/* Predictive Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Trend Forecasting</h3>
            <span className="status-indicator status-info">AI Powered</span>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {analyticsMetrics.slice(0, 3).map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <div className="font-medium">{metric.name}</div>
                    <div className="text-xs text-muted">Next 24h prediction</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">
                      {(metric.value * (1 + (metric.changePercent / 100) * 0.5)).toFixed(1)}{metric.unit}
                    </div>
                    <div className="text-xs text-success">95% confidence</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Anomaly Detection</h3>
            <span className="status-indicator status-success">Active</span>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <div className="font-medium">Traffic Pattern Anomaly</div>
                  <div className="text-xs text-muted">Detected 15 minutes ago</div>
                </div>
                <div className="text-right">
                  <span className="status-indicator status-warning">Medium</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <div className="font-medium">Energy Consumption Spike</div>
                  <div className="text-xs text-muted">Detected 1 hour ago</div>
                </div>
                <div className="text-right">
                  <span className="status-indicator status-info">Low</span>
                </div>
              </div>
              
              <div className="text-center py-4">
                <button className="btn btn-ghost text-xs">View All Anomalies</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
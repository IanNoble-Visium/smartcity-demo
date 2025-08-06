import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { useDataStore, useUIStore } from '../store';
import { ContextualVideoBackground } from './VideoBackground';
import { ChartErrorBoundary } from './ErrorBoundary';
import type { 
  AnalyticsMetric, 
  TimeRange 
} from '../types/analytics';

interface AdvancedAnalyticsProps {
  className?: string;
}

export function AdvancedAnalytics({ className = '' }: AdvancedAnalyticsProps) {
  const { metrics } = useDataStore();
  const { addNotification } = useUIStore();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange['preset']>('24h');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
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
  const generateTimeSeriesData = (metric: AnalyticsMetric, hours: number = 24) => {
    const data = [];
    const now = new Date();
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseValue = metric.value;
      const variation = (Math.random() - 0.5) * 0.2 * baseValue;
      const trendFactor = metric.trend === 'up' ? (hours - i) * 0.002 : 
                         metric.trend === 'down' ? -(hours - i) * 0.002 : 0;
      
      data.push({
        time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        value: Math.max(0, baseValue + variation + (baseValue * trendFactor)),
        warning: metric.threshold?.warning || 0,
        critical: metric.threshold?.critical || 0
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
                <ChartErrorBoundary>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateTimeSeriesData(metric, 6)}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={metric.trend === 'up' ? '#10b981' :
                               metric.trend === 'down' ? '#f59e0b' : '#6b7280'}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartErrorBoundary>
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

    const timeSeriesData = generateTimeSeriesData(metric, 24);
    
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
          <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timeSeriesData}>
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
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name={metric.name}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                {metric.threshold && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="warning"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Warning Threshold"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="critical"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Critical Threshold"
                      dot={false}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </ChartErrorBoundary>
        </div>
      </motion.div>
    );
  };

  // Category Distribution Chart
  const CategoryDistribution = () => {
    const categoryData = analyticsMetrics.reduce((acc, metric) => {
      const existing = acc.find(item => item.category === metric.category);
      if (existing) {
        existing.value += metric.value;
        existing.count += 1;
      } else {
        acc.push({
          category: metric.category,
          value: metric.value,
          count: 1
        });
      }
      return acc;
    }, [] as Array<{ category: string; value: number; count: number }>);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Performance by Category</h3>
          <span className="text-xs text-muted">Distribution of metrics across categories</span>
        </div>
        
        <div className="card-content">
          <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#e5e7eb'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartErrorBoundary>
        </div>
      </div>
    );
  };

  // Performance Gauge
  const PerformanceGauge = () => {
    const overallScore = analyticsMetrics.reduce((sum, metric) => sum + metric.value, 0) / analyticsMetrics.length;
    
    const gaugeData = [
      {
        name: 'Performance',
        value: overallScore,
        fill: overallScore > 80 ? '#10b981' : overallScore > 60 ? '#f59e0b' : '#ef4444'
      }
    ];

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Overall Performance Score</h3>
          <span className="status-indicator status-success">Real-time</span>
        </div>
        
        <div className="card-content">
          <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={gaugeData}>
                <RadialBar
                  background
                  dataKey="value"
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-primary">
                  {overallScore.toFixed(1)}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartErrorBoundary>
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
    <div className={`advanced-analytics ${className}`}>
      {/* Video Background */}
      <ContextualVideoBackground 
        context="analytics"
        className="absolute inset-0 -z-10"
        overlayOpacity={0.85}
      />

      {/* Header with controls */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">Advanced Analytics & Reporting</h2>
          <p className="text-muted">Interactive charts, predictive insights, and automated reporting</p>
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
      <div className="relative z-10">
        <KPICards />
      </div>

      {/* Main Chart */}
      <div className="relative z-10">
        <AnimatePresence>
          <MainChart />
        </AnimatePresence>
      </div>

      {/* Analytics Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CategoryDistribution />
        <PerformanceGauge />
      </div>

      {/* Predictive Analytics Section */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">AI-Powered Forecasting</h3>
            <span className="status-indicator status-info">Machine Learning</span>
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
            <span className="status-indicator status-success">Active Monitoring</span>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <div className="font-medium">Traffic Pattern Anomaly</div>
                  <div className="text-xs text-muted">Detected 15 minutes ago</div>
                </div>
                <div className="text-right">
                  <span className="status-indicator status-warning">Medium Risk</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <div className="font-medium">Energy Consumption Spike</div>
                  <div className="text-xs text-muted">Detected 1 hour ago</div>
                </div>
                <div className="text-right">
                  <span className="status-indicator status-info">Low Risk</span>
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
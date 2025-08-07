import { useState, useMemo, useCallback } from 'react';
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

  // Collapsible sections state for single-viewport design
  const [expandedSections, setExpandedSections] = useState({
    kpis: true,
    mainChart: true,
    analytics: true,
    predictions: false,
    anomalies: false
  });

  // Compact view mode
  const [compactMode, setCompactMode] = useState(true);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  // Stable data generation function - no dependencies to prevent circular re-renders
  const generateTimeSeriesData = useCallback((metric: AnalyticsMetric, hours: number = 24) => {
    const data = [];
    // Use a fixed timestamp base to ensure data stability
    const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(baseTime + (Date.now() % (24 * 60 * 60 * 1000)) - i * 60 * 60 * 1000);
      const baseValue = metric.value;
      // Use metric.id and index as seed for consistent, stable values
      const seed = metric.id.charCodeAt(0) * 1000 + i;
      const variation = (Math.sin(seed * 0.1) * 0.5) * 0.2 * baseValue;
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
  }, []); // Empty dependency array for stable function reference

  // Compact KPI Cards Component for single-viewport design
  const CompactKPICards = () => (
    <motion.div
      className="card mb-3"
      initial={false}
      animate={{
        height: expandedSections.kpis ? 'auto' : '50px',
        overflow: expandedSections.kpis ? 'visible' : 'hidden'
      }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="card-header cursor-pointer flex items-center justify-between py-2"
        onClick={() => toggleSection('kpis')}
      >
        <div className="flex items-center gap-2">
          <h3 className="card-title text-base">Key Performance Indicators</h3>
          <span className="text-xs text-muted">({analyticsMetrics.length} metrics)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-xs"
            onClick={(e) => {
              e.stopPropagation();
              setCompactMode(!compactMode);
            }}
          >
            {compactMode ? 'Detailed' : 'Compact'}
          </button>
          <span className="text-muted text-sm">
            {expandedSections.kpis ? '▼' : '▶'}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {expandedSections.kpis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="card-content p-3 overflow-hidden"
          >
            <div className={`grid gap-2 ${
              compactMode
                ? 'grid-cols-3 md:grid-cols-6 lg:grid-cols-8'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {analyticsMetrics.map((metric) => (
                <motion.div
                  key={metric.id}
                  className={`${
                    compactMode
                      ? 'p-2 bg-secondary rounded border cursor-pointer hover:bg-tertiary'
                      : 'card cursor-pointer hover:shadow-lg'
                  } transition-all duration-200`}
                  onClick={() => setSelectedMetric(metric.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {compactMode ? (
                    // Ultra-compact layout for single viewport
                    <div className="text-center">
                      <div className="text-xs text-muted mb-1 truncate" title={metric.name}>
                        {metric.name.length > 12 ? metric.name.substring(0, 12) + '...' : metric.name}
                      </div>
                      <div className="text-sm font-bold text-primary">
                        {metric.value.toFixed(1)}{metric.unit}
                      </div>
                      <div className={`text-xs ${
                        metric.changePercent > 0 ? 'text-success' :
                        metric.changePercent < 0 ? 'text-warning' : 'text-muted'
                      }`}>
                        {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                      </div>
                    </div>
                  ) : (
                    // Standard layout
                    <div className="card-content p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-muted">{metric.name}</h4>
                        <span className={`status-indicator ${
                          metric.trend === 'up' ? 'status-success' :
                          metric.trend === 'down' ? 'status-warning' : 'status-info'
                        }`}>
                          {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                        </span>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-lg font-bold text-primary">
                            {metric.value.toFixed(1)}{metric.unit}
                          </div>
                          <div className={`text-xs ${
                            metric.changePercent > 0 ? 'text-success' : 'text-warning'
                          }`}>
                            {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}% vs last period
                          </div>
                        </div>

                        {/* Mini sparkline */}
                        <div className="w-12 h-6">
                          <ChartErrorBoundary>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={useMemo(() => generateTimeSeriesData(metric, 6), [metric.id])}>
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
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Compact Main Chart Component
  const CompactMainChart = () => {
    const metric = selectedMetric ? analyticsMetrics.find(m => m.id === selectedMetric) : analyticsMetrics[0];
    if (!metric) return null;

    // Memoize chart data to prevent constant refreshing
    const timeSeriesData = useMemo(() => {
      return generateTimeSeriesData(metric, 24);
    }, [metric.id, selectedTimeRange]);

    return (
      <motion.div
        className="card mb-3"
        initial={false}
        animate={{
          height: expandedSections.mainChart ? 'auto' : '50px',
          overflow: expandedSections.mainChart ? 'visible' : 'hidden'
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="card-header cursor-pointer flex items-center justify-between py-2"
          onClick={() => toggleSection('mainChart')}
        >
          <div className="flex items-center gap-2">
            <h3 className="card-title text-base">
              {selectedMetric ? `${metric.name} - Detailed Analysis` : 'Primary Analytics Chart'}
            </h3>
            <span className="text-xs text-muted">Time Series</span>
          </div>
          <div className="flex items-center gap-2">
            {expandedSections.mainChart && (
              <>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSelectedTimeRange(e.target.value as TimeRange['preset']);
                  }}
                  className="btn btn-ghost btn-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                  <option value="24h">24h</option>
                  <option value="7d">7d</option>
                  <option value="30d">30d</option>
                </select>
                {selectedMetric && (
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMetric(null);
                    }}
                  >
                    Reset
                  </button>
                )}
              </>
            )}
            <span className="text-muted text-sm">
              {expandedSections.mainChart ? '▼' : '▶'}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {expandedSections.mainChart && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="card-content p-3 overflow-hidden"
            >
              <div style={{ height: '250px' }}>
                <ChartErrorBoundary>
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={300}
                    minHeight={250}
                  >
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="time"
                        stroke="#9ca3af"
                        fontSize={11}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={11}
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
                        strokeWidth={2}
                        name={metric.name}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                      />
                      {metric.threshold && (
                        <>
                          <Line
                            type="monotone"
                            dataKey="warning"
                            stroke="#f59e0b"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            name="Warning"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="critical"
                            stroke="#ef4444"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            name="Critical"
                            dot={false}
                          />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartErrorBoundary>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Compact Analytics Grid Component
  const CompactAnalyticsGrid = () => {
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

    const overallScore = analyticsMetrics.reduce((sum, metric) => sum + metric.value, 0) / analyticsMetrics.length;
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
      <motion.div
        className="card mb-3"
        initial={false}
        animate={{
          height: expandedSections.analytics ? 'auto' : '50px',
          overflow: expandedSections.analytics ? 'visible' : 'hidden'
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="card-header cursor-pointer flex items-center justify-between py-2"
          onClick={() => toggleSection('analytics')}
        >
          <div className="flex items-center gap-2">
            <h3 className="card-title text-base">Analytics Overview</h3>
            <span className="text-xs text-muted">Distribution & Performance</span>
          </div>
          <span className="text-muted text-sm">
            {expandedSections.analytics ? '▼' : '▶'}
          </span>
        </div>

        <AnimatePresence>
          {expandedSections.analytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="card-content p-3 overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Category Distribution */}
                <div className="bg-secondary rounded p-3">
                  <h4 className="text-sm font-medium text-muted mb-3">Performance by Category</h4>
                  <div style={{ height: '200px' }}>
                    <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category, percent }) => `${category} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={60}
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

                {/* Performance Gauge */}
                <div className="bg-secondary rounded p-3">
                  <h4 className="text-sm font-medium text-muted mb-3">Overall Performance Score</h4>
                  <div style={{ height: '200px' }}>
                    <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" data={[{
                          name: 'Performance',
                          value: overallScore,
                          fill: overallScore > 80 ? '#10b981' : overallScore > 60 ? '#f59e0b' : '#ef4444'
                        }]}>
                          <RadialBar background dataKey="value" />
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold fill-primary">
                            {overallScore.toFixed(1)}
                          </text>
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </ChartErrorBoundary>
                  </div>
                  <div className="text-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      overallScore > 80 ? 'bg-success text-success-content' :
                      overallScore > 60 ? 'bg-warning text-warning-content' : 'bg-error text-error-content'
                    }`}>
                      {overallScore > 80 ? 'Excellent' : overallScore > 60 ? 'Good' : 'Needs Attention'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };



  // Compact Predictive Analytics Component
  const CompactPredictiveAnalytics = () => (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3"
      initial={false}
    >
      {/* AI Forecasting */}
      <motion.div
        className="card"
        initial={false}
        animate={{
          height: expandedSections.predictions ? 'auto' : '50px',
          overflow: expandedSections.predictions ? 'visible' : 'hidden'
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="card-header cursor-pointer flex items-center justify-between py-2"
          onClick={() => toggleSection('predictions')}
        >
          <div className="flex items-center gap-2">
            <h3 className="card-title text-base">AI-Powered Forecasting</h3>
            <span className="status-indicator status-info text-xs">ML</span>
          </div>
          <span className="text-muted text-sm">
            {expandedSections.predictions ? '▼' : '▶'}
          </span>
        </div>

        <AnimatePresence>
          {expandedSections.predictions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="card-content p-3 overflow-hidden"
            >
              <div className="space-y-2">
                {analyticsMetrics.slice(0, 3).map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-2 bg-secondary rounded text-sm">
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Anomaly Detection */}
      <motion.div
        className="card"
        initial={false}
        animate={{
          height: expandedSections.anomalies ? 'auto' : '50px',
          overflow: expandedSections.anomalies ? 'visible' : 'hidden'
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="card-header cursor-pointer flex items-center justify-between py-2"
          onClick={() => toggleSection('anomalies')}
        >
          <div className="flex items-center gap-2">
            <h3 className="card-title text-base">Anomaly Detection</h3>
            <span className="status-indicator status-success text-xs">Active</span>
          </div>
          <span className="text-muted text-sm">
            {expandedSections.anomalies ? '▼' : '▶'}
          </span>
        </div>

        <AnimatePresence>
          {expandedSections.anomalies && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="card-content p-3 overflow-hidden"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-secondary rounded text-sm">
                  <div>
                    <div className="font-medium">Traffic Pattern Anomaly</div>
                    <div className="text-xs text-muted">Detected 15 min ago</div>
                  </div>
                  <span className="status-indicator status-warning text-xs">Medium</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-secondary rounded text-sm">
                  <div>
                    <div className="font-medium">Energy Consumption Spike</div>
                    <div className="text-xs text-muted">Detected 1h ago</div>
                  </div>
                  <span className="status-indicator status-info text-xs">Low</span>
                </div>

                <div className="text-center pt-2">
                  <button className="btn btn-ghost btn-xs">View All</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

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
    <div className={`advanced-analytics ${className} h-screen overflow-hidden flex flex-col`}>
      {/* Video Background */}
      <ContextualVideoBackground
        context="analytics"
        className="absolute inset-0 -z-10"
        overlayOpacity={0.85}
      />

      {/* Compact Header with controls */}
      <div className="relative z-10 flex items-center justify-between mb-3 px-4 py-2 bg-card/80 backdrop-blur-sm border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-primary">Advanced Analytics & Reporting</h2>
          <p className="text-xs text-muted">Interactive charts, predictive insights, and automated reporting</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setCompactMode(!compactMode)}
          >
            {compactMode ? 'Expand' : 'Compact'}
          </button>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'PDF'}
          </button>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => handleExport('excel')}
            disabled={isExporting}
          >
            Excel
          </button>
          <button className="btn btn-primary btn-xs">
            Report
          </button>
        </div>
      </div>

      {/* Single-viewport scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* Compact KPI Cards */}
        <CompactKPICards />

        {/* Compact Main Chart */}
        <CompactMainChart />

        {/* Compact Analytics Grid */}
        <CompactAnalyticsGrid />

        {/* Compact Predictive Analytics */}
        <CompactPredictiveAnalytics />
      </div>
    </div>
  );
}

export default AdvancedAnalytics;
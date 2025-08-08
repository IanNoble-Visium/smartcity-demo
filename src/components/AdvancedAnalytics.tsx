import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import * as joint from 'jointjs';
import 'jointjs/dist/joint.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
  , BarChart, Bar
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
  // Right-side panel tab (space-efficient, no extra dialogs)
  const [rightTab, setRightTab] = useState<'predictions' | 'anomalies'>('predictions');

  // JointJS diagram reference and active panel state
  const diagramRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState<null | 'carbon' | 'maintenance' | 'green'>(null);

  // Fixed chart height for content panels. Previously chartH was computed
  // dynamically based on available space; to simplify layout within the
  // slide‑out panel we assign a constant height that fits well within the
  // single‑viewport dashboard.
  const chartH = 150;


  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Initialize JointJS diagram once the component mounts. The diagram renders
  // interactive nodes representing each major analytics module. When a node
  // is clicked, a slide‑out panel opens with the corresponding content.
  useEffect(() => {
    const el = diagramRef.current;
    if (!el) return;
    // Clean up previous diagram if re-rendered
    while (el.firstChild) el.removeChild(el.firstChild);
    const graph = new joint.dia.Graph();
    const paper = new joint.dia.Paper({
      el: el,
      model: graph,
      width: el.clientWidth || 800,
      height: el.clientHeight || 400,
      gridSize: 10,
      drawGrid: false,
      interactive: { linkMove: false }
    });

    // Map to associate element IDs with panel types.  When the user
    // clicks on a node we use this mapping to decide which panel to open.
    const nodeTypeMap: Record<string, 'carbon' | 'maintenance' | 'green'> = {};

    // Helper to create rectangular nodes with consistent styling.  The
    // JointJS type definitions do not allow arbitrary attributes on the
    // shape definition so we instead record the mapping in `nodeTypeMap`.
    const createNode = (label: string, type: 'carbon' | 'maintenance' | 'green', x: number, y: number) => {
      const rect = new joint.shapes.standard.Rectangle();
      rect.position(x, y);
      rect.resize(160, 80);
      rect.attr({
        body: {
          fill: '#111827',
          stroke: '#3b82f6',
          strokeWidth: 2,
          rx: 8,
          ry: 8
        },
        label: {
          text: label,
          fill: '#e5e7eb',
          fontSize: 12,
          fontWeight: 600
        }
      });
      rect.addTo(graph);
      // Record the type for later lookup when the node is clicked
      nodeTypeMap[rect.id] = type;
      return rect;
    };

    // Central hub node
    const central = new joint.shapes.standard.Circle();
    central.position(340, 40);
    central.resize(80, 80);
    central.attr({
      body: {
        fill: '#10b981',
        stroke: '#065f46',
        strokeWidth: 2
      },
      label: {
        text: 'Analytics',
        fill: '#f0fdfa',
        fontSize: 12,
        fontWeight: 600
      }
    });
    central.addTo(graph);

    // Module nodes
    const carbonNode = createNode('Carbon Emissions', 'carbon', 80, 180);
    const maintenanceNode = createNode('Maintenance', 'maintenance', 320, 180);
    const greenNode = createNode('Green Energy', 'green', 560, 180);

    // Connect central hub to each module
    [carbonNode, maintenanceNode, greenNode].forEach((node) => {
      const link = new joint.shapes.standard.Link();
      link.source({ id: central.id });
      link.target({ id: node.id });
      link.attr({
        line: {
          stroke: '#6b7280',
          strokeWidth: 1,
          targetMarker: {
            type: 'path',
            d: 'M 4 0 L 0 2 L 4 4 z'
          }
        }
      });
      link.addTo(graph);
    });

    // Register a click handler at the paper level.  When an element is
    // clicked, look up its ID in the `nodeTypeMap` and open the
    // corresponding panel.  This avoids calling `.on` on individual
    // elements which the TypeScript definitions disallow.
    paper.on('element:pointerclick', (cellView: any) => {
      const modelId = cellView.model.id as string;
      const t = nodeTypeMap[modelId];
      if (t) {
        setActivePanel(t);
      }
    });

    return () => {
      // Remove paper event listeners to avoid duplicates on re-render.  Use
      // type assertion because `off` is not defined in the Paper type
      // definitions, but it exists at runtime via Backbone.js.
      (paper as any).off('element:pointerclick');
    };
  }, [diagramRef]);

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
      className="card"
      initial={false}
      animate={{
        // Prevent content (e.g., charts) from spilling into other cards
        overflow: 'hidden'
      }}
      transition={{ duration: 0.3 }}
      style={{ height: compactMode ? 110 : undefined }}
    >
      <div
        className="card-header cursor-pointer flex items-center justify-between py-2"
        style={{ marginBottom: 0 }}
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
            <div className={`grid gap-1 ${
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
                      <div className="text-[10px] text-muted mb-0.5 truncate" title={metric.name}>
                        {metric.name.length > 10 ? metric.name.substring(0, 10) + '...' : metric.name}
                      </div>
                      <div className="text-xs font-bold text-primary">
                        {metric.value.toFixed(1)}{metric.unit}
                      </div>
                      <div className={`text-[10px] ${
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
        className="card"
        initial={false}
        animate={{
          // Keep overflow hidden even when expanded to avoid overlapping visuals
          overflow: 'hidden'
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="card-header cursor-pointer flex items-center justify-between py-2"
          style={{ marginBottom: 0 }}
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
              <div style={{ height: compactMode ? '80px' : '250px' }}>
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
        className="card"
        initial={false}
        animate={{
          // Hidden overflow ensures charts/tooltips don't bleed outside
          overflow: 'hidden'
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="card-header cursor-pointer flex items-center justify-between py-2"
          style={{ marginBottom: 0 }}
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
                  <div style={{ height: compactMode ? '80px' : '200px' }}>
                    <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category, percent }) => `${category} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={compactMode ? 36 : 60}
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
                  <div style={{ height: compactMode ? '80px' : '200px' }}>
                    <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius={compactMode ? '38%' : '40%'} outerRadius={compactMode ? '66%' : '80%'} data={[{
                          name: 'Performance',
                          value: overallScore,
                          fill: overallScore > 80 ? '#10b981' : overallScore > 60 ? '#f59e0b' : '#ef4444'
                        }]}> 
                          <RadialBar background dataKey="value" />
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-primary">
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

  // Right-side AI & Alerts panel (Tabbed to save vertical space)
  const CompactAIPanel = () => (
    <motion.div className="card" initial={false} style={{ height: compactMode ? 120 : 'auto' }}>
      <div className="card-header py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="card-title text-base">AI & Alerts</h3>
          <span className="status-indicator status-info text-xs">Live</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button
            className={`btn btn-ghost btn-xs ${rightTab === 'predictions' ? 'text-primary' : ''}`}
            onClick={() => setRightTab('predictions')}
          >
            Forecasts
          </button>
          <span className="text-muted">|</span>
          <button
            className={`btn btn-ghost btn-xs ${rightTab === 'anomalies' ? 'text-primary' : ''}`}
            onClick={() => setRightTab('anomalies')}
          >
            Anomalies
          </button>
        </div>
      </div>

      <div className="card-content p-2 h-full min-h-0 overflow-y-auto">
        {rightTab === 'predictions' ? (
          <div className="space-y-2">
            {analyticsMetrics.slice(0, 5).map((metric) => (
              <div key={metric.id} className="flex items-center justify-between p-2 bg-secondary rounded text-sm">
                <div>
                  <div className="font-medium line-clamp-1 text-xs">{metric.name}</div>
                  <div className="text-[10px] text-muted">Next 24h prediction</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary text-xs">
                    {(metric.value * (1 + (metric.changePercent / 100) * 0.5)).toFixed(1)}{metric.unit}
                  </div>
                  <div className="text-[10px] text-success">95% confidence</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-secondary rounded text-sm">
              <div>
                <div className="font-medium text-xs">Traffic Pattern Anomaly</div>
                <div className="text-[10px] text-muted">Detected 15 min ago</div>
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
        )}
      </div>
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

  /*
   * ======================================================================
   * Tabbed analytics sections
   *
   * Each of the following components encapsulates the content for one of
   * the high‑level analytics tabs. They are defined within the main
   * AdvancedAnalytics component so they can access state and hooks such as
   * metrics and generateTimeSeriesData. These sections are collapsed by
   * default and only rendered when their corresponding tab is active.
   */

  // Carbon Emissions Analytics Tab
  const CarbonTabContent = () => {
    if (!metrics) return null;
    // Derive carbon analytics metrics from base data
    const netZeroProgress = useMemo(() => {
      // Simulate progress toward net zero: assume lower energy consumption means higher progress
      const progress = Math.max(5, Math.min(95, (100 - metrics.energyConsumption)));
      return progress;
    }, [metrics.energyConsumption]);

    const carbonFootprint = useMemo(() => {
      // Placeholder carbon footprint calculation (tonnes CO₂e)
      return metrics.energyConsumption * 0.8 + metrics.trafficFlow * 20;
    }, [metrics.energyConsumption, metrics.trafficFlow]);

    const renewableProduction = useMemo(() => {
      // Placeholder renewable energy production (MW)
      return metrics.energyConsumption * 0.3;
    }, [metrics.energyConsumption]);

    // Time series for power consumption and renewable energy
    const powerMetric = useMemo(() => ({
      id: 'power-consumption',
      name: 'Power Consumption',
      value: metrics.energyConsumption,
      previousValue: metrics.energyConsumption,
      unit: 'MW',
      category: 'performance' as const,
      trend: metrics.energyConsumption > 0 ? 'up' as const : 'down' as const,
      changePercent: 0,
      threshold: { warning: 65, critical: 80 },
      timestamp: new Date().toISOString()
    }), [metrics.energyConsumption]);
    const powerSeries = useMemo(() => generateTimeSeriesData(powerMetric, 24), [powerMetric]);
    const renewableMetric = useMemo(() => ({
      id: 'renewable-production',
      name: 'Renewable Production',
      value: renewableProduction,
      previousValue: renewableProduction,
      unit: 'MW',
      category: 'performance' as const,
      trend: 'up' as const,
      changePercent: 0,
      threshold: { warning: renewableProduction * 0.8, critical: renewableProduction * 0.9 },
      timestamp: new Date().toISOString()
    }), [renewableProduction]);
    const renewableSeries = useMemo(() => generateTimeSeriesData(renewableMetric, 24), [renewableMetric]);

    // Carbon footprint composition (transportation, buildings, industry, other)
    const footprintData = useMemo(() => {
      const transport = carbonFootprint * 0.4;
      const buildings = carbonFootprint * 0.3;
      const industry = carbonFootprint * 0.2;
      const other = carbonFootprint - transport - buildings - industry;
      return [
        { name: 'Transport', value: transport },
        { name: 'Buildings', value: buildings },
        { name: 'Industry', value: industry },
        { name: 'Other', value: other }
      ];
    }, [carbonFootprint]);

    // Renewable energy mix (solar, wind, hydro)
    const renewableMixData = useMemo(() => {
      const solar = renewableProduction * 0.5;
      const wind = renewableProduction * 0.35;
      const hydro = renewableProduction - solar - wind;
      return [
        { name: 'Solar', value: solar },
        { name: 'Wind', value: wind },
        { name: 'Hydro', value: hydro }
      ];
    }, [renewableProduction]);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 h-full min-h-0 overflow-hidden">
        {/* Progress toward net zero */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-sm">Net Zero Progress</h3>
          </div>
          <div className="card-content flex-1 flex items-center justify-center p-1">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={chartH}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="80%"
                  data={[{ name: 'Progress', value: netZeroProgress, fill: netZeroProgress > 70 ? '#10b981' : netZeroProgress > 40 ? '#f59e0b' : '#ef4444' }]}
                >
                  <RadialBar background dataKey="value" />
                  {/* Center label */}
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-primary">
                    {netZeroProgress.toFixed(0)}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Real-time power and renewable monitoring */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-sm">Power & Renewable Trends</h3>
          </div>
          <div className="card-content flex-1 p-1">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={chartH}>
                <LineChart data={powerSeries.map((d, idx) => ({
                  time: d.time,
                  power: d.value,
                  renewable: renewableSeries[idx] ? renewableSeries[idx].value : 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }} />
                  <Line type="monotone" dataKey="power" stroke="#3b82f6" strokeWidth={2} dot={false} name="Power Consumption" />
                  <Line type="monotone" dataKey="renewable" stroke="#10b981" strokeWidth={2} dot={false} name="Renewable Production" />
                </LineChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Carbon footprint composition */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-sm">Carbon Footprint Composition</h3>
          </div>
          <div className="card-content flex-1 p-1">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={chartH}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    isAnimationActive={false}
                    data={footprintData}
                    cx="50%"
                    cy="50%"
                    outerRadius={Math.min(80, Math.floor(chartH * 0.45))}
                    label={({ name, percent }) => `${name}: ${(((percent ?? 0) * 100).toFixed(0))}%`}
                  >
                    {footprintData.map((_entry, index) => (
                      <Cell key={`cell-foot-${index}`} fill={[ '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6' ][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Renewable energy mix */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-sm">Renewable Energy Mix</h3>
          </div>
          <div className="card-content flex-1 p-1">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={chartH}>
                <BarChart data={renewableMixData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }} />
                  <Bar dataKey="value" fill="#10b981" barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>
      </div>
    );
  };

  // Maintenance Analytics Tab
  const MaintenanceTabContent = () => {
    if (!metrics) return null;
    // Derive maintenance metrics
    const windHealth = useMemo(() => {
      // Higher energy consumption could indicate higher stress, thus lower health
      const health = Math.max(50, 100 - metrics.energyConsumption);
      return health;
    }, [metrics.energyConsumption]);
    const solarPerformance = useMemo(() => {
      const perf = Math.max(40, 100 - metrics.airQuality);
      return perf;
    }, [metrics.airQuality]);
    const repairBacklog = useMemo(() => {
      // Number of outstanding repairs
      return Math.round((100 - metrics.citizenSatisfaction) / 10);
    }, [metrics.citizenSatisfaction]);
    const downtimeMetric = useMemo(() => ({
      id: 'downtime',
      name: 'Downtime',
      value: metrics.trafficFlow * 10,
      previousValue: metrics.trafficFlow * 10,
      unit: 'h',
      category: 'infrastructure' as const,
      trend: 'up' as const,
      changePercent: 0,
      threshold: { warning: 60, critical: 80 },
      timestamp: new Date().toISOString()
    }), [metrics.trafficFlow]);
    const downtimeSeries = useMemo(() => generateTimeSeriesData(downtimeMetric, 24), [downtimeMetric]);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 h-full min-h-0 overflow-hidden">
        {/* Wind turbine health */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-sm">Wind Turbine Health</h3>
          </div>
          <div className="card-content flex-1 flex items-center justify-center p-1">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={chartH}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="80%"
                  data={[{ name: 'Health', value: windHealth, fill: windHealth > 70 ? '#10b981' : windHealth > 40 ? '#f59e0b' : '#ef4444' }]}
                >
                  <RadialBar background dataKey="value" />
                  {/* Center label */}
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-primary">
                    {windHealth.toFixed(0)}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Solar panel performance */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-sm">Solar Panel Performance</h3>
          </div>
          <div className="card-content flex-1 p-1">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={chartH}>
                <LineChart data={downtimeSeries.map((d) => ({ time: d.time, performance: solarPerformance + Math.sin(parseInt(d.time.replace(/:/g, ''), 10)) * 5 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }} />
                  <Line type="monotone" dataKey="performance" stroke="#f59e0b" strokeWidth={2} dot={false} name="Performance (%)" />
                </LineChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Repair backlog */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-sm">Repair Needs & Backlog</h3>
          </div>
          <div className="card-content flex-1 p-1">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">
                  {repairBacklog}
                </div>
                <div className="text-sm text-muted">Outstanding Repair Orders</div>
              </div>
            </div>
          </div>
        </div>

        {/* Downtime & turnaround */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-sm">Downtime & Turnaround</h3>
          </div>
          <div className="card-content flex-1 p-1">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={chartH}>
                <BarChart data={downtimeSeries.map((d) => ({ time: d.time, downtime: d.value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }} />
                  <Bar dataKey="downtime" fill="#ef4444" barSize={16} name="Downtime (h)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>
      </div>
    );
  };

  // Green Energy Technologies Tab
  const GreenTabContent = () => {
    // Example values for various emerging technologies
    const nuclearProgress = 25; // progress toward commercial viability
    const techAdoption = useMemo(() => ([
      { name: 'Fusion', value: 5 },
      { name: 'Fission', value: 20 },
      { name: 'Carbon Capture', value: 15 },
      { name: 'Energy Storage', value: 40 }
    ]), []);
    const emissionsReduction = useMemo(() => ([
      { name: 'CCS', value: 30 },
      { name: 'Electrification', value: 50 },
      { name: 'Hydrogen', value: 20 }
    ]), []);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 h-full min-h-0 overflow-hidden">
        {/* Nuclear energy monitoring */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-xs">Nuclear Energy Development</h3>
          </div>
          <div className="card-content flex-1 flex items-center justify-center p-1">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={chartH}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="80%"
                  data={[{ name: 'Nuclear', value: nuclearProgress, fill: nuclearProgress > 50 ? '#10b981' : '#f59e0b' }]}
                >
                  <RadialBar background dataKey="value" />
                  {/* Center label */}
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-primary">
                    {nuclearProgress}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Emerging emissions reduction technologies */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-sm">Emissions Reduction Technologies</h3>
          </div>
          <div className="card-content flex-1 p-1">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={chartH}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={emissionsReduction}
                    cx="50%"
                    cy="50%"
                    outerRadius={Math.min(80, Math.floor(chartH * 0.45))}
                    label={({ name, percent }) => `${name}: ${(((percent ?? 0) * 100).toFixed(0))}%`}
                  >
                    {emissionsReduction.map((_entry, index) => (
                      <Cell key={`cell-em-${index}`} fill={[ '#3b82f6', '#10b981', '#f59e0b', '#ef4444' ][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Next‑generation renewable systems */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-sm">Next‑Gen Renewable Systems</h3>
          </div>
          <div className="card-content flex-1 p-1">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={chartH}>
                <BarChart data={techAdoption}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }} />
                  <Bar dataKey="value" fill="#8b5cf6" barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Advanced carbon capture solutions */}
        <div className="card flex flex-col">
          <div className="card-header py-0.5 flex items-center justify-between">
            <h3 className="card-title text-sm">Advanced Carbon Capture</h3>
          </div>
          <div className="card-content flex-1 p-1">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">
                  {emissionsReduction.find(e => e.name === 'CCS')?.value ?? 0}%
                </div>
                <div className="text-sm text-muted">CCS Efficacy</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`advanced-analytics ${compactMode ? 'ua-compact' : ''} ${className} h-full min-h-0 overflow-hidden flex flex-col`}>
      {/* Video Background */}
      <ContextualVideoBackground
        context="analytics"
        className="absolute inset-0 -z-10"
        overlayOpacity={0.85}
      />

      {/* Compact Header with controls */}
      <div className="relative z-10 flex items-center justify-between mb-2 px-3 py-1 bg-card/80 backdrop-blur-sm border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-primary">Advanced Analytics & Reporting</h2>
          {!compactMode && (
            <p className="text-[10px] text-muted">Interactive charts, predictive insights, and automated reporting</p>
          )}
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

      {/* Diagram area with interactive nodes and slide‑out panel */}
      <div className="relative z-10 flex-1 flex overflow-hidden px-1 pb-1">
        {/* Diagram container */}
        <div ref={diagramRef} className="flex-1 relative"></div>
        {/* Side panel that appears when a node is selected */}
        {activePanel && (
          <div className="w-1/3 min-w-[280px] max-w-[420px] bg-card border-l border-border p-2 overflow-y-auto">
            <div className="flex justify-end mb-1">
              <button className="btn btn-ghost btn-xs" onClick={() => setActivePanel(null)}>Close</button>
            </div>
            {activePanel === 'carbon' && <CarbonTabContent />}
            {activePanel === 'maintenance' && <MaintenanceTabContent />}
            {activePanel === 'green' && <GreenTabContent />}
          </div>
        )}
        {/* Hidden legacy components to preserve references for TypeScript */}
        <div className="hidden">
          <CompactKPICards />
          <CompactMainChart />
          <CompactAnalyticsGrid />
          <CompactAIPanel />
        </div>
      </div>
    </div>
  );
}

export default AdvancedAnalytics;
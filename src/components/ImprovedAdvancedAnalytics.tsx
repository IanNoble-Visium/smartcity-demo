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
  RadialBar,
  BarChart,
  Bar
} from 'recharts';
import { useDataStore, useUIStore } from '../store';
import { ContextualVideoBackground } from './VideoBackground';
import { ChartErrorBoundary } from './ErrorBoundary';
import type {
  AnalyticsMetric,
  TimeRange
} from '../types/analytics';

interface ImprovedAdvancedAnalyticsProps {
  className?: string;
}

// Enhanced JointJS Elements with better visual design
class SmartCityHub extends joint.dia.Element {
  defaults() {
    return {
      ...super.defaults,
      type: 'smartcity.Hub',
      size: { width: 140, height: 140 },
      attrs: {
        body: {
          fill: {
            type: 'radialGradient',
            stops: [
              { offset: '0%', color: '#1e40af' },
              { offset: '70%', color: '#3b82f6' },
              { offset: '100%', color: '#1e3a8a' }
            ]
          },
          stroke: '#60a5fa',
          strokeWidth: 3,
          filter: {
            name: 'dropShadow',
            args: { dx: 3, dy: 3, blur: 6, color: 'rgba(0,0,0,0.4)' }
          }
        },
        label: {
          text: 'TruContext\nCommand Hub',
          fill: '#ffffff',
          fontSize: 14,
          fontWeight: 'bold',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle'
        },
        statusRing: {
          fill: 'none',
          stroke: '#10b981',
          strokeWidth: 3,
          strokeDasharray: '8,4',
          r: 'calc(0.85*r)',
          cx: 'calc(w/2)',
          cy: 'calc(h/2)'
        }
      }
    };
  }

  preinitialize() {
    this.markup = joint.util.svg`
      <circle @selector="body" />
      <circle @selector="statusRing" />
      <text @selector="label" />
      <g @selector="pulseGroup">
        <circle class="pulse-ring" r="calc(r)" cx="calc(w/2)" cy="calc(h/2)" fill="none" stroke="#10b981" stroke-width="2" opacity="0">
          <animate attributeName="r" values="calc(r);calc(1.3*r);calc(1.8*r)" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.5;0" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle class="pulse-ring" r="calc(r)" cx="calc(w/2)" cy="calc(h/2)" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0">
          <animate attributeName="r" values="calc(r);calc(1.3*r);calc(1.8*r)" dur="3s" begin="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.5;0" dur="3s" begin="1s" repeatCount="indefinite"/>
        </circle>
      </g>
    `;
  }
}

class SmartCityNode extends joint.dia.Element {
  defaults() {
    return {
      ...super.defaults,
      type: 'smartcity.Node',
      nodeType: 'energy',
      size: { width: 120, height: 90 },
      attrs: {
        body: {
          fill: '#111827',
          stroke: '#3b82f6',
          strokeWidth: 2,
          rx: 15,
          ry: 15,
          filter: {
            name: 'dropShadow',
            args: { dx: 2, dy: 2, blur: 4, color: 'rgba(0,0,0,0.5)' }
          }
        },
        icon: {
          fill: '#60a5fa',
          fontSize: 28,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          x: 'calc(w/2)',
          y: 'calc(h/2 - 12)'
        },
        label: {
          text: 'System',
          fill: '#e5e7eb',
          fontSize: 11,
          fontWeight: 600,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          x: 'calc(w/2)',
          y: 'calc(h/2 + 18)'
        },
        statusIndicator: {
          fill: '#10b981',
          r: 5,
          cx: 'calc(w - 10)',
          cy: 10
        },
        dataFlow: {
          fill: 'none',
          stroke: '#10b981',
          strokeWidth: 2,
          strokeDasharray: '6,3',
          d: 'M 10 calc(h/2) L calc(w-10) calc(h/2)'
        }
      }
    };
  }

  preinitialize() {
    this.markup = joint.util.svg`
      <rect @selector="body" />
      <text @selector="icon" />
      <text @selector="label" />
      <circle @selector="statusIndicator">
        <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <path @selector="dataFlow">
        <animate attributeName="stroke-dashoffset" values="0;9" dur="1.5s" repeatCount="indefinite"/>
      </path>
    `;
  }
}

// Enhanced Link with better animations
class SmartCityLink extends joint.dia.Link {
  defaults() {
    return {
      ...super.defaults,
      type: 'smartcity.Link',
      attrs: {
        line: {
          stroke: '#6b7280',
          strokeWidth: 3,
          strokeDasharray: '10,5',
          targetMarker: {
            type: 'path',
            d: 'M 10 0 L 0 5 L 10 10 z',
            fill: '#10b981',
            stroke: '#10b981'
          }
        }
      }
    };
  }

  preinitialize() {
    this.markup = joint.util.svg`
      <path @selector="line">
        <animate attributeName="stroke-dashoffset" values="0;15" dur="2s" repeatCount="indefinite"/>
      </path>
      <g @selector="dataParticles">
        <circle r="4" fill="#10b981" opacity="0.8">
          <animateMotion dur="4s" repeatCount="indefinite">
            <mpath href="#linkPath"/>
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite"/>
        </circle>
        <circle r="3" fill="#3b82f6" opacity="0.6">
          <animateMotion dur="4s" begin="2s" repeatCount="indefinite">
            <mpath href="#linkPath"/>
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" dur="4s" begin="2s" repeatCount="indefinite"/>
        </circle>
      </g>
    `;
  }
}

export function ImprovedAdvancedAnalytics({ className = '' }: ImprovedAdvancedAnalyticsProps) {
  const { metrics } = useDataStore();
  const { addNotification } = useUIStore();
  
  // Enhanced state management
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange['preset']>('24h');
  const [isAnimating, setIsAnimating] = useState(true);
  const [isIsometric, setIsIsometric] = useState(false);
  const [overlayPanel, setOverlayPanel] = useState<null | 'carbon' | 'maintenance' | 'green'>(null);

  // JointJS diagram reference
  const diagramRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<joint.dia.Paper | null>(null);
  const graphRef = useRef<joint.dia.Graph | null>(null);
  const nodeTypeMap = useRef<Record<string, string>>({});

  const chartH = 220;

  // ESC key handler for modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOverlayPanel(null);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Enhanced JointJS diagram initialization
  useEffect(() => {
    const el = diagramRef.current;
    if (!el) return;

    // Clean up previous diagram
    if (paperRef.current) {
      paperRef.current.remove();
    }

    // Create namespace for custom elements
    const namespace = {
      smartcity: {
        Hub: SmartCityHub,
        Node: SmartCityNode,
        Link: SmartCityLink
      }
    };

    const graph = new joint.dia.Graph({}, { cellNamespace: namespace });
    const paper = new joint.dia.Paper({
      el: el,
      model: graph,
      width: el.clientWidth || 900,
      height: el.clientHeight || 600,
      gridSize: 15,
      drawGrid: true,
      gridColor: '#374151',
      interactive: { linkMove: false },
      cellViewNamespace: namespace,
      background: {
        color: 'transparent'
      }
    });

    graphRef.current = graph;
    paperRef.current = paper;

    // Create central TruContext hub
    const centralHub = new SmartCityHub();
    centralHub.position(390, 250);
    centralHub.addTo(graph);

    // Helper function to create nodes with domain-specific styling
    const createNode = (
      label: string,
      type: 'carbon' | 'maintenance' | 'green',
      x: number,
      y: number,
      icon: string,
      color: string
    ) => {
      const node = new SmartCityNode();
      node.set({
        nodeType: type,
        position: { x, y }
      });
      node.attr({
        icon: { text: icon },
        label: { text: label },
        body: { stroke: color },
        statusIndicator: { fill: color },
        dataFlow: { stroke: color }
      });
      node.addTo(graph);
      nodeTypeMap.current[node.id] = type;
      return node;
    };

    // Create smart city nodes with enhanced positioning
    const carbonNode = createNode('Carbon Emissions', 'carbon', 150, 150, '🌱', '#06b6d4');
    const maintenanceNode = createNode('Maintenance', 'maintenance', 390, 450, '🔧', '#f59e0b');
    const greenNode = createNode('Green Energy', 'green', 630, 150, '⚡', '#10b981');

    // Create enhanced animated links with better routing
    const createAnimatedLink = (source: joint.dia.Element, target: joint.dia.Element, color: string) => {
      const link = new SmartCityLink();
      link.source({ id: source.id });
      link.target({ id: target.id });
      link.attr({
        line: {
          stroke: color,
          strokeWidth: 3,
          targetMarker: {
            fill: color,
            stroke: color
          }
        }
      });
      link.addTo(graph);
      return link;
    };

    // Primary connections from hub to nodes
    createAnimatedLink(centralHub, carbonNode, '#06b6d4');
    createAnimatedLink(centralHub, maintenanceNode, '#f59e0b');
    createAnimatedLink(centralHub, greenNode, '#10b981');

    // Secondary connections showing data flow relationships
    const carbonToMaintenance = createAnimatedLink(carbonNode, maintenanceNode, '#8b5cf6');
    carbonToMaintenance.attr('line/strokeDasharray', '5,5');
    
    const maintenanceToGreen = createAnimatedLink(maintenanceNode, greenNode, '#ec4899');
    maintenanceToGreen.attr('line/strokeDasharray', '5,5');

    const greenToCarbon = createAnimatedLink(greenNode, carbonNode, '#14b8a6');
    greenToCarbon.attr('line/strokeDasharray', '5,5');

    // Enhanced click handling with improved UX
    paper.on('element:pointerclick', (cellView: any) => {
      const element = cellView.model;
      const nodeType = nodeTypeMap.current[element.id];
      
      if (nodeType && ['carbon', 'maintenance', 'green'].includes(nodeType)) {
        setOverlayPanel(nodeType as 'carbon' | 'maintenance' | 'green');
      }
    });

    // Enhanced hover effects
    paper.on('element:mouseenter', (cellView: any) => {
      const element = cellView.model;
      if (nodeTypeMap.current[element.id]) {
        element.attr('body/stroke-width', 4);
        element.attr('body/filter/args/blur', 8);
        element.transition('attrs/body/fill', '#1f2937', { duration: 200 });
      }
    });

    paper.on('element:mouseleave', (cellView: any) => {
      const element = cellView.model;
      if (nodeTypeMap.current[element.id]) {
        element.attr('body/stroke-width', 2);
        element.attr('body/filter/args/blur', 4);
        element.transition('attrs/body/fill', '#111827', { duration: 200 });
      }
    });

    return () => {
      if (paperRef.current) {
        paperRef.current.remove();
      }
    };
  }, []);

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
      }
    ];

    return baseMetrics;
  }, [metrics]);

  // Stable data generation function
  const generateTimeSeriesData = useCallback((metric: AnalyticsMetric, hours: number = 24) => {
    const data = [];
    const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(baseTime + (Date.now() % (24 * 60 * 60 * 1000)) - i * 60 * 60 * 1000);
      const baseValue = metric.value;
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
  }, []);

  // Enhanced content components for each system type
  const GreenEnergyContent = () => {
    if (!metrics) return null;
    
    const renewableProduction = metrics.energyConsumption * 0.65;
    const solarOutput = renewableProduction * 0.52;
    const windOutput = renewableProduction * 0.33;
    const hydroOutput = renewableProduction * 0.15;

    const energyMixData = [
      { name: 'Solar', value: solarOutput, fill: '#fbbf24' },
      { name: 'Wind', value: windOutput, fill: '#06b6d4' },
      { name: 'Hydro', value: hydroOutput, fill: '#3b82f6' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Renewable Energy Mix</h4>
            <div style={{ height: chartH }}>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={energyMixData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {energyMixData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>
          </div>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Energy Production Trends</h4>
            <div style={{ height: chartH }}>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateTimeSeriesData(analyticsMetrics[0], 12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={10} />
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
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={false}
                      name="Energy Output (MW)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-yellow-900/30 border border-yellow-500/40 rounded-lg p-4 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold text-yellow-400">{solarOutput.toFixed(1)} MW</div>
            <div className="text-sm text-yellow-300">Solar Production</div>
          </div>
          <div className="bg-cyan-900/30 border border-cyan-500/40 rounded-lg p-4 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold text-cyan-400">{windOutput.toFixed(1)} MW</div>
            <div className="text-sm text-cyan-300">Wind Production</div>
          </div>
          <div className="bg-blue-900/30 border border-blue-500/40 rounded-lg p-4 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold text-blue-400">{hydroOutput.toFixed(1)} MW</div>
            <div className="text-sm text-blue-300">Hydro Production</div>
          </div>
        </div>
      </div>
    );
  };

  const MaintenanceContent = () => {
    if (!metrics) return null;
    
    const maintenanceData = [
      { name: 'Scheduled', value: 18, fill: '#10b981' },
      { name: 'In Progress', value: 12, fill: '#f59e0b' },
      { name: 'Overdue', value: 4, fill: '#ef4444' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Maintenance Status</h4>
            <div style={{ height: chartH }}>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maintenanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#e5e7eb'
                      }}
                    />
                    <Bar dataKey="value" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>
          </div>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">System Health</h4>
            <div style={{ height: chartH }}>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" data={[{
                    name: 'Health',
                    value: 91,
                    fill: '#10b981'
                  }]}>
                    <RadialBar background dataKey="value" />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-white">
                      91%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">Recent Maintenance Activities</h4>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
              <div>
                <div className="font-medium text-white">Solar Panel Cleaning - Zone A</div>
                <div className="text-sm text-gray-400">Completed 1 hour ago</div>
              </div>
              <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">Complete</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
              <div>
                <div className="font-medium text-white">Wind Turbine Inspection - Unit 3</div>
                <div className="text-sm text-gray-400">In progress - 65% complete</div>
              </div>
              <span className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-full">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
              <div>
                <div className="font-medium text-white">Grid Connection Maintenance</div>
                <div className="text-sm text-gray-400">Scheduled for tomorrow 8:00 AM</div>
              </div>
              <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">Scheduled</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
              <div>
                <div className="font-medium text-white">Sensor Calibration - Environmental</div>
                <div className="text-sm text-gray-400">Overdue by 2 days</div>
              </div>
              <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full">Overdue</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CarbonEmissionsContent = () => {
    if (!metrics) return null;
    
    const emissionsData = [
      { name: 'Transportation', value: 38, fill: '#ef4444' },
      { name: 'Buildings', value: 31, fill: '#f59e0b' },
      { name: 'Industry', value: 19, fill: '#8b5cf6' },
      { name: 'Other', value: 12, fill: '#6b7280' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Emissions by Sector</h4>
            <div style={{ height: chartH }}>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emissionsData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {emissionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>
          </div>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Net Zero Progress</h4>
            <div style={{ height: chartH }}>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" data={[{
                    name: 'Progress',
                    value: 73,
                    fill: '#06b6d4'
                  }]}>
                    <RadialBar background dataKey="value" />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-white">
                      73%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-4 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold text-red-400">2.1M</div>
            <div className="text-sm text-red-300">Tons CO₂ This Year</div>
          </div>
          <div className="bg-green-900/30 border border-green-500/40 rounded-lg p-4 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold text-green-400">-15%</div>
            <div className="text-sm text-green-300">Reduction vs Last Year</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`improved-advanced-analytics ${className} h-full min-h-0 overflow-hidden flex flex-col`}>
      {/* Video Background */}
      <ContextualVideoBackground
        context="analytics"
        className="absolute inset-0 -z-10"
        overlayOpacity={0.88}
      />

      {/* Enhanced Header with Controls */}
      <div className="relative z-10 flex items-center justify-between mb-4 px-4 py-3 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-white">TruContext Advanced Analytics</h2>
          <p className="text-sm text-gray-300">Interactive Smart City Monitoring Dashboard</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className={`px-3 py-1 text-white text-sm rounded transition-colors ${
              isIsometric ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            onClick={() => setIsIsometric(!isIsometric)}
          >
            {isIsometric ? 'Flat View' : 'Isometric View'}
          </button>
          <button
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            onClick={() => setIsAnimating(!isAnimating)}
          >
            {isAnimating ? 'Pause' : 'Resume'} Animations
          </button>
          <button
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            onClick={() => addNotification({
              type: 'success',
              title: 'Dashboard Updated',
              message: 'Real-time data synchronized successfully'
            })}
          >
            Sync Data
          </button>
        </div>
      </div>

      {/* Enhanced Diagram Area with Isometric Support */}
      <div className="relative z-10 flex-1 flex overflow-hidden px-4 pb-4">
        <div 
          ref={diagramRef} 
          className={`flex-1 bg-gray-900/60 backdrop-blur-sm rounded-lg border border-gray-700 relative overflow-hidden transition-transform duration-500 ${
            isIsometric ? 'isometric-transform' : ''
          }`}
          style={{ minHeight: '500px' }}
        />
      </div>

      {/* Enhanced Modal System with Better UX */}
      <AnimatePresence>
        {overlayPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setOverlayPanel(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700 max-w-6xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h3 className="text-2xl font-bold text-white">
                  {overlayPanel === 'green' && 'Green Energy Systems'}
                  {overlayPanel === 'maintenance' && 'Maintenance Operations'}
                  {overlayPanel === 'carbon' && 'Carbon Emissions Monitoring'}
                </h3>
                <button
                  onClick={() => setOverlayPanel(null)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                {overlayPanel === 'green' && <GreenEnergyContent />}
                {overlayPanel === 'maintenance' && <MaintenanceContent />}
                {overlayPanel === 'carbon' && <CarbonEmissionsContent />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ImprovedAdvancedAnalytics;


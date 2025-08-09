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
import { ChartErrorBoundary } from './ErrorBoundary';
import type { AnalyticsMetric } from '../types/analytics';

interface EnhancedAdvancedAnalyticsProps {
  className?: string;
}

// Custom JointJS Elements for Smart City Components
class SmartCityHub extends joint.dia.Element {
  defaults() {
    return {
      // Explicit defaults (avoid spreading super.defaults to satisfy TS typings)
      type: 'smartcity.Hub',
      size: { width: 120, height: 120 },
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
            args: { dx: 2, dy: 2, blur: 4, color: 'rgba(0,0,0,0.3)' }
          },
          // Explicit geometry so the circle renders without relying on refs
          cx: 60,
          cy: 60,
          r: 60
        },
        label: {
          text: 'TruContext',
          fill: '#ffffff',
          fontSize: 12,
          fontWeight: 'bold',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          // Center label on the body
          ref: 'body',
          refX: '50%',
          refY: '50%'
        },
        statusRing: {
          fill: 'none',
          stroke: '#10b981',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          // Position the ring relative to the body circle
          ref: 'body',
          refR: '90%',
          refCx: '50%',
          refCy: '50%'
        },
        pulseRing: {
          // Static pulse ring positioned relative to the body
          ref: 'body',
          refR: '100%',
          refCx: '50%',
          refCy: '50%'
        }
      }
    };
  }

  preinitialize() {
    this.markup = joint.util.svg`
      <circle @selector="body" />
      <circle @selector="statusRing" />
      <text @selector="label" />
      <!-- Simplified pulse ring without calc() to avoid runtime errors -->
      <circle @selector="pulseRing" fill="none" stroke="#10b981" stroke-width="1" opacity="0.4">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
    `;
  }
}

class SmartCityNode extends joint.dia.Element {
  defaults() {
    return {
      // Explicit defaults (avoid spreading super.defaults to satisfy TS typings)
      type: 'smartcity.Node',
      nodeType: 'energy', // energy, transport, environment
      size: { width: 100, height: 80 },
      attrs: {
        body: {
          fill: '#111827',
          stroke: '#3b82f6',
          strokeWidth: 2,
          rx: 12,
          ry: 12,
          filter: {
            name: 'dropShadow',
            args: { dx: 1, dy: 1, blur: 3, color: 'rgba(0,0,0,0.4)' }
          },
          // Make rect follow element size
          refWidth: '100%',
          refHeight: '100%'
        },
        icon: {
          fill: '#60a5fa',
          fontSize: 24,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          ref: 'body',
          refX: '50%',
          refY: '50%',
          refDy: -10
        },
        label: {
          text: 'System',
          fill: '#e5e7eb',
          fontSize: 10,
          fontWeight: 600,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          ref: 'body',
          refX: '50%',
          refY: '50%',
          refDy: 15
        },
        statusIndicator: {
          fill: '#10b981',
          r: 4,
          ref: 'body',
          refCx: '100%',
          refCy: 0,
          refDx: -8,
          refDy: 8
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
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <!-- Removed flow line using calc() to avoid runtime errors -->
    `;
  }
}

// Animated Link with Data Flow
class SmartCityLink extends joint.dia.Link {
  defaults() {
    return {
      // Explicit defaults (avoid spreading super.defaults to satisfy TS typings)
      type: 'smartcity.Link',
      attrs: {
        line: {
          stroke: '#6b7280',
          strokeWidth: 3,
          strokeDasharray: '8,4',
          targetMarker: {
            type: 'path',
            d: 'M 8 0 L 0 4 L 8 8 z',
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
        <animate attributeName="stroke-dashoffset" values="0;12" dur="1.5s" repeatCount="indefinite"/>
      </path>
    `;
  }
}

export function EnhancedAdvancedAnalytics({ className = '' }: EnhancedAdvancedAnalyticsProps) {
  const { metrics } = useDataStore();
  const { addNotification } = useUIStore();

  // JointJS diagram reference and active panel state
  const diagramRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<joint.dia.Paper | null>(null);
  const graphRef = useRef<joint.dia.Graph | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  // Enhanced modal state for better visibility
  const [modalContent, setModalContent] = useState<{
    type: 'carbon' | 'maintenance' | 'green' | null;
    title: string;
    isOpen: boolean;
  }>({
    type: null,
    title: '',
    isOpen: false
  });

  const chartH = 200;

  // Initialize enhanced JointJS diagram
  useEffect(() => {
    const el = diagramRef.current;
    if (!el) return;

    // Force visible sizing on container and wrapper to avoid collapse
    try {
      el.style.minHeight = '420px';
      el.style.height = '100%';
      el.style.width = '100%';
      el.style.display = 'block';
      const wrapper = el.parentElement as HTMLElement | null;
      if (wrapper) {
        if (!wrapper.style.minHeight) wrapper.style.minHeight = '420px';
        if (!wrapper.style.height) wrapper.style.height = '100%';
        if (!wrapper.style.display) wrapper.style.display = 'flex';
        if (!wrapper.style.flex) wrapper.style.flex = '1 1 auto';
      }
    } catch {}

    // Clean up previous diagram
    if (paperRef.current) {
      // Paper typings may miss remove(); cast safely
      (paperRef.current as unknown as { remove?: () => void })?.remove?.();
      paperRef.current = null;
    }

    // Diagnostics
    const parent = el.parentElement as HTMLElement | null;
    console.log('[EnhancedAdvancedAnalytics] init diagram container size', {
      clientWidth: el.clientWidth,
      clientHeight: el.clientHeight,
      offsetWidth: el.offsetWidth,
      offsetHeight: el.offsetHeight
    });
    if (parent) {
      const pr = parent.getBoundingClientRect();
      console.log('[EnhancedAdvancedAnalytics] parent wrapper rect', { w: pr.width, h: pr.height, display: getComputedStyle(parent).display });
    }

    // Create namespace for custom elements
    const namespace = {
      smartcity: {
        Hub: SmartCityHub,
        Node: SmartCityNode,
        Link: SmartCityLink
      }
    };

    let rafId = 0 as number | any;
    let timeoutId = 0 as number | any;
    let rectLogger: any = null;

    const initWhenVisible = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        // Wait until container has non-zero size
        rafId = requestAnimationFrame(initWhenVisible);
        return;
      }

      const graph = new joint.dia.Graph({}, { cellNamespace: namespace });
      const paper = new joint.dia.Paper({
        el: el,
        model: graph,
        width: Math.max(300, rect.width),
        height: Math.max(300, rect.height),
        gridSize: 20,
        drawGrid: true,
        interactive: { linkMove: false },
        cellViewNamespace: namespace,
        background: { color: 'transparent' }
      });

      graphRef.current = graph;
      paperRef.current = paper;

      paper.on('render:done', () => {
        console.log('[EnhancedAdvancedAnalytics] paper render:done');
      });
      (paper as any).el?.addEventListener?.('click', () => {
        console.log('[EnhancedAdvancedAnalytics] paper DOM clicked');
      });

      console.log('[EnhancedAdvancedAnalytics] paper created with size', {
        width: paper.options.width,
        height: paper.options.height
      });

      // Adjust after layout settles
      const adjustDims = () => {
        const r = el.getBoundingClientRect();
        const w = Math.max(300, r.width || el.clientWidth || 800);
        const h = Math.max(300, r.height || el.clientHeight || 500);
        if ((paper as any).setDimensions) {
          (paper as any).setDimensions(w, h);
          console.log('[EnhancedAdvancedAnalytics] paper dimensions adjusted', { w, h });
        }
      };
      rafId = requestAnimationFrame(adjustDims);
      timeoutId = setTimeout(adjustDims, 75);

      // Log container rect a few times to detect layout shifts
      let t = 0;
      rectLogger = setInterval(() => {
        const r = el.getBoundingClientRect();
        console.log('[EnhancedAdvancedAnalytics] container rect tick', t, { w: r.width, h: r.height });
        t += 1;
        if (t > 10) clearInterval(rectLogger);
      }, 250);

      // Proceed with rest of the diagram setup (nodes/links and observers live below)
      continueSetup(graph, paper);
    };

    const continueSetup = (graph: joint.dia.Graph, paper: joint.dia.Paper) => {
      // Observe visibility and size changes for debugging
      const RO = (window as any).ResizeObserver;
      const IO = (window as any).IntersectionObserver;
      const MO = (window as any).MutationObserver;

      const ro = RO ? new RO((entries: any[]) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect || {};
          console.log('[EnhancedAdvancedAnalytics] ResizeObserver', { width, height });
          if (width && height && paperRef.current && (paperRef.current as any).setDimensions) {
            (paperRef.current as any).setDimensions(Math.max(300, width), Math.max(300, height));
          }
        }
      }) : null;
      try { ro && ro.observe(el); } catch {}

      const io = IO ? new IO((entries: any[]) => {
        for (const entry of entries) {
          console.log('[EnhancedAdvancedAnalytics] IntersectionObserver', {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio
          });
        }
      }, { threshold: [0, 0.01, 0.25, 0.5, 1] }) : null;
      try { io && io.observe(el); } catch {}

      const mo = MO ? new MO((mutations: any[]) => {
        for (const m of mutations) {
          if (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'style')) {
            console.log('[EnhancedAdvancedAnalytics] MutationObserver attr', {
              className: (el as HTMLElement).className,
              style: (el as HTMLElement).getAttribute('style')
            });
          }
        }
      }) : null;
      try { mo && mo.observe(el, { attributes: true }); } catch {}

      const onVisChange = () => {
        console.log('[EnhancedAdvancedAnalytics] document visibility', document.visibilityState);
      };
      document.addEventListener('visibilitychange', onVisChange);

      // Create diagram content
      const centralHub = new SmartCityHub();
      centralHub.position(340, 180);
      centralHub.addTo(graph);
      console.log('[EnhancedAdvancedAnalytics] centralHub added', centralHub.id);

      const energyNode = new SmartCityNode();
      (energyNode as unknown as { set: (key: string, val: any) => void }).set('nodeType', 'energy');
      energyNode.position(100, 300);
      energyNode.attr({
        icon: { text: '⚡' },
        label: { text: 'Green Energy' },
        body: { stroke: '#10b981' },
        statusIndicator: { fill: '#10b981' }
      });
      energyNode.addTo(graph);
      console.log('[EnhancedAdvancedAnalytics] energyNode added', energyNode.id);

      const maintenanceNode = new SmartCityNode();
      (maintenanceNode as unknown as { set: (key: string, val: any) => void }).set('nodeType', 'maintenance');
      maintenanceNode.position(340, 350);
      maintenanceNode.attr({
        icon: { text: '🔧' },
        label: { text: 'Maintenance' },
        body: { stroke: '#f59e0b' },
        statusIndicator: { fill: '#f59e0b' }
      });
      maintenanceNode.addTo(graph);
      console.log('[EnhancedAdvancedAnalytics] maintenanceNode added', maintenanceNode.id);

      const carbonNode = new SmartCityNode();
      (carbonNode as unknown as { set: (key: string, val: any) => void }).set('nodeType', 'carbon');
      carbonNode.position(580, 300);
      carbonNode.attr({
        icon: { text: '🌱' },
        label: { text: 'Carbon Emissions' },
        body: { stroke: '#06b6d4' },
        statusIndicator: { fill: '#06b6d4' }
      });
      carbonNode.addTo(graph);
      console.log('[EnhancedAdvancedAnalytics] carbonNode added', carbonNode.id);

      const createAnimatedLink = (source: joint.dia.Element, target: joint.dia.Element, color: string) => {
        const link = new SmartCityLink();
        link.source({ id: source.id });
        link.target({ id: target.id });
        link.attr({
          line: {
            stroke: color,
            strokeWidth: 2,
            targetMarker: {
              fill: color,
              stroke: color
            }
          }
        });
        link.addTo(graph);
        return link;
      };

      createAnimatedLink(centralHub, energyNode, '#10b981');
      createAnimatedLink(centralHub, maintenanceNode, '#f59e0b');
      createAnimatedLink(centralHub, carbonNode, '#06b6d4');
      console.log('[EnhancedAdvancedAnalytics] links created');

      // Interactions
      paper.on('element:pointerclick', (cellView: any) => {
        const element = cellView.model;
        const nodeType = element.get('nodeType');
        if (nodeType) {
          const titles = { energy: 'Green Energy Systems', maintenance: 'Maintenance Operations', carbon: 'Carbon Emissions Monitoring' } as const;
          setModalContent({ type: nodeType as 'carbon' | 'maintenance' | 'green', title: titles[nodeType as keyof typeof titles] || 'System Details', isOpen: true });
        }
      });
      paper.on('element:mouseenter', (cellView: any) => {
        const element = cellView.model;
        if (element.get('nodeType')) {
          element.attr('body/stroke-width', 3);
          element.attr('body/filter/args/blur', 6);
        }
      });
      paper.on('element:mouseleave', (cellView: any) => {
        const element = cellView.model;
        if (element.get('nodeType')) {
          element.attr('body/stroke-width', 2);
          element.attr('body/filter/args/blur', 3);
        }
      });

      // Teardown hook
      cleanupFns.push(() => {
        try { ro && ro.disconnect && ro.disconnect(); } catch {}
        try { io && io.disconnect && io.disconnect(); } catch {}
        try { mo && mo.disconnect && mo.disconnect(); } catch {}
        document.removeEventListener('visibilitychange', onVisChange);
      });
    };

    const cleanupFns: Array<() => void> = [];
    rafId = requestAnimationFrame(initWhenVisible);

    // The rest of the setup occurs in continueSetup once the container is measurable

    return () => {
      if (paperRef.current) {
        (paperRef.current as unknown as { remove?: () => void })?.remove?.();
        paperRef.current = null;
      }
      try { rectLogger && clearInterval(rectLogger); } catch {}
      try { rafId && cancelAnimationFrame(rafId); } catch {}
      try { timeoutId && clearTimeout(timeoutId); } catch {}
      try { cleanupFns.forEach(fn => fn()); } catch {}
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

  // Enhanced modal close handler
  const closeModal = () => {
    setModalContent({
      type: null,
      title: '',
      isOpen: false
    });
  };

  // Enhanced content components for each system type
  const GreenEnergyContent = () => {
    if (!metrics) return null;
    
    const renewableProduction = metrics.energyConsumption * 0.6;
    const solarOutput = renewableProduction * 0.5;
    const windOutput = renewableProduction * 0.35;
    const hydroOutput = renewableProduction * 0.15;

    const energyMixData = [
      { name: 'Solar', value: solarOutput, fill: '#fbbf24' },
      { name: 'Wind', value: windOutput, fill: '#06b6d4' },
      { name: 'Hydro', value: hydroOutput, fill: '#3b82f6' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Renewable Energy Mix</h4>
            <div style={{ height: chartH }}>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={energyMixData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(((percent ?? 0) * 100)).toFixed(0)}%`}
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

          <div className="bg-gray-800 rounded-lg p-4">
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
                      strokeWidth={2} 
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
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{solarOutput.toFixed(1)} MW</div>
            <div className="text-sm text-yellow-300">Solar Production</div>
          </div>
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{windOutput.toFixed(1)} MW</div>
            <div className="text-sm text-cyan-300">Wind Production</div>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
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
      { name: 'Scheduled', value: 15, fill: '#10b981' },
      { name: 'In Progress', value: 8, fill: '#f59e0b' },
      { name: 'Overdue', value: 3, fill: '#ef4444' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-4">
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

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">System Health</h4>
            <div style={{ height: chartH }}>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" data={[{
                    name: 'Health',
                    value: 87,
                    fill: '#10b981'
                  }]}>
                    <RadialBar background dataKey="value" />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-white">
                      87%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-4">Recent Maintenance Activities</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <div>
                <div className="font-medium text-white">Solar Panel Cleaning - Zone A</div>
                <div className="text-sm text-gray-400">Completed 2 hours ago</div>
              </div>
              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Complete</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <div>
                <div className="font-medium text-white">Wind Turbine Inspection - Unit 3</div>
                <div className="text-sm text-gray-400">In progress</div>
              </div>
              <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <div>
                <div className="font-medium text-white">Grid Connection Maintenance</div>
                <div className="text-sm text-gray-400">Scheduled for tomorrow</div>
              </div>
              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Scheduled</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CarbonEmissionsContent = () => {
    if (!metrics) return null;
    
    const emissionsData = [
      { name: 'Transportation', value: 35, fill: '#ef4444' },
      { name: 'Buildings', value: 28, fill: '#f59e0b' },
      { name: 'Industry', value: 22, fill: '#8b5cf6' },
      { name: 'Other', value: 15, fill: '#6b7280' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Emissions by Sector</h4>
            <div style={{ height: chartH }}>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emissionsData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(((percent ?? 0) * 100)).toFixed(0)}%`}
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

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Net Zero Progress</h4>
            <div style={{ height: chartH }}>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" data={[{
                    name: 'Progress',
                    value: 68,
                    fill: '#06b6d4'
                  }]}>
                    <RadialBar background dataKey="value" />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-white">
                      68%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">2.4M</div>
            <div className="text-sm text-red-300">Tons CO₂ This Year</div>
          </div>
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">-12%</div>
            <div className="text-sm text-green-300">Reduction vs Last Year</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`enhanced-advanced-analytics ${className} relative isolate flex-1 min-h-0 overflow-hidden flex flex-col`}
      style={{ height: 'calc(100vh - 120px)', minHeight: 500 }}
    >
      {/* Temporarily disable video background to avoid overlay/z-index issues */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0b1220 100%)'
        }}
      />

      {/* Enhanced Header */}
      <div className="relative z-10 flex items-center justify-between mb-4 px-4 py-3 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-white">TruContext Advanced Analytics</h2>
          <p className="text-sm text-gray-300">Interactive Smart City Monitoring Dashboard</p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Enhanced Diagram Area */}
      <div className="relative z-10 flex-1 min-h-0 flex overflow-hidden px-4 pb-4" id="enhanced-analytics-diagram-wrapper">
        <div
          ref={diagramRef}
          className="flex-1 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700 relative overflow-hidden"
          style={{ minHeight: '420px', position: 'relative' }}
        />
      </div>

      {/* Enhanced Modal System */}
      <AnimatePresence>
        {modalContent.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h3 className="text-xl font-bold text-white">{modalContent.title}</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                {modalContent.type === 'green' && <GreenEnergyContent />}
                {modalContent.type === 'maintenance' && <MaintenanceContent />}
                {modalContent.type === 'carbon' && <CarbonEmissionsContent />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EnhancedAdvancedAnalytics;


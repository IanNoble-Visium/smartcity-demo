// TruContext Smart City Mock Data Service
import { useState, useEffect, useMemo } from "react";
import type { 
  Metrics, 
  Alert, 
  Incident, 
  NetworkTopology, 
  AlertSeverity, 
  AlertCategory,
  IncidentType,
  IncidentStatus,
  NodeType,
  NodeStatus,
  GeoLocation
} from "../types";

// Baltimore coordinates for realistic location data
const BALTIMORE_CENTER: GeoLocation = {
  latitude: 39.2904,
  longitude: -76.6122,
  address: "Baltimore, MD"
};

// Utility functions
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function nearbyLocation(center: GeoLocation, radiusKm: number = 5): GeoLocation {
  const radiusInDegrees = radiusKm / 111; // Rough conversion
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;
  
  return {
    latitude: center.latitude + distance * Math.cos(angle),
    longitude: center.longitude + distance * Math.sin(angle)
  };
}

// Mock data generators
class MockDataGenerator {
  private tick = 0;
  private alertHistory: Alert[] = [];
  private incidentHistory: Incident[] = [];
  private networkNodes: NetworkTopology['nodes'] = [];
  
  constructor() {
    this.initializeNetwork();
  }

  private initializeNetwork() {
    const nodeTypes: NodeType[] = ['router', 'switch', 'firewall', 'sensor', 'camera', 'server', 'controller', 'gateway'];
    const zones = ['downtown', 'harbor', 'university', 'industrial', 'residential'];
    
    this.networkNodes = Array.from({ length: 25 }, (_, i) => {
      const type = randomChoice(nodeTypes);
      const zone = randomChoice(zones);
      
      return {
        id: `node-${i.toString().padStart(3, '0')}`,
        label: `${type.toUpperCase()}-${zone.toUpperCase()}-${i.toString().padStart(2, '0')}`,
        type,
        status: randomChoice(['online', 'online', 'online', 'warning', 'critical'] as NodeStatus[]),
        location: nearbyLocation(BALTIMORE_CENTER, 10),
        properties: {
          zone,
          vendor: randomChoice(['Cisco', 'Juniper', 'Fortinet', 'Palo Alto', 'Aruba']),
          model: `Model-${Math.floor(Math.random() * 1000)}`,
          firmware: `v${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
          installDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        metrics: {
          cpuUsage: randomBetween(10, 90),
          memoryUsage: randomBetween(20, 85),
          bandwidth: randomBetween(100, 10000),
          temperature: randomBetween(25, 75),
          uptime: randomBetween(1, 365) * 24 * 60, // minutes
          errorRate: randomBetween(0, 5)
        }
      };
    });
  }

  updateTick() {
    this.tick++;
  }

  generateMetrics(): Metrics {
    const timeOfDay = new Date().getHours();
    const isBusinessHours = timeOfDay >= 8 && timeOfDay <= 18;
    const isRushHour = (timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 19);
    
    // Simulate realistic patterns
    const baseEnergy = isBusinessHours ? 75 : 45;
    const baseTraffic = isRushHour ? 0.85 : (isBusinessHours ? 0.65 : 0.35);
    const baseAirQuality = isRushHour ? 65 : 45;
    
    return {
      timestamp: new Date().toISOString(),
      energyConsumption: baseEnergy + randomBetween(-8, 12) + Math.sin(this.tick * 0.1) * 5,
      trafficFlow: Math.max(0, Math.min(1, baseTraffic + randomBetween(-0.15, 0.15) + Math.sin(this.tick * 0.05) * 0.1)),
      airQuality: Math.max(0, baseAirQuality + randomBetween(-15, 20) + Math.sin(this.tick * 0.08) * 8),
      infrastructureHealth: Math.max(0.7, Math.min(1, 0.94 + randomBetween(-0.05, 0.03) + Math.sin(this.tick * 0.02) * 0.02)),
      networkLatency: randomBetween(5, 50) + (this.tick % 10 === 0 ? randomBetween(50, 200) : 0),
      securityScore: Math.max(0.6, Math.min(1, 0.87 + randomBetween(-0.1, 0.05))),
      citizenSatisfaction: Math.max(0.5, Math.min(1, 0.78 + randomBetween(-0.08, 0.12))),
      budgetUtilization: Math.max(0, Math.min(1, 0.67 + randomBetween(-0.05, 0.15)))
    };
  }

  generateAlert(): Alert | null {
    // Generate alerts based on probability (roughly every 3-5 ticks)
    if (Math.random() > 0.25) return null;
    
    const severities: AlertSeverity[] = ['info', 'low', 'medium', 'high', 'critical'];
    const categories: AlertCategory[] = ['cybersecurity', 'infrastructure', 'traffic', 'energy', 'environmental', 'public_safety', 'network'];
    
    const severity = randomChoice(severities);
    const category = randomChoice(categories);
    
    const alertTemplates = {
      cybersecurity: [
        'Suspicious login attempts detected',
        'Malware signature detected in network traffic',
        'Unusual data exfiltration pattern observed',
        'Failed authentication spike on critical system',
        'Potential DDoS attack in progress'
      ],
      infrastructure: [
        'Power grid voltage fluctuation detected',
        'Water pressure anomaly in distribution system',
        'Bridge sensor reporting structural stress',
        'Traffic light controller offline',
        'Emergency communication system degraded'
      ],
      traffic: [
        'Heavy congestion on major arterial',
        'Traffic signal timing optimization needed',
        'Parking utilization exceeding capacity',
        'Public transit delay cascading',
        'Emergency vehicle route blocked'
      ],
      energy: [
        'Smart meter reporting consumption spike',
        'Renewable energy generation below forecast',
        'Grid load balancing required',
        'Transformer temperature warning',
        'Energy storage system capacity low'
      ],
      environmental: [
        'Air quality index exceeding healthy levels',
        'Noise pollution threshold exceeded',
        'Water quality sensor anomaly',
        'Weather station reporting severe conditions',
        'Flood sensor activation in low-lying area'
      ],
      public_safety: [
        'Emergency call volume spike detected',
        'Crowd density exceeding safe levels',
        'Gunshot detection system activated',
        'Missing person alert issued',
        'Public event security perimeter breach'
      ],
      network: [
        'Network latency exceeding SLA threshold',
        'Bandwidth utilization critical',
        'Router failover event occurred',
        'Fiber optic cable signal degradation',
        'Wireless access point offline'
      ]
    };
    
    const title = randomChoice(alertTemplates[category]);
    const location = nearbyLocation(BALTIMORE_CENTER, 15);
    
    const alert: Alert = {
      id: generateId('alert'),
      timestamp: new Date().toISOString(),
      severity,
      category,
      title,
      description: `${title} - Automated detection system flagged this event for review. Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      source: `${category.toUpperCase()}_MONITOR`,
      location,
      affectedAssets: [
        `asset-${Math.floor(Math.random() * 100)}`,
        `system-${Math.floor(Math.random() * 50)}`
      ],
      mitreTactics: category === 'cybersecurity' ? [
        randomChoice(['initial-access', 'execution', 'persistence', 'privilege-escalation', 'defense-evasion'])
      ] : undefined,
      correlationId: Math.random() > 0.7 ? generateId('corr') : undefined,
      status: 'open',
      escalationLevel: severity === 'critical' ? 3 : severity === 'high' ? 2 : 1,
      slaDeadline: addMinutes(new Date(), severity === 'critical' ? 15 : severity === 'high' ? 60 : 240).toISOString(),
      tags: [category, severity, 'automated']
    };
    
    this.alertHistory.unshift(alert);
    this.alertHistory = this.alertHistory.slice(0, 50); // Keep last 50 alerts
    
    return alert;
  }

  generateIncident(): Incident | null {
    // Generate incidents less frequently (roughly every 20-30 ticks)
    if (Math.random() > 0.05) return null;
    
    const types: IncidentType[] = ['cyber_attack', 'infrastructure_failure', 'traffic_accident', 'power_outage', 'environmental_hazard', 'public_safety', 'network_outage'];
    const statuses: IncidentStatus[] = ['reported', 'investigating', 'responding', 'mitigating'];
    
    const type = randomChoice(types);
    const severity = randomChoice(['low', 'medium', 'high', 'critical'] as AlertSeverity[]);
    const status = randomChoice(statuses);
    const location = nearbyLocation(BALTIMORE_CENTER, 20);
    
    const incidentTemplates = {
      cyber_attack: 'Advanced persistent threat detected targeting critical infrastructure systems',
      infrastructure_failure: 'Critical infrastructure component failure affecting city services',
      traffic_accident: 'Multi-vehicle collision causing major traffic disruption',
      power_outage: 'Electrical grid failure affecting multiple city blocks',
      environmental_hazard: 'Environmental contamination detected requiring immediate response',
      public_safety: 'Public safety incident requiring coordinated emergency response',
      network_outage: 'Network infrastructure failure affecting city communications'
    };
    
    const incident: Incident = {
      id: generateId('inc'),
      type,
      severity,
      status,
      location,
      startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Within last hour
      summary: incidentTemplates[type],
      description: `${incidentTemplates[type]}. Incident detected at ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}. Response teams have been notified and are coordinating appropriate action.`,
      affectedSystems: [
        `system-${Math.floor(Math.random() * 20)}`,
        `network-${Math.floor(Math.random() * 10)}`
      ],
      responders: [
        `responder-${Math.floor(Math.random() * 50)}`,
        `team-${Math.floor(Math.random() * 10)}`
      ],
      timeline: [
        {
          timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString(),
          actor: 'SYSTEM',
          action: 'INCIDENT_DETECTED',
          details: 'Automated monitoring system detected anomalous conditions'
        },
        {
          timestamp: new Date(Date.now() - Math.random() * 900000).toISOString(),
          actor: 'DISPATCHER',
          action: 'RESPONSE_INITIATED',
          details: 'Emergency response teams dispatched to incident location'
        }
      ],
      evidence: [],
      cost: severity === 'critical' ? randomBetween(50000, 500000) : 
             severity === 'high' ? randomBetween(10000, 100000) : 
             randomBetween(1000, 25000)
    };
    
    this.incidentHistory.unshift(incident);
    this.incidentHistory = this.incidentHistory.slice(0, 20); // Keep last 20 incidents
    
    return incident;
  }

  generateNetworkTopology(): NetworkTopology {
    // Update node metrics
    this.networkNodes.forEach(node => {
      node.metrics = {
        cpuUsage: Math.max(0, Math.min(100, (node.metrics.cpuUsage || 50) + randomBetween(-5, 5))),
        memoryUsage: Math.max(0, Math.min(100, (node.metrics.memoryUsage || 50) + randomBetween(-3, 3))),
        bandwidth: Math.max(0, (node.metrics.bandwidth || 1000) + randomBetween(-100, 100)),
        temperature: Math.max(0, Math.min(100, (node.metrics.temperature || 40) + randomBetween(-2, 2))),
        uptime: (node.metrics.uptime || 0) + 1, // Increment uptime
        errorRate: Math.max(0, (node.metrics.errorRate || 0) + randomBetween(-0.5, 0.5))
      };
      
      // Occasionally change node status
      if (Math.random() < 0.02) {
        node.status = randomChoice(['online', 'warning', 'critical'] as NodeStatus[]);
      }
    });
    
    // Generate edges based on network topology patterns
    const edges = [];
    for (let i = 0; i < this.networkNodes.length; i++) {
      const connectionsCount = Math.floor(randomBetween(1, 4));
      for (let j = 0; j < connectionsCount; j++) {
        const targetIndex = Math.floor(Math.random() * this.networkNodes.length);
        if (targetIndex !== i) {
          edges.push({
            id: `edge-${i}-${targetIndex}`,
            source: this.networkNodes[i].id,
            target: this.networkNodes[targetIndex].id,
            type: randomChoice(['ethernet', 'fiber', 'wireless'] as const),
            bandwidth: randomBetween(100, 10000),
            latency: randomBetween(1, 50),
            utilization: randomBetween(0.1, 0.9),
            status: randomChoice(['up', 'up', 'up', 'degraded'] as const)
          });
        }
      }
    }
    
    return {
      nodes: this.networkNodes,
      edges,
      lastUpdated: new Date().toISOString()
    };
  }

  getAlertHistory(): Alert[] {
    return this.alertHistory;
  }

  getIncidentHistory(): Incident[] {
    return this.incidentHistory;
  }
}

// Hook for consuming mock data
export function useMockRealtime() {
  const [generator] = useState(() => new MockDataGenerator());
  const [tick, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      generator.updateTick();
      setTick(t => t + 1);
    }, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, [generator]);

  const metrics = useMemo(() => generator.generateMetrics(), [generator, tick]);
  const newAlert = useMemo(() => generator.generateAlert(), [generator, tick]);
  const newIncident = useMemo(() => generator.generateIncident(), [generator, tick]);
  const topology = useMemo(() => generator.generateNetworkTopology(), [generator, tick]);
  
  const alerts = useMemo(() => generator.getAlertHistory(), [generator, tick]);
  const incidents = useMemo(() => generator.getIncidentHistory(), [generator, tick]);

  return {
    metrics,
    alerts,
    incidents,
    topology,
    newAlert,
    newIncident,
    isConnected: true,
    lastUpdated: new Date().toISOString()
  };
}
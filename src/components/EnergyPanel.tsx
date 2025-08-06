import { useState, useEffect } from 'react';
import type { Metrics } from '../types';

interface EnergySource {
  id: string;
  name: string;
  type: 'solar' | 'wind' | 'hydro' | 'nuclear' | 'gas' | 'coal' | 'battery';
  capacity: number;
  currentOutput: number;
  efficiency: number;
  status: 'online' | 'offline' | 'maintenance' | 'warning';
  carbonIntensity: number; // kg CO2/MWh
}

interface EnergyDemand {
  residential: number;
  commercial: number;
  industrial: number;
  transportation: number;
  municipal: number;
}

interface GridMetrics {
  frequency: number;
  voltage: number;
  powerFactor: number;
  harmonics: number;
  stability: number;
}

const mockEnergySources: EnergySource[] = [
  { id: 'solar-1', name: 'Downtown Solar Farm', type: 'solar', capacity: 25, currentOutput: 18.5, efficiency: 0.74, status: 'online', carbonIntensity: 0 },
  { id: 'wind-1', name: 'Harbor Wind Farm', type: 'wind', capacity: 45, currentOutput: 32.1, efficiency: 0.71, status: 'online', carbonIntensity: 0 },
  { id: 'nuclear-1', name: 'Calvert Cliffs', type: 'nuclear', capacity: 850, currentOutput: 820, efficiency: 0.96, status: 'online', carbonIntensity: 12 },
  { id: 'gas-1', name: 'Peaker Plant A', type: 'gas', capacity: 120, currentOutput: 45, efficiency: 0.38, status: 'online', carbonIntensity: 490 },
  { id: 'battery-1', name: 'Grid Storage', type: 'battery', capacity: 50, currentOutput: -15, efficiency: 0.85, status: 'online', carbonIntensity: 0 }
];

function EnergySourceCard({ source }: { source: EnergySource }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'status-success';
      case 'warning': return 'status-warning';
      case 'maintenance': return 'status-info';
      default: return 'status-critical';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'solar': return '☀️';
      case 'wind': return '🌬️';
      case 'hydro': return '💧';
      case 'nuclear': return '⚜️';
      case 'gas': return '🔥';
      case 'coal': return '⚫';
      case 'battery': return '🔋';
      default: return '⚡';
    }
  };

  const utilizationPercent = (Math.abs(source.currentOutput) / source.capacity) * 100;
  const isCharging = source.currentOutput < 0;

  return (
    <div className="bg-tertiary rounded-lg p-3 border border-accent">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon(source.type)}</span>
          <div>
            <div className="font-medium text-sm">{source.name}</div>
            <div className="text-xs text-muted capitalize">{source.type}</div>
          </div>
        </div>
        <span className={`status-indicator ${getStatusColor(source.status)} text-xs`}>
          {source.status.toUpperCase()}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-secondary">Output:</span>
          <span className={isCharging ? 'text-info' : 'text-primary'}>
            {isCharging ? 'Charging' : 'Generating'} {Math.abs(source.currentOutput).toFixed(1)} MW
          </span>
        </div>
        
        <div className="w-full bg-accent rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all ${
              isCharging ? 'bg-info' : 
              source.type === 'solar' || source.type === 'wind' ? 'bg-success' : 
              source.type === 'nuclear' ? 'bg-info' : 'bg-warning'
            }`}
            style={{ width: `${Math.min(100, utilizationPercent)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-secondary">Efficiency:</span>
          <span>{(source.efficiency * 100).toFixed(0)}%</span>
        </div>
        
        {source.carbonIntensity > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-secondary">Carbon:</span>
            <span className="text-warning">{source.carbonIntensity} kg/MWh</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DemandChart({ demand }: { demand: EnergyDemand }) {
  const total = Object.values(demand).reduce((sum, val) => sum + val, 0);
  
  const sectors = [
    { name: 'Residential', value: demand.residential, color: 'bg-blue' },
    { name: 'Commercial', value: demand.commercial, color: 'bg-green' },
    { name: 'Industrial', value: demand.industrial, color: 'bg-yellow' },
    { name: 'Transport', value: demand.transportation, color: 'bg-purple' },
    { name: 'Municipal', value: demand.municipal, color: 'bg-red' }
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Demand by Sector</h4>
      <div className="space-y-2">
        {sectors.map(sector => {
          const percentage = (sector.value / total) * 100;
          return (
            <div key={sector.name} className="flex items-center gap-3">
              <div className="w-20 text-xs text-secondary">{sector.name}</div>
              <div className="flex-1 bg-accent rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${sector.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-12 text-xs text-right">{sector.value.toFixed(0)} MW</div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-secondary text-center pt-2 border-t border-accent">
        Total Demand: {total.toFixed(1)} MW
      </div>
    </div>
  );
}

function GridHealth({ metrics }: { metrics: GridMetrics }) {
  const getHealthColor = (value: number, optimal: number, tolerance: number) => {
    const deviation = Math.abs(value - optimal) / optimal;
    if (deviation < tolerance * 0.5) return 'text-success';
    if (deviation < tolerance) return 'text-warning';
    return 'text-critical';
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Grid Health</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className={`text-lg font-semibold ${getHealthColor(metrics.frequency, 60, 0.02)}`}>
            {metrics.frequency.toFixed(2)} Hz
          </div>
          <div className="text-xs text-secondary">Frequency</div>
        </div>
        
        <div className="text-center">
          <div className={`text-lg font-semibold ${getHealthColor(metrics.voltage, 120, 0.05)}`}>
            {metrics.voltage.toFixed(1)} kV
          </div>
          <div className="text-xs text-secondary">Voltage</div>
        </div>
        
        <div className="text-center">
          <div className={`text-lg font-semibold ${getHealthColor(metrics.powerFactor, 0.95, 0.1)}`}>
            {metrics.powerFactor.toFixed(2)}
          </div>
          <div className="text-xs text-secondary">Power Factor</div>
        </div>
        
        <div className="text-center">
          <div className={`text-lg font-semibold ${metrics.stability > 0.9 ? 'text-success' : 'text-warning'}`}>
            {(metrics.stability * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-secondary">Stability</div>
        </div>
      </div>
    </div>
  );
}

export function EnergyPanel({ metrics }: { metrics: Metrics | null }) {
  const [energySources, setEnergySources] = useState<EnergySource[]>(mockEnergySources);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'sources' | 'demand' | 'grid'>('overview');
  
  const mockDemand: EnergyDemand = {
    residential: 180,
    commercial: 145,
    industrial: 220,
    transportation: 85,
    municipal: 45
  };
  
  const mockGridMetrics: GridMetrics = {
    frequency: 59.98,
    voltage: 118.5,
    powerFactor: 0.92,
    harmonics: 3.2,
    stability: 0.94
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergySources(prev => prev.map(source => ({
        ...source,
        currentOutput: source.capacity * (0.3 + Math.random() * 0.6) * (source.type === 'battery' ? (Math.random() > 0.5 ? -1 : 1) : 1),
        efficiency: Math.max(0.2, source.efficiency + (Math.random() - 0.5) * 0.05)
      })));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted">
          <div className="text-2xl mb-2">⚡</div>
          <p>Loading energy data...</p>
        </div>
      </div>
    );
  }

  const totalGeneration = energySources.reduce((sum, source) => sum + Math.max(0, source.currentOutput), 0);
  const totalDemand = Object.values(mockDemand).reduce((sum, val) => sum + val, 0);
  const renewableOutput = energySources
    .filter(s => ['solar', 'wind', 'hydro'].includes(s.type))
    .reduce((sum, source) => sum + Math.max(0, source.currentOutput), 0);
  const renewablePercent = (renewableOutput / totalGeneration) * 100;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'sources', label: 'Sources', icon: '⚡' },
    { id: 'demand', label: 'Demand', icon: '🏢' },
    { id: 'grid', label: 'Grid', icon: '🌐' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-accent pb-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Energy Management</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="status-indicator status-success">Grid Stable</span>
            <span className="text-muted">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors ${
                selectedTab === tab.id 
                  ? 'bg-accent text-primary' 
                  : 'text-secondary hover:text-primary hover:bg-accent/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {selectedTab === 'overview' && (
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{totalGeneration.toFixed(0)}</div>
                <div className="text-xs text-secondary">MW Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-info">{totalDemand.toFixed(0)}</div>
                <div className="text-xs text-secondary">MW Demand</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{renewablePercent.toFixed(0)}%</div>
                <div className="text-xs text-secondary">Renewable</div>
              </div>
            </div>
            
            {/* Supply vs Demand */}
            <div>
              <h4 className="font-medium text-sm mb-2">Supply vs Demand</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-secondary">Supply</span>
                  <div className="flex-1 bg-accent rounded-full h-3">
                    <div 
                      className="bg-success h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (totalGeneration / Math.max(totalGeneration, totalDemand)) * 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-xs text-right">{totalGeneration.toFixed(0)} MW</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-secondary">Demand</span>
                  <div className="flex-1 bg-accent rounded-full h-3">
                    <div 
                      className="bg-info h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (totalDemand / Math.max(totalGeneration, totalDemand)) * 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-xs text-right">{totalDemand.toFixed(0)} MW</span>
                </div>
              </div>
              
              <div className="text-xs text-center mt-2 text-secondary">
                Reserve Margin: {((totalGeneration - totalDemand) / totalDemand * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}
        
        {selectedTab === 'sources' && (
          <div className="grid grid-cols-1 gap-3">
            {energySources.map(source => (
              <EnergySourceCard key={source.id} source={source} />
            ))}
          </div>
        )}
        
        {selectedTab === 'demand' && (
          <DemandChart demand={mockDemand} />
        )}
        
        {selectedTab === 'grid' && (
          <GridHealth metrics={mockGridMetrics} />
        )}
      </div>
    </div>
  );
}
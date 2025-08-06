import { useState, useEffect } from 'react';
import type { Incident } from '../types';
import { MapErrorBoundary } from './ErrorBoundary';

interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'incidents' | 'infrastructure' | 'traffic' | 'environmental' | 'security';
  color: string;
}

interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

const defaultLayers: MapLayer[] = [
  { id: 'incidents', name: 'Active Incidents', visible: true, type: 'incidents', color: '#EF4444' },
  { id: 'infrastructure', name: 'Critical Infrastructure', visible: true, type: 'infrastructure', color: '#8B5CF6' },
  { id: 'traffic', name: 'Traffic Flow', visible: false, type: 'traffic', color: '#F59E0B' },
  { id: 'environmental', name: 'Environmental Sensors', visible: false, type: 'environmental', color: '#10B981' },
  { id: 'security', name: 'Security Cameras', visible: false, type: 'security', color: '#3B82F6' }
];

const baltimoreViewport: MapViewport = {
  latitude: 39.2904,
  longitude: -76.6122,
  zoom: 11,
  bearing: 0,
  pitch: 45
};

function IncidentMarker({ incident, onClick }: { incident: Incident; onClick: () => void }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-critical border-critical';
      case 'high': return 'bg-alert border-alert';
      case 'medium': return 'bg-warning border-warning';
      default: return 'bg-info border-info';
    }
  };

  return (
    <div 
      className={`absolute w-4 h-4 rounded-full border-2 cursor-pointer transform -translate-x-2 -translate-y-2 animate-pulse hover:scale-125 transition-transform ${
        getSeverityColor(incident.severity)
      }`}
      style={{
        left: `${50 + (incident.location.longitude + 76.6122) * 100}%`,
        top: `${50 - (incident.location.latitude - 39.2904) * 100}%`
      }}
      onClick={onClick}
      title={`${incident.type}: ${incident.description}`}
    />
  );
}

function LayerControl({ layers, onToggleLayer }: { layers: MapLayer[]; onToggleLayer: (id: string) => void }) {
  return (
    <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm rounded-lg p-3 min-w-48">
      <h4 className="font-medium mb-2 text-sm">Map Layers</h4>
      <div className="space-y-2">
        {layers.map(layer => (
          <label key={layer.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-accent/50 p-1 rounded">
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => onToggleLayer(layer.id)}
              className="w-3 h-3"
            />
            <div 
              className="w-3 h-3 rounded-full border"
              style={{ backgroundColor: layer.color, borderColor: layer.color }}
            />
            <span>{layer.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function MapControls({ viewport, onViewportChange }: { 
  viewport: MapViewport; 
  onViewportChange: (viewport: MapViewport) => void; 
}) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
      <div className="bg-primary/90 backdrop-blur-sm rounded-lg p-2">
        <div className="flex flex-col gap-1">
          <button 
            className="btn btn-ghost text-xs p-1"
            onClick={() => onViewportChange({ ...viewport, zoom: Math.min(viewport.zoom + 1, 18) })}
          >
            +
          </button>
          <button 
            className="btn btn-ghost text-xs p-1"
            onClick={() => onViewportChange({ ...viewport, zoom: Math.max(viewport.zoom - 1, 8) })}
          >
            -
          </button>
        </div>
      </div>
      
      <div className="bg-primary/90 backdrop-blur-sm rounded-lg p-2">
        <button 
          className="btn btn-ghost text-xs"
          onClick={() => onViewportChange({ ...baltimoreViewport, pitch: viewport.pitch === 0 ? 45 : 0 })}
        >
          {viewport.pitch === 0 ? '3D' : '2D'}
        </button>
      </div>
    </div>
  );
}

export function LiveMap({ incidents }: { incidents: Incident[] }) {
  const [layers, setLayers] = useState<MapLayer[]>(defaultLayers);
  const [viewport, setViewport] = useState<MapViewport>(baltimoreViewport);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const visibleIncidents = incidents.filter(() => 
    layers.find(l => l.id === 'incidents')?.visible
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted">
          <div className="animate-spin text-2xl mb-2">🌐</div>
          <p>Loading city map...</p>
          <p className="text-xs mt-1">Initializing geospatial services</p>
        </div>
      </div>
    );
  }

  return (
    <MapErrorBoundary>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-accent pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Live City Map</h3>
              <p className="text-xs text-secondary">Baltimore Metropolitan Area</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="status-indicator status-success">Online</span>
              <span className="text-muted">Zoom: {viewport.zoom.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-green-900/30"></div>
          {/* Grid overlay to simulate map tiles */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="absolute border-t border-accent" style={{ top: `${i * 5}%`, width: '100%' }} />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="absolute border-l border-accent" style={{ left: `${i * 5}%`, height: '100%' }} />
            ))}
          </div>
        </div>

        {/* City Features Simulation */}
        <div className="absolute inset-0">
          {/* Major roads */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-yellow/30 transform -rotate-12"></div>
          <div className="absolute top-1/3 left-0 w-full h-0.5 bg-yellow/30 transform rotate-12"></div>
          
          {/* Harbor area */}
          <div className="absolute bottom-0 right-0 w-1/3 h-1/4 bg-blue/20 rounded-tl-full"></div>
          
          {/* Downtown core */}
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white/10 rounded transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Incident Markers */}
        {visibleIncidents.map(incident => (
          <IncidentMarker
            key={incident.id}
            incident={incident}
            onClick={() => setSelectedIncident(incident)}
          />
        ))}

        {/* Map Controls */}
        <LayerControl layers={layers} onToggleLayer={toggleLayer} />
        <MapControls viewport={viewport} onViewportChange={setViewport} />

        {/* Status Overlay */}
        <div className="absolute bottom-4 left-4 bg-primary/90 backdrop-blur-sm rounded-lg p-2 text-xs">
          <div className="flex items-center gap-4">
            <span>Active Incidents: {visibleIncidents.length}</span>
            <span>Lat: {viewport.latitude.toFixed(4)}</span>
            <span>Lng: {viewport.longitude.toFixed(4)}</span>
          </div>
        </div>

        {/* Incident Popup */}
        {selectedIncident && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary border border-accent rounded-lg p-4 max-w-sm z-10">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium">{selectedIncident.type}</h4>
              <button 
                className="btn btn-ghost text-xs p-1"
                onClick={() => setSelectedIncident(null)}
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-secondary mb-2">{selectedIncident.description}</p>
            <div className="flex items-center justify-between text-xs">
              <span className={`status-indicator status-${selectedIncident.severity === 'critical' ? 'critical' : 'warning'}`}>
                {selectedIncident.severity.toUpperCase()}
              </span>
              <span className="text-muted">
                {new Date(selectedIncident.startTime).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
        </div>
      </div>
    </MapErrorBoundary>
  );
}
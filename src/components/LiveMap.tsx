import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      case 'critical': return { bg: 'bg-red-500', border: 'border-red-500', ring: 'border-red-400' };
      case 'high': return { bg: 'bg-orange-500', border: 'border-orange-500', ring: 'border-orange-400' };
      case 'medium': return { bg: 'bg-yellow-500', border: 'border-yellow-500', ring: 'border-yellow-400' };
      default: return { bg: 'bg-blue-500', border: 'border-blue-500', ring: 'border-blue-400' };
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'medical': return '🚑';
      case 'traffic': return '🚗';
      case 'security': return '🚨';
      case 'infrastructure': return '⚡';
      case 'environmental': return '🌿';
      default: return '⚠️';
    }
  };

  const colors = getSeverityColor(incident.severity);

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `${50 + (incident.location.longitude + 76.6122) * 100}%`,
        top: `${50 - (incident.location.latitude - 39.2904) * 100}%`,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={onClick}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Pulsing ring for critical incidents */}
      {incident.severity === 'critical' && (
        <motion.div
          className={`absolute w-8 h-8 rounded-full border-2 ${colors.ring}`}
          style={{ transform: 'translate(-50%, -50%)' }}
          animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Main marker */}
      <div
        className={`w-5 h-5 rounded-full border-2 shadow-lg ${colors.bg} ${colors.border} flex items-center justify-center`}
        style={{ transform: 'translate(-50%, -50%)' }}
        title={`${incident.type}: ${incident.description}`}
      >
        {/* Incident type icon */}
        <span className="text-xs">
          {getIncidentIcon(incident.type)}
        </span>
      </div>

      {/* Status indicator */}
      <motion.div
        className={`absolute w-2 h-2 rounded-full ${colors.bg}`}
        style={{
          transform: 'translate(-50%, -50%)',
          left: '75%',
          top: '25%'
        }}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </motion.div>
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

  // Ensure we always have some incidents to display for demo purposes
  const displayIncidents = incidents.length > 0 ? incidents : [
    {
      id: 'demo-incident-1',
      type: 'traffic_accident' as const,
      severity: 'medium' as const,
      status: 'investigating' as const,
      location: { latitude: 39.2904, longitude: -76.6122 },
      startTime: new Date().toISOString(),
      summary: 'Traffic incident on I-95',
      description: 'Multi-vehicle accident causing delays',
      affectedSystems: ['traffic-001'],
      responders: ['unit-12'],
      timeline: [],
      evidence: []
    },
    {
      id: 'demo-incident-2',
      type: 'infrastructure_failure' as const,
      severity: 'high' as const,
      status: 'responding' as const,
      location: { latitude: 39.3004, longitude: -76.6222 },
      startTime: new Date().toISOString(),
      summary: 'Power grid anomaly detected',
      description: 'Electrical infrastructure monitoring alert',
      affectedSystems: ['power-grid-001'],
      responders: ['team-alpha'],
      timeline: [],
      evidence: []
    }
  ];

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('LiveMap received incidents:', incidents.length, incidents);
  }, [incidents]);

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const visibleIncidents = layers.find(l => l.id === 'incidents')?.visible
    ? displayIncidents
    : [];

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
      <div className="h-full flex flex-col" style={{ minHeight: '400px' }}>
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
        <motion.div
          className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden border border-slate-600"
          style={{ minHeight: '350px' }}
          animate={{
            boxShadow: [
              '0 0 20px rgba(59, 130, 246, 0.3)',
              '0 0 30px rgba(16, 185, 129, 0.3)',
              '0 0 20px rgba(59, 130, 246, 0.3)'
            ]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
        {/* Enhanced Map Background */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-green-900 opacity-60"></div>

          {/* Animated grid overlay to simulate map tiles */}
          <div className="absolute inset-0 opacity-60">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={`h-${i}`}
                className="absolute border-t-2 border-blue-400"
                style={{ top: `${i * 5}%`, width: '100%' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 4, delay: i * 0.1, repeat: Infinity }}
              />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={`v-${i}`}
                className="absolute border-l-2 border-green-400"
                style={{ left: `${i * 5}%`, height: '100%' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 4, delay: i * 0.15, repeat: Infinity }}
              />
            ))}
          </div>

          {/* Simulated city blocks and roads */}
          <div className="absolute inset-0 opacity-70">
            {/* Major roads */}
            <div className="absolute top-1/4 left-0 w-full h-1 bg-yellow-400"></div>
            <div className="absolute top-3/4 left-0 w-full h-1 bg-yellow-400"></div>
            <div className="absolute left-1/4 top-0 w-1 h-full bg-yellow-400"></div>
            <div className="absolute left-3/4 top-0 w-1 h-full bg-yellow-400"></div>

            {/* City blocks */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={`block-${i}`}
                className="absolute bg-slate-600 rounded"
                style={{
                  left: `${15 + (i % 4) * 20}%`,
                  top: `${20 + Math.floor(i / 4) * 25}%`,
                  width: '12%',
                  height: '15%',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{
                  duration: 6,
                  delay: i * 0.3,
                  repeat: Infinity
                }}
              />
            ))}
          </div>

          {/* Data flow visualization */}
          <div className="absolute inset-0 opacity-80">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`flow-${i}`}
                className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  x: [0, Math.random() * 200 - 100],
                  y: [0, Math.random() * 200 - 100],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>

        {/* City Features Simulation */}
        <div className="absolute inset-0">
          {/* Major roads */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-yellow-400 opacity-50 transform -rotate-12"></div>
          <div className="absolute top-1/3 left-0 w-full h-1 bg-yellow-400 opacity-50 transform rotate-12"></div>

          {/* Harbor area */}
          <div className="absolute bottom-0 right-0 w-1/3 h-1/4 bg-blue-500 opacity-40 rounded-tl-full"></div>

          {/* Downtown core */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-16 h-16 bg-white opacity-30 rounded transform -translate-x-1/2 -translate-y-1/2"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Additional city landmarks */}
          <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-purple-400 opacity-40 rounded-full"></div>
          <div className="absolute top-3/4 left-3/4 w-6 h-6 bg-orange-400 opacity-40 rounded"></div>
          <div className="absolute top-1/6 right-1/4 w-10 h-4 bg-red-400 opacity-30 rounded"></div>
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
        </motion.div>
      </div>
    </MapErrorBoundary>
  );
}
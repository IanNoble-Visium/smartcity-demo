import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface CameraState {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

const defaultLayers: MapLayer[] = [
  { id: 'incidents', name: 'Active Incidents', visible: true, type: 'incidents', color: '#EF4444' },
  { id: 'infrastructure', name: 'Critical Infrastructure', visible: true, type: 'infrastructure', color: '#8B5CF6' },
  { id: 'traffic', name: 'Traffic Flow', visible: true, type: 'traffic', color: '#F59E0B' },
  { id: 'environmental', name: 'Environmental Sensors', visible: true, type: 'environmental', color: '#10B981' },
  { id: 'security', name: 'Security Cameras', visible: true, type: 'security', color: '#3B82F6' }
];

const baltimoreViewport: MapViewport = {
  latitude: 39.2904,
  longitude: -76.6122,
  zoom: 11,
  bearing: 0,
  pitch: 45
};

const defaultCameraState: CameraState = {
  x: 0,
  y: 0,
  z: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0
};

function IncidentMarker({ incident, onClick, cameraState }: { 
  incident: Incident; 
  onClick: () => void;
  cameraState: CameraState;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'bg-red-500', border: 'border-red-500', ring: 'border-red-400', glow: 'shadow-red-500/50' };
      case 'high': return { bg: 'bg-orange-500', border: 'border-orange-500', ring: 'border-orange-400', glow: 'shadow-orange-500/50' };
      case 'medium': return { bg: 'bg-yellow-500', border: 'border-yellow-500', ring: 'border-yellow-400', glow: 'shadow-yellow-500/50' };
      default: return { bg: 'bg-blue-500', border: 'border-blue-500', ring: 'border-blue-400', glow: 'shadow-blue-500/50' };
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

  // Calculate 3D position based on camera state
  const baseX = 50 + (incident.location.longitude + 76.6122) * 100;
  const baseY = 50 - (incident.location.latitude - 39.2904) * 100;
  
  const adjustedX = baseX + cameraState.x * 0.1;
  const adjustedY = baseY + cameraState.y * 0.1;

  return (
    <motion.div
      className="absolute cursor-pointer z-20"
      style={{
        left: `${adjustedX}%`,
        top: `${adjustedY}%`,
        transform: `translate(-50%, -50%) perspective(1000px) rotateX(${cameraState.rotationX}deg) rotateY(${cameraState.rotationY}deg)`
      }}
      onClick={onClick}
      whileHover={{ scale: 1.3, z: 10 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {/* Enhanced pulsing ring for critical incidents */}
      {incident.severity === 'critical' && (
        <>
          <motion.div
            className={`absolute w-12 h-12 rounded-full border-2 ${colors.ring}`}
            style={{ transform: 'translate(-50%, -50%)' }}
            animate={{ 
              scale: [1, 3, 1], 
              opacity: [0.8, 0, 0.8],
              rotate: [0, 360]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className={`absolute w-8 h-8 rounded-full border ${colors.ring}`}
            style={{ transform: 'translate(-50%, -50%)' }}
            animate={{ 
              scale: [1, 2.5, 1], 
              opacity: [0.6, 0, 0.6]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}

      {/* Main marker with enhanced 3D effect */}
      <motion.div
        className={`w-6 h-6 rounded-full border-2 shadow-lg ${colors.bg} ${colors.border} ${colors.glow} flex items-center justify-center relative`}
        style={{ 
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 20px ${colors.glow.includes('red') ? '#ef4444' : colors.glow.includes('orange') ? '#f59e0b' : colors.glow.includes('yellow') ? '#eab308' : '#3b82f6'}40`
        }}
        animate={{
          boxShadow: [
            `0 0 20px ${colors.glow.includes('red') ? '#ef4444' : colors.glow.includes('orange') ? '#f59e0b' : colors.glow.includes('yellow') ? '#eab308' : '#3b82f6'}40`,
            `0 0 30px ${colors.glow.includes('red') ? '#ef4444' : colors.glow.includes('orange') ? '#f59e0b' : colors.glow.includes('yellow') ? '#eab308' : '#3b82f6'}60`,
            `0 0 20px ${colors.glow.includes('red') ? '#ef4444' : colors.glow.includes('orange') ? '#f59e0b' : colors.glow.includes('yellow') ? '#eab308' : '#3b82f6'}40`
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        title={`${incident.type}: ${incident.description}`}
      >
        {/* Incident type icon */}
        <span className="text-xs relative z-10">
          {getIncidentIcon(incident.type)}
        </span>

        {/* 3D depth indicator */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
      </motion.div>

      {/* Enhanced status indicator */}
      <motion.div
        className={`absolute w-3 h-3 rounded-full ${colors.bg} border border-white/50`}
        style={{
          transform: 'translate(-50%, -50%)',
          left: '80%',
          top: '20%'
        }}
        animate={{ 
          opacity: [1, 0.3, 1],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Data connection lines */}
      <motion.div
        className="absolute w-px h-8 bg-gradient-to-t from-cyan-400/60 to-transparent"
        style={{
          transform: 'translate(-50%, -100%)',
          left: '50%',
          top: '0%'
        }}
        animate={{
          opacity: [0, 1, 0],
          scaleY: [0, 1, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
      />
    </motion.div>
  );
}

function LayerControl({ layers, onToggleLayer }: { layers: MapLayer[]; onToggleLayer: (id: string) => void }) {
  return (
    <motion.div 
      className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md rounded-xl p-4 min-w-56 border border-cyan-500/30"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)'
      }}
    >
      <h4 className="font-semibold mb-3 text-sm text-cyan-300 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
        Map Layers
      </h4>
      <div className="space-y-3">
        {layers.map(layer => (
          <motion.label 
            key={layer.id} 
            className="flex items-center gap-3 text-xs cursor-pointer hover:bg-cyan-500/10 p-2 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => onToggleLayer(layer.id)}
              className="w-4 h-4 rounded border-cyan-500/50 bg-slate-800 text-cyan-400 focus:ring-cyan-400 focus:ring-2"
            />
            <motion.div 
              className="w-4 h-4 rounded-full border-2 relative"
              style={{ 
                backgroundColor: layer.visible ? layer.color : 'transparent', 
                borderColor: layer.color,
                boxShadow: layer.visible ? `0 0 10px ${layer.color}40` : 'none'
              }}
              animate={{
                boxShadow: layer.visible ? [
                  `0 0 10px ${layer.color}40`,
                  `0 0 15px ${layer.color}60`,
                  `0 0 10px ${layer.color}40`
                ] : 'none'
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {layer.visible && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
              )}
            </motion.div>
            <span className="text-slate-300">{layer.name}</span>
          </motion.label>
        ))}
      </div>
    </motion.div>
  );
}

function MapControls({ 
  viewport, 
  onViewportChange, 
  cameraState, 
  onCameraChange,
  is3D,
  onToggle3D 
}: { 
  viewport: MapViewport; 
  onViewportChange: (viewport: MapViewport) => void;
  cameraState: CameraState;
  onCameraChange: (camera: CameraState) => void;
  is3D: boolean;
  onToggle3D: () => void;
}) {
  return (
    <motion.div 
      className="absolute bottom-4 right-4 flex flex-col gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Zoom Controls */}
      <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-cyan-500/30">
        <div className="flex flex-col gap-2">
          <motion.button 
            className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/50 text-sm p-2 w-10 h-10 flex items-center justify-center"
            onClick={() => onViewportChange({ ...viewport, zoom: Math.min(viewport.zoom + 1, 18) })}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            +
          </motion.button>
          <motion.button 
            className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/50 text-sm p-2 w-10 h-10 flex items-center justify-center"
            onClick={() => onViewportChange({ ...viewport, zoom: Math.max(viewport.zoom - 1, 8) })}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            -
          </motion.button>
        </div>
      </div>
      
      {/* 3D Toggle */}
      <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-cyan-500/30">
        <motion.button 
          className={`btn text-sm px-4 py-2 ${is3D ? 'bg-cyan-500 text-slate-900' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'}`}
          onClick={onToggle3D}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {is3D ? '3D' : '2D'}
        </motion.button>
      </div>

      {/* Camera Controls (3D Mode) */}
      {is3D && (
        <motion.div 
          className="bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-cyan-500/30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-xs text-cyan-300 mb-2 text-center">Camera</div>
          <div className="grid grid-cols-3 gap-1">
            <motion.button 
              className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs p-1 w-8 h-8"
              onClick={() => onCameraChange({ ...cameraState, rotationY: cameraState.rotationY - 15 })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ↶
            </motion.button>
            <motion.button 
              className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs p-1 w-8 h-8"
              onClick={() => onCameraChange({ ...cameraState, rotationX: cameraState.rotationX - 15 })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ↑
            </motion.button>
            <motion.button 
              className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs p-1 w-8 h-8"
              onClick={() => onCameraChange({ ...cameraState, rotationY: cameraState.rotationY + 15 })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ↷
            </motion.button>
            <motion.button 
              className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs p-1 w-8 h-8"
              onClick={() => onCameraChange({ ...cameraState, y: cameraState.y - 10 })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ←
            </motion.button>
            <motion.button 
              className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs p-1 w-8 h-8"
              onClick={() => onCameraChange(defaultCameraState)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ⌂
            </motion.button>
            <motion.button 
              className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs p-1 w-8 h-8"
              onClick={() => onCameraChange({ ...cameraState, y: cameraState.y + 10 })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              →
            </motion.button>
            <motion.button 
              className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs p-1 w-8 h-8"
              onClick={() => onCameraChange({ ...cameraState, z: cameraState.z - 10 })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              -
            </motion.button>
            <motion.button 
              className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs p-1 w-8 h-8"
              onClick={() => onCameraChange({ ...cameraState, rotationX: cameraState.rotationX + 15 })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ↓
            </motion.button>
            <motion.button 
              className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs p-1 w-8 h-8"
              onClick={() => onCameraChange({ ...cameraState, z: cameraState.z + 10 })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              +
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function EnhancedLiveMap({ incidents }: { incidents: Incident[] }) {
  const [layers, setLayers] = useState<MapLayer[]>(defaultLayers);
  const [viewport, setViewport] = useState<MapViewport>(baltimoreViewport);
  const [cameraState, setCameraState] = useState<CameraState>(defaultCameraState);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [is3D, setIs3D] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

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
    },
    {
      id: 'demo-incident-3',
      type: 'security' as const,
      severity: 'critical' as const,
      status: 'active' as const,
      location: { latitude: 39.2804, longitude: -76.6022 },
      startTime: new Date().toISOString(),
      summary: 'Security breach detected',
      description: 'Unauthorized access attempt at critical facility',
      affectedSystems: ['security-001'],
      responders: ['security-team-1'],
      timeline: [],
      evidence: []
    }
  ];

  useEffect(() => {
    // Simulate map loading with enhanced initialization
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('EnhancedLiveMap received incidents:', incidents.length, incidents);
  }, [incidents]);

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const toggle3D = () => {
    setIs3D(!is3D);
    if (!is3D) {
      // Smooth transition to 3D view
      setCameraState({ ...defaultCameraState, rotationX: 15, rotationY: 5 });
    } else {
      // Reset to 2D view
      setCameraState(defaultCameraState);
    }
  };

  const visibleIncidents = layers.find(l => l.id === 'incidents')?.visible
    ? displayIncidents
    : [];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <motion.div 
          className="text-center text-cyan-300"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="text-4xl mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            🌐
          </motion.div>
          <motion.p 
            className="text-lg font-semibold"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Initializing 3D City Map...
          </motion.p>
          <p className="text-sm mt-2 text-cyan-400">Connecting to geospatial services</p>
          <motion.div 
            className="mt-4 flex justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-cyan-400 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <MapErrorBoundary>
      <div className="h-full flex flex-col" style={{ minHeight: '400px' }}>
        {/* Header */}
        <div className="border-b border-cyan-500/30 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-cyan-300 flex items-center gap-2">
                <motion.span 
                  className="w-3 h-3 bg-cyan-400 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Enhanced Live City Map
              </h3>
              <p className="text-xs text-slate-400">Baltimore Metropolitan Area - 3D Visualization</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="status-indicator status-success flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Online
              </span>
              <span className="text-slate-400">Zoom: {viewport.zoom.toFixed(1)}</span>
              <span className="text-slate-400">Mode: {is3D ? '3D' : '2D'}</span>
            </div>
          </div>
        </div>

        {/* Enhanced 3D Map Container */}
        <motion.div
          ref={mapRef}
          className="flex-1 relative rounded-xl overflow-hidden border border-cyan-500/30"
          style={{ 
            minHeight: '350px',
            perspective: is3D ? '1000px' : 'none',
            transformStyle: 'preserve-3d'
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            boxShadow: [
              '0 0 30px rgba(6, 182, 212, 0.3)',
              '0 0 50px rgba(16, 185, 129, 0.4)',
              '0 0 30px rgba(6, 182, 212, 0.3)'
            ]
          }}
          transition={{
            duration: 0.8,
            boxShadow: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {/* Enhanced 3D Map Background */}
          <motion.div 
            className="absolute inset-0"
            style={{
              transform: is3D ? `
                perspective(1000px) 
                rotateX(${cameraState.rotationX}deg) 
                rotateY(${cameraState.rotationY}deg) 
                rotateZ(${cameraState.rotationZ}deg)
                translate3d(${cameraState.x}px, ${cameraState.y}px, ${cameraState.z}px)
              ` : 'none',
              transformStyle: 'preserve-3d'
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Base gradient with depth */}
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-green-900/30 relative">
              
              {/* Animated Grid Overlay - Blue and Green */}
              <div className="absolute inset-0 opacity-70">
                {/* Horizontal blue grid lines */}
                {Array.from({ length: 25 }).map((_, i) => (
                  <motion.div
                    key={`h-blue-${i}`}
                    className="absolute border-t-2 border-blue-400/60"
                    style={{ 
                      top: `${i * 4}%`, 
                      width: '100%',
                      transform: is3D ? `translateZ(${Math.sin(i * 0.5) * 10}px)` : 'none'
                    }}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ 
                      opacity: [0, 0.8, 0.4, 0.8, 0],
                      scaleX: [0, 1, 1, 1, 0]
                    }}
                    transition={{ 
                      duration: 6, 
                      delay: i * 0.1, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
                
                {/* Vertical green grid lines */}
                {Array.from({ length: 25 }).map((_, i) => (
                  <motion.div
                    key={`v-green-${i}`}
                    className="absolute border-l-2 border-green-400/60"
                    style={{ 
                      left: `${i * 4}%`, 
                      height: '100%',
                      transform: is3D ? `translateZ(${Math.cos(i * 0.5) * 10}px)` : 'none'
                    }}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ 
                      opacity: [0, 0.8, 0.4, 0.8, 0],
                      scaleY: [0, 1, 1, 1, 0]
                    }}
                    transition={{ 
                      duration: 6, 
                      delay: i * 0.15, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>

              {/* City Blocks - Gray rectangular blocks with pulse/fade */}
              <div className="absolute inset-0 opacity-80">
                {Array.from({ length: 20 }).map((_, i) => {
                  const row = Math.floor(i / 5);
                  const col = i % 5;
                  return (
                    <motion.div
                      key={`block-${i}`}
                      className="absolute bg-slate-600 rounded-sm border border-slate-500/50"
                      style={{
                        left: `${15 + col * 15}%`,
                        top: `${20 + row * 18}%`,
                        width: '10%',
                        height: '12%',
                        transform: is3D ? `translateZ(${20 + Math.random() * 30}px)` : 'none'
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 0.7, 0.3, 0.7, 0],
                        scale: [0.8, 1, 0.9, 1, 0.8],
                        rotateY: is3D ? [0, 5, -5, 0] : 0
                      }}
                      transition={{
                        duration: 8,
                        delay: i * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {/* Building details */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-500/30 to-transparent rounded-sm"></div>
                      {/* Windows */}
                      <div className="absolute inset-1 grid grid-cols-3 gap-px">
                        {Array.from({ length: 9 }).map((_, windowIndex) => (
                          <motion.div
                            key={windowIndex}
                            className="bg-yellow-300/20 rounded-sm"
                            animate={{ opacity: [0.2, 0.8, 0.2] }}
                            transition={{ 
                              duration: 3, 
                              delay: Math.random() * 2, 
                              repeat: Infinity 
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Road Network - Yellow roads (grid + diagonal patterns) */}
              <div className="absolute inset-0 opacity-90">
                {/* Major grid roads */}
                <motion.div 
                  className="absolute top-1/4 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-full"
                  style={{ transform: is3D ? 'translateZ(5px)' : 'none' }}
                  animate={{ 
                    opacity: [0.6, 1, 0.6],
                    boxShadow: [
                      '0 0 10px rgba(251, 191, 36, 0.5)',
                      '0 0 20px rgba(251, 191, 36, 0.8)',
                      '0 0 10px rgba(251, 191, 36, 0.5)'
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute top-3/4 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-full"
                  style={{ transform: is3D ? 'translateZ(5px)' : 'none' }}
                  animate={{ 
                    opacity: [0.6, 1, 0.6],
                    boxShadow: [
                      '0 0 10px rgba(251, 191, 36, 0.5)',
                      '0 0 20px rgba(251, 191, 36, 0.8)',
                      '0 0 10px rgba(251, 191, 36, 0.5)'
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
                <motion.div 
                  className="absolute left-1/4 top-0 w-2 h-full bg-gradient-to-b from-yellow-400 via-yellow-300 to-yellow-400 rounded-full"
                  style={{ transform: is3D ? 'translateZ(5px)' : 'none' }}
                  animate={{ 
                    opacity: [0.6, 1, 0.6],
                    boxShadow: [
                      '0 0 10px rgba(251, 191, 36, 0.5)',
                      '0 0 20px rgba(251, 191, 36, 0.8)',
                      '0 0 10px rgba(251, 191, 36, 0.5)'
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                />
                <motion.div 
                  className="absolute left-3/4 top-0 w-2 h-full bg-gradient-to-b from-yellow-400 via-yellow-300 to-yellow-400 rounded-full"
                  style={{ transform: is3D ? 'translateZ(5px)' : 'none' }}
                  animate={{ 
                    opacity: [0.6, 1, 0.6],
                    boxShadow: [
                      '0 0 10px rgba(251, 191, 36, 0.5)',
                      '0 0 20px rgba(251, 191, 36, 0.8)',
                      '0 0 10px rgba(251, 191, 36, 0.5)'
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
                />

                {/* Diagonal highways */}
                <motion.div 
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent transform rotate-12 origin-left"
                  style={{ 
                    transform: is3D ? 'translateZ(8px) rotate(12deg)' : 'rotate(12deg)',
                    transformOrigin: 'left center'
                  }}
                  animate={{ 
                    opacity: [0.4, 0.8, 0.4],
                    scaleX: [0.8, 1.2, 0.8]
                  }}
                  transition={{ duration: 6, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-transparent via-yellow-400 to-transparent transform -rotate-12 origin-right"
                  style={{ 
                    transform: is3D ? 'translateZ(8px) rotate(-12deg)' : 'rotate(-12deg)',
                    transformOrigin: 'right center'
                  }}
                  animate={{ 
                    opacity: [0.4, 0.8, 0.4],
                    scaleX: [0.8, 1.2, 0.8]
                  }}
                  transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                />
              </div>

              {/* Harbor Area - Blue curved area (bottom-right) */}
              <motion.div 
                className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-blue-500/60 via-blue-400/40 to-transparent rounded-tl-full border-2 border-blue-400/30"
                style={{ transform: is3D ? 'translateZ(-10px)' : 'none' }}
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  boxShadow: [
                    '0 0 20px rgba(59, 130, 246, 0.3)',
                    '0 0 40px rgba(59, 130, 246, 0.6)',
                    '0 0 20px rgba(59, 130, 246, 0.3)'
                  ]
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                {/* Water ripple effects */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={`ripple-${i}`}
                    className="absolute inset-0 border border-blue-300/20 rounded-tl-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      duration: 4,
                      delay: i * 0.8,
                      repeat: Infinity
                    }}
                  />
                ))}
              </motion.div>

              {/* Downtown Core - White pulsing circle (center) */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-radial from-white/80 via-white/40 to-transparent rounded-full border-2 border-white/50"
                style={{ 
                  transform: is3D ? 'translate(-50%, -50%) translateZ(15px)' : 'translate(-50%, -50%)',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 50%, transparent 100%)'
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    '0 0 30px rgba(255, 255, 255, 0.5)',
                    '0 0 60px rgba(255, 255, 255, 0.8)',
                    '0 0 30px rgba(255, 255, 255, 0.5)'
                  ]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Downtown building indicators */}
                <div className="absolute inset-2 grid grid-cols-3 gap-1">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="bg-white/60 rounded-sm"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ 
                        duration: 2, 
                        delay: i * 0.2, 
                        repeat: Infinity 
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Data Flow Animation - Cyan dots moving across map */}
              <div className="absolute inset-0 opacity-90">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={`flow-${i}`}
                    className="absolute w-3 h-3 bg-gradient-radial from-cyan-400 to-cyan-600 rounded-full border border-cyan-300/50"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      transform: is3D ? `translateZ(${10 + Math.random() * 20}px)` : 'none',
                      background: 'radial-gradient(circle, rgba(34, 211, 238, 1) 0%, rgba(8, 145, 178, 1) 100%)',
                      boxShadow: '0 0 15px rgba(34, 211, 238, 0.8)'
                    }}
                    animate={{
                      x: [0, Math.random() * 400 - 200],
                      y: [0, Math.random() * 400 - 200],
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1.5, 1, 0],
                    }}
                    transition={{
                      duration: 4 + Math.random() * 3,
                      repeat: Infinity,
                      delay: Math.random() * 3,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>

              {/* Additional Landmarks - Purple, Orange, Red elements */}
              <div className="absolute inset-0">
                {/* Purple landmarks */}
                <motion.div 
                  className="absolute top-1/4 left-1/4 w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-purple-300/50"
                  style={{ transform: is3D ? 'translateZ(12px)' : 'none' }}
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    rotate: [0, 360],
                    boxShadow: [
                      '0 0 15px rgba(147, 51, 234, 0.5)',
                      '0 0 25px rgba(147, 51, 234, 0.8)',
                      '0 0 15px rgba(147, 51, 234, 0.5)'
                    ]
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                >
                  <div className="absolute inset-1 bg-gradient-to-br from-white/30 to-transparent rounded-full"></div>
                </motion.div>

                {/* Orange landmarks */}
                <motion.div 
                  className="absolute top-3/4 left-3/4 w-8 h-12 bg-gradient-to-t from-orange-400 to-orange-600 rounded-lg border-2 border-orange-300/50"
                  style={{ transform: is3D ? 'translateZ(8px)' : 'none' }}
                  animate={{
                    opacity: [0.5, 0.9, 0.5],
                    scaleY: [1, 1.1, 1],
                    boxShadow: [
                      '0 0 12px rgba(251, 146, 60, 0.5)',
                      '0 0 20px rgba(251, 146, 60, 0.8)',
                      '0 0 12px rgba(251, 146, 60, 0.5)'
                    ]
                  }}
                  transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                >
                  <div className="absolute inset-1 bg-gradient-to-t from-white/20 to-transparent rounded-lg"></div>
                </motion.div>

                {/* Red landmarks */}
                <motion.div 
                  className="absolute top-1/6 right-1/4 w-12 h-6 bg-gradient-to-r from-red-400 to-red-600 rounded-full border-2 border-red-300/50"
                  style={{ transform: is3D ? 'translateZ(6px)' : 'none' }}
                  animate={{
                    opacity: [0.4, 0.8, 0.4],
                    scaleX: [1, 1.2, 1],
                    boxShadow: [
                      '0 0 10px rgba(248, 113, 113, 0.5)',
                      '0 0 18px rgba(248, 113, 113, 0.8)',
                      '0 0 10px rgba(248, 113, 113, 0.5)'
                    ]
                  }}
                  transition={{ duration: 5, repeat: Infinity, delay: 2 }}
                >
                  <div className="absolute inset-1 bg-gradient-to-r from-white/25 to-transparent rounded-full"></div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Incident Markers */}
          <AnimatePresence>
            {visibleIncidents.map(incident => (
              <IncidentMarker
                key={incident.id}
                incident={incident}
                cameraState={cameraState}
                onClick={() => setSelectedIncident(incident)}
              />
            ))}
          </AnimatePresence>

          {/* Map Controls */}
          <LayerControl layers={layers} onToggleLayer={toggleLayer} />
          <MapControls 
            viewport={viewport} 
            onViewportChange={setViewport}
            cameraState={cameraState}
            onCameraChange={setCameraState}
            is3D={is3D}
            onToggle3D={toggle3D}
          />

          {/* Enhanced Status Overlay */}
          <motion.div 
            className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-md rounded-xl p-3 text-xs border border-cyan-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-4 text-cyan-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                Active Incidents: {visibleIncidents.length}
              </span>
              <span>Lat: {viewport.latitude.toFixed(4)}</span>
              <span>Lng: {viewport.longitude.toFixed(4)}</span>
              <span>Camera: {is3D ? '3D' : '2D'}</span>
            </div>
          </motion.div>

          {/* Enhanced Incident Popup */}
          <AnimatePresence>
            {selectedIncident && (
              <motion.div 
                className="absolute top-1/2 left-1/2 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-xl p-6 max-w-sm z-30"
                style={{ transform: 'translate(-50%, -50%)' }}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.3, type: "spring" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-cyan-300 capitalize">{selectedIncident.type.replace('_', ' ')}</h4>
                  <motion.button 
                    className="btn bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/50 text-xs p-2 w-8 h-8 flex items-center justify-center rounded-lg"
                    onClick={() => setSelectedIncident(null)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ✕
                  </motion.button>
                </div>
                <p className="text-sm text-slate-300 mb-3">{selectedIncident.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedIncident.severity === 'critical' 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/50' 
                      : selectedIncident.severity === 'high'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                  }`}>
                    {selectedIncident.severity.toUpperCase()}
                  </span>
                  <span className="text-slate-400">
                    {new Date(selectedIncident.startTime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-400">
                    <div>Status: <span className="text-cyan-300 capitalize">{selectedIncident.status}</span></div>
                    <div>Location: <span className="text-cyan-300">{selectedIncident.location.latitude.toFixed(4)}, {selectedIncident.location.longitude.toFixed(4)}</span></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </MapErrorBoundary>
  );
}


import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import type { Incident } from '../types';

interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'incidents' | 'infrastructure' | 'traffic' | 'environmental' | 'security';
  color: string;
}

interface CityBlock {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  type: 'residential' | 'commercial' | 'industrial' | 'government';
  height: number;
}

interface IncidentMarker3DProps {
  incident: Incident;
  onClick: () => void;
  position: [number, number, number];
}

const defaultLayers: MapLayer[] = [
  { id: 'incidents', name: 'Active Incidents', visible: true, type: 'incidents', color: '#EF4444' },
  { id: 'infrastructure', name: 'Critical Infrastructure', visible: true, type: 'infrastructure', color: '#8B5CF6' },
  { id: 'traffic', name: 'Traffic Flow', visible: true, type: 'traffic', color: '#F59E0B' },
  { id: 'environmental', name: 'Environmental Sensors', visible: true, type: 'environmental', color: '#10B981' },
  { id: 'security', name: 'Security Cameras', visible: true, type: 'security', color: '#3B82F6' }
];

// Generate city blocks
const generateCityBlocks = (): CityBlock[] => {
  const blocks: CityBlock[] = [];
  const gridSize = 8;
  const blockSpacing = 3;
  
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const height = Math.random() * 8 + 2;
      const type = Math.random() > 0.7 ? 'commercial' : 
                   Math.random() > 0.5 ? 'residential' : 
                   Math.random() > 0.8 ? 'government' : 'industrial';
      
      blocks.push({
        id: `block-${x}-${z}`,
        position: [(x - gridSize/2) * blockSpacing, height/2, (z - gridSize/2) * blockSpacing],
        size: [2 + Math.random() * 0.5, height, 2 + Math.random() * 0.5],
        type,
        height
      });
    }
  }
  
  return blocks;
};

function CityBuilding({ block, isHighlighted = false }: { block: CityBlock; isHighlighted?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && isHighlighted) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'residential': return '#64748b';
      case 'commercial': return '#06b6d4';
      case 'industrial': return '#dc2626';
      case 'government': return '#7c3aed';
      default: return '#475569';
    }
  };
  
  return (
    <Box
      ref={meshRef}
      position={block.position}
      args={block.size}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial 
        color={getTypeColor(block.type)}
        metalness={0.1}
        roughness={0.3}
        emissive={isHighlighted ? new THREE.Color(0x001122) : new THREE.Color(0x000000)}
        emissiveIntensity={isHighlighted ? 0.3 : 0}
      />
      
      {/* Windows effect */}
      {block.height > 4 && (
        <>
          {Array.from({ length: Math.floor(block.height / 2) }).map((_, i) => (
            <Box
              key={i}
              position={[0, -block.height/2 + (i + 1) * 2, block.size[2]/2 + 0.01]}
              args={[1, 0.8, 0.1]}
            >
              <meshStandardMaterial 
                color="#fbbf24" 
                emissive="#fbbf24" 
                emissiveIntensity={0.2}
                transparent
                opacity={0.8}
              />
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}

function IncidentMarker3D({ incident, onClick, position }: IncidentMarker3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      default: return '#2563eb';
    }
  };
  
  const getSeverityIntensity = (severity: string) => {
    switch (severity) {
      case 'critical': return 1.0;
      case 'high': return 0.8;
      case 'medium': return 0.6;
      default: return 0.4;
    }
  };
  
  return (
    <group position={position}>
      {/* Main incident marker */}
      <Sphere
        ref={meshRef}
        args={[0.3, 16, 16]}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={getSeverityColor(incident.severity)}
          emissive={getSeverityColor(incident.severity)}
          emissiveIntensity={getSeverityIntensity(incident.severity)}
          transparent
          opacity={0.9}
        />
      </Sphere>
      
      {/* Pulsing ring for critical incidents */}
      {incident.severity === 'critical' && (
        <Cylinder
          args={[1.5, 1.5, 0.1, 32]}
          position={[0, -0.5, 0]}
        >
          <meshStandardMaterial
            color="#dc2626"
            emissive="#dc2626"
            emissiveIntensity={0.5}
            transparent
            opacity={0.3}
          />
        </Cylinder>
      )}
      
      {/* Info label */}
      <Text
        position={[0, 1, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        backgroundColor="#1e293b"
        backgroundOpacity={0.8}
        backgroundPadding={[0.1, 0.05]}
        backgroundRadius={0.05}
      >
        {incident.type.replace('_', ' ').toUpperCase()}
      </Text>
    </group>
  );
}

function CityTerrain() {
  return (
    <>
      {/* Ground plane */}
      <Box position={[0, -0.5, 0]} args={[50, 1, 50]} receiveShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </Box>
      
      {/* Grid lines */}
      <gridHelper args={[40, 20, '#334155', '#1e293b']} position={[0, 0, 0]} />
      
      {/* Roads */}
      <Box position={[0, 0.01, 0]} args={[40, 0.02, 1]} receiveShadow>
        <meshStandardMaterial color="#374151" />
      </Box>
      <Box position={[0, 0.01, 0]} args={[1, 0.02, 40]} receiveShadow>
        <meshStandardMaterial color="#374151" />
      </Box>
      
      {/* Additional cross streets */}
      <Box position={[10, 0.01, 0]} args={[20, 0.02, 0.5]} receiveShadow>
        <meshStandardMaterial color="#374151" />
      </Box>
      <Box position={[-10, 0.01, 0]} args={[20, 0.02, 0.5]} receiveShadow>
        <meshStandardMaterial color="#374151" />
      </Box>
      <Box position={[0, 0.01, 10]} args={[0.5, 0.02, 20]} receiveShadow>
        <meshStandardMaterial color="#374151" />
      </Box>
      <Box position={[0, 0.01, -10]} args={[0.5, 0.02, 20]} receiveShadow>
        <meshStandardMaterial color="#374151" />
      </Box>
    </>
  );
}

function CityScene({ incidents, layers, onIncidentClick }: {
  incidents: Incident[];
  layers: MapLayer[];
  onIncidentClick: (incident: Incident) => void;
}) {
  const [cityBlocks] = useState(() => generateCityBlocks());
  const { camera } = useThree();
  
  useEffect(() => {
    // Set initial camera position
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  const visibleIncidents = layers.find(l => l.id === 'incidents')?.visible ? incidents : [];
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#06b6d4" />
      
      {/* City terrain */}
      <CityTerrain />
      
      {/* City buildings */}
      {cityBlocks.map(block => (
        <CityBuilding
          key={block.id}
          block={block}
          isHighlighted={false}
        />
      ))}
      
      {/* Incident markers */}
      {visibleIncidents.map((incident, index) => {
        // Convert lat/lng to 3D position
        const x = (incident.location.longitude + 76.6122) * 100 - 5;
        const z = (incident.location.latitude - 39.2904) * 100 - 5;
        const y = 2 + Math.random() * 3; // Height above ground
        
        return (
          <IncidentMarker3D
            key={incident.id}
            incident={incident}
            position={[x, y, z]}
            onClick={() => onIncidentClick(incident)}
          />
        );
      })}
      
      {/* Traffic flow visualization */}
      {layers.find(l => l.id === 'traffic')?.visible && (
        <>
          {Array.from({ length: 10 }).map((_, i) => (
            <Sphere
              key={`traffic-${i}`}
              position={[
                Math.sin(i * 0.5) * 8,
                0.5,
                Math.cos(i * 0.5) * 8
              ]}
              args={[0.1, 8, 8]}
            >
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#f59e0b"
                emissiveIntensity={0.3}
              />
            </Sphere>
          ))}
        </>
      )}
    </>
  );
}

function LayerControl({ layers, onToggleLayer }: { layers: MapLayer[]; onToggleLayer: (id: string) => void }) {
  return (
    <motion.div
      className="absolute top-2 left-2 bg-slate-900/95 backdrop-blur-md rounded-xl p-3 min-w-48 border border-cyan-500/30 z-10"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)'
      }}
    >
      <h4 className="font-semibold mb-2 text-xs text-cyan-300 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
        Layers
      </h4>
      <div className="space-y-2">
        {layers.map(layer => (
          <motion.label
            key={layer.id}
            className="flex items-center gap-2 text-xs cursor-pointer hover:bg-cyan-500/10 p-1 rounded transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => onToggleLayer(layer.id)}
              className="w-3 h-3 rounded border-cyan-500/50 bg-slate-800 text-cyan-400 focus:ring-cyan-400 focus:ring-1"
            />
            <motion.div
              className="w-3 h-3 rounded-full border relative"
              style={{
                backgroundColor: layer.visible ? layer.color : 'transparent',
                borderColor: layer.color,
                boxShadow: layer.visible ? `0 0 8px ${layer.color}40` : 'none'
              }}
            >
              {layer.visible && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
              )}
            </motion.div>
            <span className="text-slate-300 text-xs">{layer.name}</span>
          </motion.label>
        ))}
      </div>
    </motion.div>
  );
}

function ViewControls({ onResetView, onToggleAnimation }: {
  onResetView: () => void;
  onToggleAnimation: () => void;
}) {
  return (
    <motion.div
      className="absolute bottom-2 right-2 flex flex-col gap-2 z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-2 border border-cyan-500/30">
        <div className="flex flex-col gap-1">
          <motion.button
            className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/50 text-xs px-3 py-1"
            onClick={onResetView}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Reset
          </motion.button>
          <motion.button
            className="btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/50 text-xs px-3 py-1"
            onClick={onToggleAnimation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Anim
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function Enhanced3DCityMap({ incidents }: { incidents: Incident[] }) {
  const [layers, setLayers] = useState<MapLayer[]>(defaultLayers);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
      type: 'cyber_attack' as const,
      severity: 'critical' as const,
      status: 'investigating' as const,
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
    // Simulate map loading
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  
  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };
  
  const handleResetView = () => {
    // Camera reset will be handled by OrbitControls
    console.log('Resetting view...');
  };
  
  const handleToggleAnimation = () => {
    // Toggle animation state
    console.log('Toggling animation...');
  };
  
  const visibleIncidents = layers.find(l => l.id === 'incidents')?.visible ? displayIncidents : [];
  
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
            className="text-6xl mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            🏙️
          </motion.div>
          <motion.p 
            className="text-xl font-semibold"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Initializing 3D City Visualization...
          </motion.p>
          <p className="text-sm mt-2 text-cyan-400">Building interactive city model</p>
          <motion.div 
            className="mt-4 flex justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-cyan-400 rounded-full"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden">
      {/* 3D Canvas */}
      <div className="w-full h-full">
        <Canvas
          ref={canvasRef}
          shadows
          camera={{ position: [15, 15, 15], fov: 60 }}
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          }}
        >
          <Suspense fallback={null}>
            <CityScene
              incidents={displayIncidents}
              layers={layers}
              onIncidentClick={setSelectedIncident}
            />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={10}
              maxDistance={50}
              maxPolarAngle={Math.PI / 2}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Layer Controls */}
      <LayerControl layers={layers} onToggleLayer={toggleLayer} />
      
      {/* View Controls */}
      <ViewControls
        onResetView={handleResetView}
        onToggleAnimation={handleToggleAnimation}
      />
      
      {/* Incident Detail Panel */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            className="absolute top-2 right-2 bg-slate-900/95 backdrop-blur-md rounded-xl p-3 max-w-xs border border-cyan-500/30 z-20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white text-sm">Incident Details</h4>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Type:</span>
                <span className="ml-2 text-white">{selectedIncident.type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400">Severity:</span>
                <span className={`ml-2 font-medium ${
                  selectedIncident.severity === 'critical' ? 'text-red-400' :
                  selectedIncident.severity === 'high' ? 'text-orange-400' :
                  selectedIncident.severity === 'medium' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>
                  {selectedIncident.severity.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>
                <span className="ml-2 text-cyan-400">{selectedIncident.status}</span>
              </div>
              <div>
                <span className="text-slate-400">Description:</span>
                <p className="mt-1 text-white text-xs">{selectedIncident.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Performance Status */}
      <div className="absolute bottom-2 left-2 bg-slate-900/95 backdrop-blur-md rounded-xl p-2 text-xs border border-cyan-500/30 z-10">
        <div className="flex items-center gap-2 text-cyan-300">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            3D Active
          </span>
          <span className="text-slate-400">
            {layers.filter(l => l.visible).length} layers
          </span>
        </div>
      </div>
    </div>
  );
}
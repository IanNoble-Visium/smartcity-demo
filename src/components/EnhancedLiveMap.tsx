import { useState, useEffect, useRef } from 'react';
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



const defaultLayers: MapLayer[] = [
  { id: 'incidents', name: 'Active Incidents', visible: true, type: 'incidents', color: '#EF4444' },
  { id: 'infrastructure', name: 'Critical Infrastructure', visible: true, type: 'infrastructure', color: '#8B5CF6' },
  { id: 'traffic', name: 'Traffic Flow', visible: true, type: 'traffic', color: '#F59E0B' },
  { id: 'environmental', name: 'Environmental Sensors', visible: true, type: 'environmental', color: '#10B981' },
  { id: 'security', name: 'Security Cameras', visible: true, type: 'security', color: '#3B82F6' }
];









export function EnhancedLiveMap({ incidents }: { incidents: Incident[] }) {
  const [layers] = useState<MapLayer[]>(defaultLayers);
  const [isLoading, setIsLoading] = useState(true);
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
    // Simulate map loading with enhanced initialization
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const visibleIncidents = layers.find(l => l.id === 'incidents')?.visible
    ? displayIncidents
    : [];

  useEffect(() => {
    console.log('EnhancedLiveMap received incidents:', incidents.length);
    console.log('Display incidents:', displayIncidents.length);
    console.log('Visible incidents:', visibleIncidents.length);
    console.log('Incidents layer visible:', layers.find(l => l.id === 'incidents')?.visible);
  }, [incidents.length, displayIncidents.length, visibleIncidents.length, layers]);



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
      <div className="w-full h-full bg-slate-900 overflow-hidden">
        {/* Enhanced Map Container */}
        <div
          ref={mapRef}
          className="w-full h-full relative bg-gradient-to-br from-slate-800 via-blue-900/50 to-slate-700"
        >
          {/* Enhanced Map Background */}
          <div className="absolute inset-0">
            {/* Animated background with city atmosphere */}
            <div className="w-full h-full bg-gradient-to-br from-slate-700 via-blue-900/60 to-emerald-900/40 relative overflow-hidden">

              {/* Enhanced Grid Pattern with Animation */}
              <div className="absolute inset-0 opacity-40">
                {/* Animated horizontal lines */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={`h-${i}`}
                    className="absolute border-t border-cyan-400/50"
                    style={{
                      top: `${i * 8.33}%`,
                      width: '100%'
                    }}
                    animate={{
                      opacity: [0.3, 0.7, 0.3],
                      borderColor: ['rgba(6, 182, 212, 0.3)', 'rgba(6, 182, 212, 0.6)', 'rgba(6, 182, 212, 0.3)']
                    }}
                    transition={{ duration: 4, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
                {/* Animated vertical lines */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={`v-${i}`}
                    className="absolute border-l border-cyan-400/50"
                    style={{
                      left: `${i * 8.33}%`,
                      height: '100%'
                    }}
                    animate={{
                      opacity: [0.3, 0.7, 0.3],
                      borderColor: ['rgba(6, 182, 212, 0.3)', 'rgba(6, 182, 212, 0.6)', 'rgba(6, 182, 212, 0.3)']
                    }}
                    transition={{ duration: 4, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>

              {/* Enhanced City Blocks with Animation */}
              <div className="absolute inset-0">
                {Array.from({ length: 16 }).map((_, i) => {
                  const row = Math.floor(i / 4);
                  const col = i % 4;
                  const isHighlighted = Math.random() > 0.7;
                  return (
                    <motion.div
                      key={`block-${i}`}
                      className={`absolute border border-slate-400/30 ${
                        isHighlighted ? 'bg-cyan-500/20' : 'bg-slate-600/40'
                      }`}
                      style={{
                        left: `${15 + col * 18}%`,
                        top: `${20 + row * 15}%`,
                        width: '12%',
                        height: '10%'
                      }}
                      animate={isHighlighted ? {
                        backgroundColor: ['rgba(6, 182, 212, 0.1)', 'rgba(6, 182, 212, 0.3)', 'rgba(6, 182, 212, 0.1)'],
                        borderColor: ['rgba(148, 163, 184, 0.3)', 'rgba(6, 182, 212, 0.6)', 'rgba(148, 163, 184, 0.3)']
                      } : {}}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                    />
                  );
                })}
              </div>

              {/* Traffic Flow Animation */}
              <div className="absolute inset-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={`traffic-${i}`}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                      left: `${10 + i * 15}%`,
                      top: '50%'
                    }}
                    animate={{
                      x: [0, 100, 200, 300],
                      opacity: [0, 1, 1, 0],
                      scale: [0.5, 1, 1, 0.5]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: i * 0.7,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>

              {/* Data Connection Lines */}
              <div className="absolute inset-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={`connection-${i}`}
                    className="absolute w-px bg-gradient-to-t from-transparent via-cyan-400/60 to-transparent"
                    style={{
                      left: `${20 + i * 10}%`,
                      height: '100%'
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scaleY: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.25
                    }}
                  />
                ))}
              </div>


            </div>
          </div>

          {/* Test Marker for debugging */}
          <div
            className="absolute w-8 h-8 bg-red-500 rounded-full border-2 border-white z-30 flex items-center justify-center text-white font-bold"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            T
          </div>

          {/* Enhanced Incident Markers */}
          {visibleIncidents.map((incident, index) => {
            const left = 25 + (Math.abs(incident.location.longitude + 76.6122) % 1) * 50;
            const top = 25 + (Math.abs(incident.location.latitude - 39.2904) % 1) * 50;
            console.log(`Rendering incident ${incident.id} at ${left}%, ${top}%`);

            const getSeverityColor = (severity: string) => {
              switch (severity) {
                case 'critical': return { bg: 'bg-red-500', border: 'border-red-400', shadow: 'shadow-red-500/50' };
                case 'high': return { bg: 'bg-orange-500', border: 'border-orange-400', shadow: 'shadow-orange-500/50' };
                case 'medium': return { bg: 'bg-yellow-500', border: 'border-yellow-400', shadow: 'shadow-yellow-500/50' };
                default: return { bg: 'bg-blue-500', border: 'border-blue-400', shadow: 'shadow-blue-500/50' };
              }
            };

            const getIncidentIcon = (type: string) => {
              switch (type) {
                case 'fire': return '🔥';
                case 'medical': return '🚑';
                case 'traffic_accident': return '🚗';
                case 'cyber_attack': return '🚨';
                case 'infrastructure_failure': return '⚡';
                case 'environmental': return '🌿';
                default: return '⚠️';
              }
            };

            const colors = getSeverityColor(incident.severity);

            return (
              <motion.div
                key={incident.id}
                className="absolute z-30 cursor-pointer"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => console.log('Incident clicked:', incident.id)}
                initial={{ scale: 0, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", delay: index * 0.1 }}
                whileHover={{ scale: 1.2, z: 10 }}
                whileTap={{ scale: 0.9 }}
              >
                {/* Pulsing ring for critical incidents */}
                {incident.severity === 'critical' && (
                  <>
                    <motion.div
                      className={`absolute w-16 h-16 rounded-full border-2 ${colors.border}`}
                      style={{ transform: 'translate(-50%, -50%)' }}
                      animate={{ 
                        scale: [1, 2.5, 1], 
                        opacity: [0.8, 0, 0.8],
                        rotate: [0, 360]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className={`absolute w-12 h-12 rounded-full border ${colors.border}`}
                      style={{ transform: 'translate(-50%, -50%)' }}
                      animate={{ 
                        scale: [1, 2, 1], 
                        opacity: [0.6, 0, 0.6]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    />
                  </>
                )}

                {/* Main marker */}
                <motion.div
                  className={`w-10 h-10 rounded-full border-3 ${colors.bg} ${colors.border} ${colors.shadow} flex items-center justify-center relative shadow-lg`}
                  style={{ transform: 'translate(-50%, -50%)' }}
                  animate={incident.severity === 'critical' ? {
                    boxShadow: [
                      '0 0 20px rgba(239, 68, 68, 0.6)',
                      '0 0 30px rgba(239, 68, 68, 0.8)',
                      '0 0 20px rgba(239, 68, 68, 0.6)'
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  title={`${incident.type}: ${incident.description}`}
                >
                  {/* Incident type icon */}
                  <span className="text-lg relative z-10">
                    {getIncidentIcon(incident.type)}
                  </span>

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                </motion.div>

                {/* Status indicator */}
                <motion.div
                  className={`absolute w-4 h-4 rounded-full ${colors.bg} border-2 border-white`}
                  style={{
                    transform: 'translate(-50%, -50%)',
                    left: '75%',
                    top: '25%'
                  }}
                  animate={{ 
                    opacity: [1, 0.3, 1],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />

                {/* Data connection line */}
                <motion.div
                  className="absolute w-px h-12 bg-gradient-to-t from-cyan-400/60 to-transparent"
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

                {/* Incident label */}
                <motion.div
                  className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-slate-900/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-white border border-cyan-500/30"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  #{incident.id.slice(-3)}
                </motion.div>
              </motion.div>
            );
          })}

          {/* Status Overlay */}
          <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-md rounded-xl p-2 text-xs border border-cyan-500/30 z-10">
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                Active: {visibleIncidents.length}
              </span>
              <span className="text-slate-400">
                {layers.filter(l => l.visible).length} layers
              </span>
            </div>
          </div>
        </div>
      </div>
    </MapErrorBoundary>
  );
}


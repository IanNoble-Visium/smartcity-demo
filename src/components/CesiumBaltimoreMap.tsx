import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Cesium from 'cesium';
import type { Incident } from '../types';

// Set Cesium ion access token (using default for demo)
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk';

interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'incidents' | 'infrastructure' | 'traffic' | 'environmental' | 'security';
  color: string;
}

interface CesiumBaltimoreMapProps {
  incidents: Incident[];
  className?: string;
}

const defaultLayers: MapLayer[] = [
  { id: 'incidents', name: 'Active Incidents', visible: true, type: 'incidents', color: '#EF4444' },
  { id: 'infrastructure', name: 'Critical Infrastructure', visible: true, type: 'infrastructure', color: '#8B5CF6' },
  { id: 'traffic', name: 'Traffic Flow', visible: true, type: 'traffic', color: '#F59E0B' },
  { id: 'environmental', name: 'Environmental Sensors', visible: true, type: 'environmental', color: '#10B981' },
  { id: 'security', name: 'Security Cameras', visible: true, type: 'security', color: '#3B82F6' }
];

export function CesiumBaltimoreMap({ incidents, className = '' }: CesiumBaltimoreMapProps) {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [layers, setLayers] = useState<MapLayer[]>(defaultLayers);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [buildingsTileset, setBuildingsTileset] = useState<Cesium.Cesium3DTileset | null>(null);

  // Initialize Cesium viewer
  useEffect(() => {
    if (!cesiumContainerRef.current) return;

    const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
      terrainProvider: Cesium.createWorldTerrain(),
      imageryProvider: new Cesium.IonImageryProvider({ assetId: 3954 }), // High-resolution satellite imagery
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      infoBox: true,
      selectionIndicator: true,
      shadows: true,
      terrainShadows: Cesium.ShadowMode.ENABLED,
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity
    });

    viewerRef.current = viewer;

    // Set initial camera position for Baltimore
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-76.6122, 39.2904, 1500), // Baltimore downtown
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0.0
      }
    });

    // Add Baltimore OSM buildings
    const initializeBuildings = async () => {
      try {
        const osmBuildings = await Cesium.createOsmBuildingsAsync();
        viewer.scene.primitives.add(osmBuildings);
        setBuildingsTileset(osmBuildings);

        // Apply professional styling to buildings
        osmBuildings.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${feature['building']} === 'hospital'", "color('#dc2626', 0.8)"],
              ["${feature['building']} === 'school'", "color('#2563eb', 0.8)"],
              ["${feature['building']} === 'university'", "color('#7c3aed', 0.8)"],
              ["${feature['building']} === 'office'", "color('#64748b', 0.9)"],
              ["${feature['building']} === 'commercial'", "color('#06b6d4', 0.8)"],
              ["${feature['building']} === 'residential'", "color('#475569', 0.7)"],
              ["${feature['building']} === 'industrial'", "color('#dc2626', 0.6)"],
              ["true", "color('#94a3b8', 0.8)"] // Default color
            ]
          },
          show: true
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading OSM buildings:', error);
        setIsLoading(false);
      }
    };

    initializeBuildings();

    // Configure lighting for professional appearance
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.dynamicAtmosphereLighting = true;
    viewer.scene.globe.atmosphereLightIntensity = 10.0;

    // Set up realistic lighting
    viewer.scene.light = new Cesium.DirectionalLight({
      direction: new Cesium.Cartesian3(0.2, 0.5, -0.8),
      intensity: 2.0
    });

    // Enable fog for atmospheric effect
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.0002;
    viewer.scene.fog.screenSpaceErrorFactor = 2.0;

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Add incident markers
  useEffect(() => {
    if (!viewerRef.current || !layers.find(l => l.id === 'incidents')?.visible) return;

    const viewer = viewerRef.current;
    
    // Clear existing incident entities
    const existingIncidents = viewer.entities.values.filter(entity => 
      entity.id?.startsWith('incident-')
    );
    existingIncidents.forEach(entity => viewer.entities.remove(entity));

    // Add new incident markers
    incidents.forEach(incident => {
      const position = Cesium.Cartesian3.fromDegrees(
        incident.location.longitude,
        incident.location.latitude,
        100 // Height above ground
      );

      const getSeverityColor = (severity: string) => {
        switch (severity) {
          case 'critical': return Cesium.Color.RED;
          case 'high': return Cesium.Color.ORANGE;
          case 'medium': return Cesium.Color.YELLOW;
          default: return Cesium.Color.BLUE;
        }
      };

      const entity = viewer.entities.add({
        id: `incident-${incident.id}`,
        position: position,
        point: {
          pixelSize: 15,
          color: getSeverityColor(incident.severity),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 10000, 0.5)
        },
        label: {
          text: incident.type.replace('_', ' ').toUpperCase(),
          font: '12pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -50),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 10000, 0.5)
        },
        description: `
          <div style="font-family: sans-serif;">
            <h3>${incident.summary}</h3>
            <p><strong>Type:</strong> ${incident.type.replace('_', ' ')}</p>
            <p><strong>Severity:</strong> ${incident.severity}</p>
            <p><strong>Status:</strong> ${incident.status}</p>
            <p><strong>Description:</strong> ${incident.description}</p>
            <p><strong>Location:</strong> ${incident.location.latitude.toFixed(4)}, ${incident.location.longitude.toFixed(4)}</p>
          </div>
        `
      });

      // Add pulsing effect for critical incidents
      if (incident.severity === 'critical') {
        entity.cylinder = {
          length: 200,
          topRadius: 100,
          bottomRadius: 100,
          material: Cesium.Color.RED.withAlpha(0.3),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
        };
      }
    });

  }, [incidents, layers]);

  // Add infrastructure markers
  useEffect(() => {
    if (!viewerRef.current || !layers.find(l => l.id === 'infrastructure')?.visible) return;

    const viewer = viewerRef.current;

    // Baltimore key infrastructure locations
    const infrastructurePoints = [
      { name: 'Johns Hopkins Hospital', lat: 39.2970, lng: -76.5936, type: 'hospital' },
      { name: 'University of Maryland Medical Center', lat: 39.2958, lng: -76.6244, type: 'hospital' },
      { name: 'Baltimore City Hall', lat: 39.2904, lng: -76.6122, type: 'government' },
      { name: 'BWI Airport', lat: 39.1754, lng: -76.6683, type: 'airport' },
      { name: 'Port of Baltimore', lat: 39.2606, lng: -76.5794, type: 'port' },
      { name: 'Baltimore Penn Station', lat: 39.3078, lng: -76.6156, type: 'transit' }
    ];

    infrastructurePoints.forEach((point, index) => {
      const position = Cesium.Cartesian3.fromDegrees(point.lng, point.lat, 50);
      
      const getInfrastructureColor = (type: string) => {
        switch (type) {
          case 'hospital': return Cesium.Color.RED;
          case 'government': return Cesium.Color.PURPLE;
          case 'airport': return Cesium.Color.BLUE;
          case 'port': return Cesium.Color.CYAN;
          case 'transit': return Cesium.Color.GREEN;
          default: return Cesium.Color.GRAY;
        }
      };

      viewer.entities.add({
        id: `infrastructure-${index}`,
        position: position,
        point: {
          pixelSize: 12,
          color: getInfrastructureColor(point.type),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
        },
        label: {
          text: point.name,
          font: '10pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -30),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 15000, 0.3)
        }
      });
    });

  }, [layers]);

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const resetView = () => {
    if (viewerRef.current) {
      viewerRef.current.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-76.6122, 39.2904, 1500),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0.0
        }
      });
    }
  };

  const flyToIncident = (incident: Incident) => {
    if (viewerRef.current) {
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          incident.location.longitude,
          incident.location.latitude,
          800
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-30),
          roll: 0.0
        },
        duration: 2.0
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
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
            🌍
          </motion.div>
          <motion.p 
            className="text-xl font-semibold"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading Baltimore City Model...
          </motion.p>
          <p className="text-sm mt-2 text-cyan-400">Initializing photorealistic 3D visualization</p>
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
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`relative h-full ${className}`}>
      {/* Cesium Container */}
      <div 
        ref={cesiumContainerRef} 
        className="w-full h-full"
        style={{ background: '#1e293b' }}
      />

      {/* Layer Controls */}
      <motion.div
        className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md rounded-xl p-4 min-w-56 border border-cyan-500/30 z-10"
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
        <div className="space-y-2">
          {layers.map(layer => (
            <motion.label
              key={layer.id}
              className="flex items-center gap-3 text-sm cursor-pointer hover:bg-cyan-500/10 p-2 rounded transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={() => toggleLayer(layer.id)}
                className="w-4 h-4 rounded border-cyan-500/50 bg-slate-800 text-cyan-400 focus:ring-cyan-400 focus:ring-1"
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
              <span className="text-slate-300 text-sm">{layer.name}</span>
            </motion.label>
          ))}
        </div>
      </motion.div>

      {/* View Controls */}
      <motion.div
        className="absolute bottom-4 right-4 flex flex-col gap-2 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-3 border border-cyan-500/30">
          <div className="flex flex-col gap-2">
            <motion.button
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded-lg text-sm font-medium transition-all duration-200"
              onClick={resetView}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Reset View
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Status Indicator */}
      <motion.div
        className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md rounded-xl p-3 border border-green-500/30 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-300 font-medium">LIVE</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">{incidents.length} Incidents</span>
        </div>
      </motion.div>
    </div>
  );
}


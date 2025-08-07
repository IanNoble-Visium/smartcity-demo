import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Incident } from '../types';
import { loadCesium, getCesium } from '../utils/cesiumLoader';

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
  const viewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [layers, setLayers] = useState<MapLayer[]>(defaultLayers);
  const [cesiumLoaded, setCesiumLoaded] = useState(false);

  // Load Cesium dynamically
  useEffect(() => {
    console.log('CesiumBaltimoreMap: Starting Cesium loading effect');
    const initCesium = async () => {
      console.log('CesiumBaltimoreMap: Calling loadCesium()');
      const cesium = await loadCesium();
      if (cesium) {
        console.log('CesiumBaltimoreMap: Cesium loaded successfully, setting cesiumLoaded to true');
        setCesiumLoaded(true);
      } else {
        console.log('CesiumBaltimoreMap: Cesium failed to load, setting isLoading to false');
        setIsLoading(false);
      }
    };

    initCesium();
  }, []);

  // Initialize Cesium viewer
  useEffect(() => {
    console.log('CesiumBaltimoreMap: Viewer initialization effect triggered', {
      hasContainer: !!cesiumContainerRef.current,
      cesiumLoaded,
      hasCesium: !!getCesium()
    });
    
    if (!cesiumLoaded) {
      console.log('CesiumBaltimoreMap: Skipping viewer init - Cesium not loaded');
      return;
    }
    
    const Cesium = getCesium();
    if (!Cesium) {
      console.log('CesiumBaltimoreMap: Skipping viewer init - getCesium() returned null');
      return;
    }
    
    const initViewer = async () => {
      try {
        console.log('Initializing Cesium viewer...');
        
        // Check WebGL support
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
        if (!gl) {
          throw new Error('WebGL is not supported by this browser');
        }
        console.log('WebGL support confirmed');
        
        const viewer = new Cesium.Viewer(cesiumContainerRef.current!, {
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
          maximumRenderTimeChange: Infinity,
          contextOptions: {
            webgl: {
              alpha: false,
              depth: true,
              stencil: false,
              antialias: true,
              premultipliedAlpha: true,
              preserveDrawingBuffer: true, // Preserve context
              failIfMajorPerformanceCaveat: false,
              powerPreference: 'high-performance'
            }
          },
          // Additional stability options
          scene3DOnly: true,
          orderIndependentTranslucency: false
        });
        
        console.log('Cesium viewer created successfully');
        
        // Add WebGL context lost/restored handlers
        const scene = viewer.scene;
        const canvas = scene.canvas;
        
        canvas.addEventListener('webglcontextlost', (event: Event) => {
          console.warn('🚨 WebGL context lost, preventing default behavior');
          event.preventDefault();
          setIsLoading(true); // Show loading overlay during recovery
        });
        
        canvas.addEventListener('webglcontextrestored', () => {
          console.log('✅ WebGL context restored, reinitializing...');
          setIsLoading(false);
          // Force a render to refresh the scene
          viewer.scene.requestRender();
        });
        
        // Add container visibility and size checks
        const containerRect = cesiumContainerRef.current!.getBoundingClientRect();
        console.log('Cesium container dimensions:', {
          width: containerRect.width,
          height: containerRect.height,
          visible: containerRect.width > 0 && containerRect.height > 0
        });
        
        if (containerRect.width === 0 || containerRect.height === 0) {
          console.warn('⚠️ Cesium container has zero dimensions, this may cause rendering issues');
        }
        
        // Set high-quality terrain and imagery using Ion services
        console.log('Setting up high-quality terrain and imagery...');
        
        try {
          // Use Cesium World Terrain for realistic elevation (older API)
          viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
            url: Cesium.IonResource.fromAssetId(1),
            requestWaterMask: true,
            requestVertexNormals: true
          });
          console.log('High-quality terrain provider set');
        } catch (error) {
          console.warn('Failed to load Ion terrain, using default:', error);
        }
        
        try {
          // Use Bing Maps imagery for photorealistic satellite imagery (older API)
          viewer.imageryLayers.removeAll();
          viewer.imageryLayers.add(new Cesium.ImageryLayer(
            new Cesium.IonImageryProvider({ assetId: 2 }) // Sentinel-2 cloudless imagery
          ));
          console.log('High-quality satellite imagery configured');
        } catch (error) {
          console.warn('Failed to load Ion imagery, using Bing Maps fallback:', error);
          // Fallback to Bing Maps
          viewer.imageryLayers.removeAll();
          viewer.imageryLayers.add(new Cesium.ImageryLayer(
            new Cesium.BingMapsImageryProvider({
              url: 'https://dev.virtualearth.net',
              key: '', // Bing Maps works without key for basic usage
              mapStyle: Cesium.BingMapsStyle.AERIAL_WITH_LABELS
            })
          ));
        }

        viewerRef.current = viewer;

        // Set initial camera position for Baltimore
        console.log('Setting camera position for Baltimore...');
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(-76.6122, 39.2904, 2000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-60),
            roll: 0.0
          },
          duration: 3.0
        });

        // Add Baltimore OSM buildings with professional styling
        console.log('Loading OSM buildings...');
        try {
          // Use older API for OSM buildings
          const osmBuildings = new Cesium.Cesium3DTileset({
            url: Cesium.IonResource.fromAssetId(96188)
          });
          viewer.scene.primitives.add(osmBuildings);
          console.log('OSM buildings added successfully');
          
          // Apply professional styling to buildings
          osmBuildings.style = new Cesium.Cesium3DTileStyle({
            color: {
              conditions: [
                ['${feature["building"]} === "hospital"', 'color("#FF6B6B", 0.8)'],
                ['${feature["building"]} === "school"', 'color("#4ECDC4", 0.8)'],
                ['${feature["amenity"]} === "place_of_worship"', 'color("#45B7D1", 0.8)'],
                ['${feature["building"]} === "commercial"', 'color("#96CEB4", 0.8)'],
                ['${feature["building"]} === "industrial"', 'color("#FFEAA7", 0.8)'],
                ['${feature["building"]} === "residential"', 'color("#DDA0DD", 0.8)'],
                ['true', 'color("#E8E8E8", 0.8)']
              ]
            },
            height: {
              conditions: [
                ['${feature["building:levels"]} >= 10', '${feature["building:levels"]} * 3.5'],
                ['${feature["height"]} > 0', '${feature["height"]}'],
                ['true', '15']
              ]
            }
          });
          console.log('Professional building styling applied');
        } catch (error) {
          console.warn('Failed to load OSM buildings:', error);
        }

        // Configure lighting
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.dynamicAtmosphereLighting = true;
        viewer.scene.globe.atmosphereLightIntensity = 10.0;

        viewer.scene.light = new Cesium.DirectionalLight({
          direction: new Cesium.Cartesian3(0.2, 0.5, -0.8),
          intensity: 2.0
        });

        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.0002;
        viewer.scene.fog.screenSpaceErrorFactor = 2.0;

        // Add resize observer to handle container size changes
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            console.log('Cesium container resized:', {
              width: entry.contentRect.width,
              height: entry.contentRect.height
            });
            // Force Cesium to resize
            viewer.resize();
            viewer.scene.requestRender();
          }
        });
        
        resizeObserver.observe(cesiumContainerRef.current!);
        
        // Store resize observer for cleanup
        (viewer as any)._resizeObserver = resizeObserver;
        
        console.log('Cesium viewer initialization completed successfully!');
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Cesium viewer:', error);
        setIsLoading(false);
      }
    };

    // Wait for container to be available with timeout
    let retryCount = 0;
    const maxRetries = 50; // 5 seconds max
    
    const initWithDelay = () => {
      if (!cesiumContainerRef.current) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('CesiumBaltimoreMap: Container never became available, giving up after 5 seconds');
          setIsLoading(false);
          return;
        }
        console.log(`CesiumBaltimoreMap: Container not ready, retrying in 100ms (attempt ${retryCount}/${maxRetries})`);
        setTimeout(initWithDelay, 100);
        return;
      }
      
      console.log('CesiumBaltimoreMap: Container ready, initializing viewer');
      initViewer();
    };
    
    // Start initialization
    initWithDelay();

    return () => {
      if (viewerRef.current) {
        console.log('🧹 Cleaning up Cesium viewer and WebGL context');
        
        // Remove WebGL context event listeners
        const canvas = viewerRef.current.scene.canvas;
        canvas.removeEventListener('webglcontextlost', () => {});
        canvas.removeEventListener('webglcontextrestored', () => {});
        
        // Destroy the viewer
        // Clean up resize observer if it exists
        if ((viewerRef.current as any)._resizeObserver) {
          (viewerRef.current as any)._resizeObserver.disconnect();
        }
        
        // Destroy the viewer
        viewerRef.current.destroy();
        viewerRef.current = null;
        
        console.log('✅ Cesium viewer cleanup completed');
      }
    };
  }, [cesiumLoaded]);

  // Add incident markers
  useEffect(() => {
    if (!viewerRef.current || !layers.find(l => l.id === 'incidents')?.visible || !cesiumLoaded) return;
    
    const Cesium = getCesium();
    if (!Cesium) return;

    const viewer = viewerRef.current;
    
    // Clear existing incident entities
    const existingIncidents = viewer.entities.values.filter((entity: any) => 
      entity.id?.startsWith('incident-')
    );
    existingIncidents.forEach((entity: any) => viewer.entities.remove(entity));

    // Add new incident markers
    incidents.forEach(incident => {
      const position = Cesium.Cartesian3.fromDegrees(
        incident.location.longitude,
        incident.location.latitude,
        100
      );

      const getSeverityColor = (severity: string) => {
        switch (severity) {
          case 'critical': return Cesium.Color.RED;
          case 'high': return Cesium.Color.ORANGE;
          case 'medium': return Cesium.Color.YELLOW;
          default: return Cesium.Color.BLUE;
        }
      };

      viewer.entities.add({
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
        viewer.entities.add({
          id: `incident-pulse-${incident.id}`,
          position: position,
          cylinder: {
            length: 200,
            topRadius: 100,
            bottomRadius: 100,
            material: Cesium.Color.RED.withAlpha(0.3),
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
          }
        });
      }
    });
  }, [incidents, layers, cesiumLoaded]);

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const resetView = () => {
    const Cesium = getCesium();
    if (viewerRef.current && Cesium) {
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



  return (
    <div className={`cesium-root relative h-full w-full min-h-0 overflow-hidden flex ${className}`} style={{ position: 'relative' }}>
      {/* Map column */}
      <div className="relative flex-1 min-w-0 h-full">
        {/* Cesium Container */}
        <div 
          ref={cesiumContainerRef} 
          className="cesium-map-container absolute inset-0 w-full h-full"
          style={{ 
            background: '#1e293b', 
            zIndex: 0,
            minHeight: '400px',
            minWidth: '400px',
            display: 'block',
            visibility: 'visible'
          }}
        />

        {/* Loading Overlay (only over the map area) */}
        {isLoading && (
          <div className="cesium-overlay absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 z-50">
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
        )}
      </div>

      {/* Controls sidebar (no overlap with map) */}
      <aside className="cesium-controls-sidebar w-80 max-w-xs h-full bg-slate-900/80 backdrop-blur-md border-l border-slate-700/50 p-4 overflow-y-auto">
        {/* Status Indicator */}
        <div className="mb-4 rounded-xl p-3 border border-green-500/30 bg-slate-900/80">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 font-medium">LIVE</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">{incidents.length} Incidents</span>
          </div>
        </div>

        {/* Mouse Controls */}
        <div className="mb-4 rounded-xl border border-cyan-500/30 bg-slate-900/95 shadow-2xl">
          <div className="p-4">
            <h4 className="font-semibold text-sm text-cyan-300 mb-3 flex items-center gap-2">
              <span className="text-cyan-400">🖱️</span>
              Mouse Controls
            </h4>
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Left Click + Drag:</span>
                <span className="text-cyan-300">Rotate View</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Right Click + Drag:</span>
                <span className="text-cyan-300">Pan Map</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mouse Wheel:</span>
                <span className="text-cyan-300">Zoom In/Out</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Middle Click + Drag:</span>
                <span className="text-cyan-300">Tilt View</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="mb-4 rounded-xl border border-cyan-500/30 bg-slate-900/95 shadow-2xl">
          <div className="p-4">
            <h4 className="font-semibold text-sm text-cyan-300 mb-3 flex items-center gap-2">
              <span className="text-cyan-400">🎮</span>
              View Controls
            </h4>
            <div className="flex flex-col gap-2">
              <motion.button
                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                onClick={resetView}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>🎯</span>
                Reset to Baltimore
              </motion.button>
              <div className="text-xs text-slate-400 mt-1">
                <div className="flex justify-between">
                  <span>Active Incidents:</span>
                  <span className="text-cyan-300">{incidents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Visible Layers:</span>
                  <span className="text-cyan-300">{layers.filter(l => l.visible).length}/{layers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Incident Layers Panel */}
        <div className="mb-4 rounded-xl border border-red-500/30 bg-slate-900/95 shadow-2xl">
          <div className="p-4">
            <h4 className="font-semibold text-sm text-red-300 mb-3 flex items-center gap-2">
              <span className="text-red-400">🚨</span>
              Incident Layers
            </h4>
            <div className="space-y-2">
              {layers.map((layer) => (
                <motion.div
                  key={layer.id}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border-2"
                      style={{
                        backgroundColor: layer.visible ? layer.color : 'transparent',
                        borderColor: layer.color,
                        boxShadow: layer.visible ? `0 0 8px ${layer.color}60` : 'none'
                      }}
                    />
                    <span className="text-xs text-slate-300 font-medium">{layer.name}</span>
                  </div>
                  <motion.button
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                      layer.visible
                        ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                        : 'bg-slate-600/20 text-slate-400 border border-slate-600/50'
                    }`}
                    onClick={() => toggleLayer(layer.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {layer.visible ? 'ON' : 'OFF'}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Building Types Legend */}
        <div className="rounded-xl border border-yellow-500/30 bg-slate-900/95 shadow-2xl">
          <div className="p-4">
            <h4 className="font-semibold text-sm text-yellow-300 mb-3 flex items-center gap-2">
              <span className="text-yellow-400">🏢</span>
              Building Types
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-slate-300">Hospitals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                <span className="text-slate-300">Schools</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-slate-300">Religious</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-slate-300">Commercial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-slate-300">Industrial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <span className="text-slate-300">Residential</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}


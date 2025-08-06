import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataStore, useUIStore } from '../store';
import { ContextualVideoBackground } from './VideoBackground';
import type { GeoLocation, Incident } from '../types';

interface GeospatialTrackingSystemProps {
  className?: string;
}

interface Asset {
  id: string;
  name: string;
  type: 'vehicle' | 'sensor' | 'camera' | 'emergency' | 'infrastructure';
  status: 'active' | 'inactive' | 'maintenance' | 'alert';
  location: GeoLocation;
  speed?: number;
  heading?: number;
  lastUpdate: string;
  metadata: Record<string, any>;
}

interface Geofence {
  id: string;
  name: string;
  type: 'circular' | 'polygon';
  coordinates: number[][];
  radius?: number;
  alertOnEntry: boolean;
  alertOnExit: boolean;
  activeAssets: string[];
}

interface TrafficFlow {
  segmentId: string;
  coordinates: [number, number][];
  volume: number;
  speed: number;
  congestionLevel: 'low' | 'medium' | 'high' | 'severe';
  incidents: string[];
}

export function GeospatialTrackingSystem({ className = '' }: GeospatialTrackingSystemProps) {
  const { incidents } = useDataStore();
  const { addNotification } = useUIStore();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [mapView, setMapView] = useState<'satellite' | 'street' | 'hybrid'>('hybrid');
  const [showTrafficFlow, setShowTrafficFlow] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [trackingMode, setTrackingMode] = useState<'realtime' | 'historical'>('realtime');

  // Mock assets data
  const assets = useMemo((): Asset[] => [
    {
      id: 'asset-001',
      name: 'Emergency Response Unit 1',
      type: 'emergency',
      status: 'active',
      location: { latitude: 39.2904, longitude: -76.6122, address: 'Downtown Baltimore' },
      speed: 45,
      heading: 180,
      lastUpdate: new Date().toISOString(),
      metadata: { unit: 'EMS-001', crew: 3, equipment: 'ALS' }
    },
    {
      id: 'asset-002',
      name: 'Traffic Camera - I95 North',
      type: 'camera',
      status: 'active',
      location: { latitude: 39.3105, longitude: -76.6205, address: 'I-95 North Mile 52' },
      lastUpdate: new Date().toISOString(),
      metadata: { resolution: '4K', nightVision: true, panTilt: true }
    },
    {
      id: 'asset-003',
      name: 'Air Quality Sensor - Harbor',
      type: 'sensor',
      status: 'active',
      location: { latitude: 39.2847, longitude: -76.6205, address: 'Inner Harbor' },
      lastUpdate: new Date().toISOString(),
      metadata: { type: 'air_quality', pm25: 15.2, ozone: 0.08 }
    },
    {
      id: 'asset-004',
      name: 'Police Patrol Unit 12',
      type: 'vehicle',
      status: 'active',
      location: { latitude: 39.2945, longitude: -76.6078, address: 'Federal Hill' },
      speed: 25,
      heading: 90,
      lastUpdate: new Date().toISOString(),
      metadata: { unit: 'PATROL-12', officer: 'Officer Johnson', district: 'Southern' }
    },
    {
      id: 'asset-005',
      name: 'Smart Traffic Light - Pratt St',
      type: 'infrastructure',
      status: 'alert',
      location: { latitude: 39.2866, longitude: -76.6177, address: 'Pratt St & Light St' },
      lastUpdate: new Date().toISOString(),
      metadata: { type: 'traffic_light', malfunction: 'timing_error', priority: 'high' }
    }
  ], []);

  // Mock geofences
  const geofences = useMemo((): Geofence[] => [
    {
      id: 'geo-001',
      name: 'Downtown Core',
      type: 'polygon',
      coordinates: [
        [-76.6250, 39.2950],
        [-76.6100, 39.2950],
        [-76.6100, 39.2850],
        [-76.6250, 39.2850],
        [-76.6250, 39.2950]
      ],
      alertOnEntry: true,
      alertOnExit: false,
      activeAssets: ['asset-001', 'asset-004']
    },
    {
      id: 'geo-002',
      name: 'Harbor Security Zone',
      type: 'circular',
      coordinates: [[-76.6205, 39.2847]],
      radius: 500,
      alertOnEntry: true,
      alertOnExit: true,
      activeAssets: ['asset-003']
    }
  ], []);

  // Mock traffic flow data
  const trafficFlows = useMemo((): TrafficFlow[] => [
    {
      segmentId: 'i95-north-1',
      coordinates: [
        [-76.6205, 39.3105],
        [-76.6180, 39.3150],
        [-76.6155, 39.3200]
      ],
      volume: 1250,
      speed: 55,
      congestionLevel: 'medium',
      incidents: []
    },
    {
      segmentId: 'pratt-street',
      coordinates: [
        [-76.6250, 39.2866],
        [-76.6200, 39.2866],
        [-76.6150, 39.2866]
      ],
      volume: 850,
      speed: 25,
      congestionLevel: 'high',
      incidents: ['incident-traffic-001']
    }
  ], []);

  // Asset List Component
  const AssetList = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Live Asset Tracking</h3>
        <div className="flex items-center gap-2">
          <span className="status-indicator status-success">
            {assets.filter(a => a.status === 'active').length} Active
          </span>
          <button className="btn btn-ghost text-xs">
            Filter
          </button>
        </div>
      </div>
      
      <div className="card-content">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {assets.map((asset) => (
            <motion.div
              key={asset.id}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedAsset === asset.id ? 'bg-primary/20 border border-primary' : 'bg-secondary hover:bg-secondary/80'
              }`}
              onClick={() => setSelectedAsset(asset.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    asset.status === 'active' ? 'bg-success' :
                    asset.status === 'alert' ? 'bg-warning' :
                    asset.status === 'maintenance' ? 'bg-info' : 'bg-muted'
                  }`} />
                  <span className="font-medium text-sm">{asset.name}</span>
                </div>
                <span className="text-xs text-muted capitalize">{asset.type}</span>
              </div>
              
              <div className="text-xs text-muted mb-2">
                {asset.location.address}
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">
                  Last Update: {new Date(asset.lastUpdate).toLocaleTimeString()}
                </span>
                {asset.speed && (
                  <span className="text-primary font-medium">
                    {asset.speed} mph
                  </span>
                )}
              </div>
              
              {asset.status === 'alert' && (
                <div className="mt-2 p-2 bg-warning/20 rounded text-xs text-warning">
                  Alert: {asset.metadata.malfunction || 'Status requires attention'}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // Map Controls Component
  const MapControls = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Map Controls</h3>
      </div>
      
      <div className="card-content space-y-4">
        <div>
          <label className="text-sm font-medium text-muted mb-2 block">Map View</label>
          <select 
            value={mapView} 
            onChange={(e) => setMapView(e.target.value as typeof mapView)}
            className="w-full btn btn-ghost text-xs"
          >
            <option value="satellite">Satellite</option>
            <option value="street">Street</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted mb-2 block">Tracking Mode</label>
          <select 
            value={trackingMode} 
            onChange={(e) => setTrackingMode(e.target.value as typeof trackingMode)}
            className="w-full btn btn-ghost text-xs"
          >
            <option value="realtime">Real-time</option>
            <option value="historical">Historical</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={showTrafficFlow} 
              onChange={(e) => setShowTrafficFlow(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show Traffic Flow</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={showGeofences} 
              onChange={(e) => setShowGeofences(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show Geofences</span>
          </label>
        </div>
        
        <div className="pt-2 border-t border-secondary">
          <button className="btn btn-primary text-xs w-full mb-2">
            Center on Selected Asset
          </button>
          <button className="btn btn-ghost text-xs w-full">
            Export Current View
          </button>
        </div>
      </div>
    </div>
  );

  // Traffic Analytics Component
  const TrafficAnalytics = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Traffic Flow Analytics</h3>
        <span className="status-indicator status-info">Live Data</span>
      </div>
      
      <div className="card-content">
        <div className="space-y-4">
          {trafficFlows.map((flow) => (
            <div key={flow.segmentId} className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{flow.segmentId.replace('-', ' ').toUpperCase()}</span>
                <span className={`status-indicator ${
                  flow.congestionLevel === 'low' ? 'status-success' :
                  flow.congestionLevel === 'medium' ? 'status-info' :
                  flow.congestionLevel === 'high' ? 'status-warning' : 'status-error'
                }`}>
                  {flow.congestionLevel}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted">Volume:</span>
                  <span className="ml-2 font-medium">{flow.volume} vehicles/hr</span>
                </div>
                <div>
                  <span className="text-muted">Avg Speed:</span>
                  <span className="ml-2 font-medium">{flow.speed} mph</span>
                </div>
              </div>
              
              {flow.incidents.length > 0 && (
                <div className="mt-2 p-2 bg-warning/20 rounded text-xs text-warning">
                  {flow.incidents.length} active incident(s) affecting this segment
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Geofence Alerts Component
  const GeofenceAlerts = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Geofence Monitoring</h3>
        <span className="text-xs text-muted">{geofences.length} active zones</span>
      </div>
      
      <div className="card-content">
        <div className="space-y-3">
          {geofences.map((fence) => (
            <div key={fence.id} className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{fence.name}</span>
                <span className="text-xs text-muted capitalize">{fence.type}</span>
              </div>
              
              <div className="text-xs text-muted mb-2">
                {fence.activeAssets.length} assets in zone
              </div>
              
              <div className="flex gap-2 text-xs">
                {fence.alertOnEntry && (
                  <span className="px-2 py-1 bg-info/20 text-info rounded">Entry Alert</span>
                )}
                {fence.alertOnExit && (
                  <span className="px-2 py-1 bg-warning/20 text-warning rounded">Exit Alert</span>
                )}
              </div>
            </div>
          ))}
          
          <div className="pt-2 border-t border-secondary">
            <button className="btn btn-ghost text-xs w-full">
              Create New Geofence
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Mock Map Component (placeholder for actual map integration)
  const MapView = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Interactive City Map</h3>
        <div className="flex items-center gap-2">
          <span className="status-indicator status-success">GPS Active</span>
          <span className="text-xs text-muted">Baltimore, MD</span>
        </div>
      </div>
      
      <div className="card-content">
        <div className="relative h-96 bg-secondary rounded-lg overflow-hidden">
          {/* Placeholder for actual map */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">🗺️</div>
              <div className="text-lg font-medium text-primary mb-2">Interactive Map View</div>
              <div className="text-sm text-muted mb-4">
                Real-time asset tracking with {mapView} view
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-2 bg-primary/20 rounded">
                  <div className="font-medium">Assets Tracked</div>
                  <div className="text-lg font-bold text-primary">{assets.length}</div>
                </div>
                <div className="p-2 bg-success/20 rounded">
                  <div className="font-medium">Active Alerts</div>
                  <div className="text-lg font-bold text-success">
                    {assets.filter(a => a.status === 'alert').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Map overlay controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <button className="btn btn-ghost text-xs bg-black/50">
              📍 Center Map
            </button>
            <button className="btn btn-ghost text-xs bg-black/50">
              🔍 Zoom In
            </button>
            <button className="btn btn-ghost text-xs bg-black/50">
              🔍 Zoom Out
            </button>
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 p-3 bg-black/70 rounded-lg text-xs">
            <div className="font-medium mb-2">Legend</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-success rounded-full"></span>
                <span>Active Assets</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-warning rounded-full"></span>
                <span>Alert Status</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-info rounded-full"></span>
                <span>Geofences</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`geospatial-tracking-system ${className}`}>
      {/* Video Background */}
      <ContextualVideoBackground 
        context="dynamic_mapping"
        className="absolute inset-0 -z-10"
        overlayOpacity={0.85}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">Real-time Geospatial Tracking System</h2>
          <p className="text-muted">Live asset tracking, geofencing, and traffic flow optimization</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost text-xs">
            Route Optimization
          </button>
          <button className="btn btn-primary text-xs">
            Emergency Dispatch
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map View - Takes up most space */}
        <div className="lg:col-span-3">
          <MapView />
        </div>
        
        {/* Control Panel */}
        <div className="space-y-6">
          <MapControls />
          <AssetList />
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <TrafficAnalytics />
        <GeofenceAlerts />
      </div>
    </div>
  );
}
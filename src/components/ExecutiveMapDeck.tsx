import { useState, useMemo, useEffect } from 'react';
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer, ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer, TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
// The generic view state type exported by deck.gl does not include all properties
// used by our application (such as pitch and bearing), and the typed export
// `ViewState` is no longer available in recent versions.  We therefore use
// a loose `any` type for the view state to avoid type errors while still
// benefiting from TypeScript for the rest of the component.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapViewState = any;
import {
  baltimorePolygon,
  generateHeatmapData,
  generateScatterData,
  generateFlightPaths,
  generateTrips,
  type HeatmapPoint,
  type ScatterPoint,
  type FlightPath,
  type Trip
} from '../mock/deckData';

import type { Alert } from '../types';

interface ExecutiveMapDeckProps {
  className?: string;
  alerts?: Alert[];
  onAlertSelect?: (alert: Alert) => void;
  focusedAlert?: Alert | null;
}

type LayerType =
  | 'geojson'
  | 'heatmap'
  | 'hexagon'
  | 'lines'
  | 'scatter'
  | 'trips';

// Colors for layer toggle buttons
const LAYER_COLORS: Record<LayerType, string> = {
  geojson: '#06b6d4',
  heatmap: '#dc2626',
  hexagon: '#9333ea',
  lines: '#f59e0b',
  scatter: '#10b981',
  trips: '#3b82f6'
};

// Human readable names
const LAYER_LABELS: Record<LayerType, string> = {
  geojson: 'Districts',
  heatmap: 'Heatmap',
  hexagon: 'Hex Bins',
  lines: 'Flights',
  scatter: 'Population',
  trips: 'Trips'
};

export function ExecutiveMapDeck({ className = '', alerts, onAlertSelect, focusedAlert }: ExecutiveMapDeckProps) {
  // Initial view centered on Baltimore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Compute a sensible map center using the Baltimore bounding box from the mock
  // data.  Centering the view on the middle of the bounding box ensures all
  // randomly generated points fall within the viewport.  We avoid magic
  // numbers so that updates to the bounding box will automatically adjust the
  // view.  See src/mock/deckData.ts for the bounding box definition.
  const centerLat = useMemo(() => {
    // Average the north and south bounds
    const coords = baltimorePolygon.geometry.coordinates[0];
    const lats = coords.map(pt => pt[1]);
    return (Math.min(...lats) + Math.max(...lats)) / 2;
  }, []);
  const centerLon = useMemo(() => {
    const coords = baltimorePolygon.geometry.coordinates[0];
    const lons = coords.map(pt => pt[0]);
    return (Math.min(...lons) + Math.max(...lons)) / 2;
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewState, setViewState] = useState<MapViewState>({
    latitude: centerLat,
    longitude: centerLon,
    zoom: 11,
    pitch: 45,
    bearing: 0
  });
  const [currentLayer, setCurrentLayer] = useState<LayerType>('geojson');
  // Pulse animation for alert markers.  The value cycles from 0 to 59 and is
  // used to modulate marker radius, creating a subtle pulsing effect.  A
  // relatively small interval ensures smooth animation without heavy CPU usage.
  const [alertPulse, setAlertPulse] = useState(0);
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setAlertPulse(t => (t + 1) % 60);
    }, 100);
    return () => clearInterval(pulseInterval);
  }, []);
  // Generate mock data once
  // Generate smaller datasets to improve performance and avoid WebGL
  // memory exhaustion.  Reducing the number of points does not materially
  // affect the visual narrative at this scale, but it dramatically lowers
  // the size of GPU buffers.
  const heatmapData = useMemo<HeatmapPoint[]>(() => generateHeatmapData(150, 10), []);
  const scatterData = useMemo<ScatterPoint[]>(() => generateScatterData(200, 11), []);
  const flightPaths = useMemo<FlightPath[]>(() => generateFlightPaths(15, 12), []);
  const tripsData = useMemo<Trip[]>(() => generateTrips(6, 30, 13), []);

  // Manage animated time for the TripsLayer.  Updating currentTime via
  // a timer avoids recalculating layers on every render and prevents the
  // accumulation of large timestamp values that can overflow 32‑bit WebGL
  // buffers (see INVALID_OPERATION errors in browser console).
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(t => (t + 100) % 60000);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // When a focused alert is provided, smoothly fly to its location with a higher zoom level.  This effect
  // runs whenever `focusedAlert` changes.  The transitionDuration property enables a smooth animation.
  useEffect(() => {
    if (focusedAlert && focusedAlert.location) {
      const { latitude, longitude } = focusedAlert.location;
      setViewState((vs: any) => ({
        ...vs,
        latitude,
        longitude,
        zoom: Math.max(vs.zoom, 13),
        transitionDuration: 800
      }));
    }
  }, [focusedAlert]);
  // Build deck.gl layers based on selected visualization
  const layers = useMemo(() => {
    const baseLayers: any[] = [];
    // Add a base map from OpenStreetMap tiles.  Using a TileLayer
    // ensures recognisable geography (streets, buildings, landmarks) while
    // remaining compatible with deck.gl.  Tiles are fetched on demand and
    // rendered via BitmapLayer sublayers.
    const osmLayer = new TileLayer({
      id: 'osm-tiles',
      data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      // Use a function to render bitmap tiles from the OSM tile URL
      renderSubLayers: subProps => {
        const bbox: any = subProps.tile.bbox;
        const { west, south, east, north } = bbox;
        // When creating a BitmapLayer within a TileLayer, we avoid spreading
        // subProps into the BitmapLayer, as the default `data` on subProps
        // contains the image URL string which is not an iterable container.
        // Instead we supply only the properties required to render the tile.
        return new BitmapLayer({
          id: `${subProps.id}-bitmap`,
          image: subProps.data as any,
          bounds: [west, south, east, north]
        });
      }
    });
    baseLayers.push(osmLayer);
    // Always display base polygon to give users context
    baseLayers.push(
      new GeoJsonLayer({
        id: 'base-bounds',
        data: baltimorePolygon,
        stroked: true,
        filled: true,
        lineWidthUnits: 'pixels',
        lineWidthMinPixels: 1,
        getLineColor: [60, 130, 185, 200],
        getFillColor: [4, 29, 54, 80],
        pickable: false
      })
    );

    // Alert markers layer: display locations of alerts on the map.  We use a ScatterplotLayer
    // for simplicity; each alert is drawn as a small colored circle.  Clicking a marker
    // triggers the onAlertSelect callback with the alert object.
    if (alerts && alerts.length) {
      // Map severities to RGBA colours
      const severityColors: Record<string, [number, number, number, number]> = {
        critical: [220, 38, 38, 200], // red
        high: [252, 165, 3, 200],     // orange
        medium: [234, 179, 8, 200],   // yellow
        low: [59, 130, 246, 200],     // blue
        info: [16, 185, 129, 200]     // green
      };
      baseLayers.push(
        new ScatterplotLayer({
          id: 'alert-markers',
          data: alerts.filter(a => a.location),
          getPosition: (a: Alert) => [a.location!.longitude, a.location!.latitude],
          getFillColor: (a: Alert) => severityColors[a.severity] || severityColors['medium'],
          // Increase marker size and add a pulse animation.  The pulse cycles between 0
          // and 1 using the alertPulse state to modulate the marker radius.  This
          // draws attention to alerts without overwhelming the map.
          getRadius: () => {
            const pulse = Math.sin((alertPulse / 60) * Math.PI * 2) * 0.5 + 0.5;
            return 8 + pulse * 6;
          },
          radiusUnits: 'pixels',
          pickable: true,
          onClick: info => {
            const alert = info.object as Alert;
            if (alert && onAlertSelect) onAlertSelect(alert);
          },
          // Provide a tooltip on hover with alert details.  A small HTML template
          // shows the title, severity, description and timestamp.  Styling is kept
          // inline for simplicity.
          getTooltip: (info: any) => {
            if (!info.object) return null;
            const a = info.object as Alert;
            const date = new Date(a.timestamp).toLocaleString();
            return {
              html: `<div style="max-width:260px;padding:6px;background-color:rgba(15,23,42,0.85);color:#e5e7eb;border-radius:6px;font-size:12px;">
                      <div style="font-weight:600;margin-bottom:2px;">${a.title}</div>
                      <div><strong>Severity:</strong> ${a.severity}</div>
                      <div style="margin-top:2px;">${a.description}</div>
                      <div style="margin-top:2px;font-size:10px;color:#94a3b8;">${date}</div>
                    </div>`
            };
          }
        })
      );
    }
    switch (currentLayer) {
      case 'geojson':
        baseLayers.push(
          new GeoJsonLayer({
            id: 'geojson-layer',
            data: baltimorePolygon,
            stroked: true,
            filled: true,
            lineWidthUnits: 'pixels',
            lineWidthMinPixels: 2,
            getLineColor: [6, 182, 212, 255],
            getFillColor: [6, 182, 212, 80],
            pickable: false
          })
        );
        break;
      case 'heatmap':
        baseLayers.push(
          new HeatmapLayer({
            id: 'heatmap-layer',
            data: heatmapData,
            getPosition: (d: HeatmapPoint) => d.position,
            getWeight: (d: HeatmapPoint) => d.weight,
            radiusPixels: 40,
            intensity: 1,
            threshold: 0.05,
            aggregation: 'SUM',
            // Compute aggregation on the CPU to avoid creating large textures that can
            // exceed WebGL buffer limits.  See https://deck.gl/docs/api-reference/aggregation-layers/heatmap-layer#gpuaggregation
            gpuAggregation: false,
            pickable: false
          })
        );
        break;
      case 'hexagon':
        baseLayers.push(
          new HexagonLayer({
            id: 'hexagon-layer',
            data: heatmapData,
            getPosition: (d: HeatmapPoint) => d.position,
            // radius in meters; using ~700m yields a pleasing hex bin granularity
            radius: 700,
            elevationScale: 30,
            extruded: true,
            coverage: 0.8,
            lowerPercentile: 50,
            opacity: 0.6,
            pickable: false,
            gpuAggregation: false
          })
        );
        break;
      case 'lines':
        baseLayers.push(
          new LineLayer({
            id: 'line-layer',
            data: flightPaths,
            getSourcePosition: (d: FlightPath) => d.sourcePosition,
            getTargetPosition: (d: FlightPath) => d.targetPosition,
            getColor: (_d: FlightPath) => [245, 158, 11, 200],
            getWidth: (d: FlightPath) => d.value,
            pickable: true
          })
        );
        break;
      case 'scatter':
        baseLayers.push(
          new ScatterplotLayer({
            id: 'scatter-layer',
            data: scatterData,
            getPosition: (d: ScatterPoint) => d.position,
            getRadius: (d: ScatterPoint) => Math.sqrt(d.population) * 30,
            radiusMinPixels: 2,
            radiusMaxPixels: 20,
            getFillColor: (_d: ScatterPoint) => [16, 185, 129, 200],
            pickable: true
          })
        );
        break;
      case 'trips':
        baseLayers.push(
          new TripsLayer({
            id: 'trips-layer',
            data: tripsData,
            getPath: (d: Trip) => d.waypoints,
            getTimestamps: (d: Trip) => d.timestamps,
            getColor: (_d: Trip) => [59, 130, 246],
            opacity: 0.8,
            widthMinPixels: 4,
            jointRounded: true,
            // Increase trailLength relative to total trip duration to show longer tails
            trailLength: 5000,
            // Use controlled currentTime from state to animate trips smoothly
            currentTime,
            shadowEnabled: false,
            pickable: false
          })
        );
        break;
    }
    return baseLayers;
  }, [currentLayer, heatmapData, scatterData, flightPaths, tripsData]);
  return (
    <div className={`relative w-full h-full ${className}`} style={{ backgroundColor: '#0f172a' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
      />
      {/* Layer selection controls */}
      <div
        className="absolute top-3 left-3 z-20 flex flex-col md:flex-row gap-2 p-1 bg-slate-900/70 backdrop-blur-md rounded-lg border border-cyan-400/30"
        style={{ boxShadow: '0 0 15px rgba(6,182,212,0.3)' }}
      >
        {(['geojson', 'heatmap', 'hexagon', 'lines', 'scatter', 'trips'] as LayerType[]).map(layer => (
          <button
            key={layer}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${currentLayer === layer ? 'bg-cyan-600 text-white' : 'bg-slate-800/40 text-cyan-300 hover:bg-cyan-700/30'}`}
            style={{ borderColor: LAYER_COLORS[layer], borderWidth: currentLayer === layer ? 1 : 0 }}
            onClick={() => setCurrentLayer(layer)}
          >
            {LAYER_LABELS[layer]}
          </button>
        ))}
      </div>
      {/* Map legend */}
      <div
        className="absolute bottom-3 left-3 z-20 p-2 bg-slate-900/70 backdrop-blur-md rounded-lg border border-cyan-400/30 text-xs text-slate-200 space-y-2"
        style={{ boxShadow: '0 0 10px rgba(6,182,212,0.25)', maxWidth: '240px' }}
      >
        {/* Legend title */}
        <div className="font-semibold text-cyan-300 mb-1">Legend</div>
        {/* Alerts legend with severity colours */}
        <div className="flex flex-col">
          <div className="font-medium mb-1">Alerts</div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(220,38,38)' }}></span><span>Critical</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(252,165,3)' }}></span><span>High</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(234,179,8)' }}></span><span>Medium</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(59,130,246)' }}></span><span>Low</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(16,185,129)' }}></span><span>Info</span></div>
          </div>
        </div>
        {/* Layers legend */}
        <div className="flex flex-col space-y-1 mt-2">
          {(['geojson', 'heatmap', 'hexagon', 'lines', 'scatter', 'trips'] as LayerType[]).map(layer => {
            let indicator: JSX.Element;
            // Determine indicator style based on layer
            switch (layer) {
              case 'heatmap':
                indicator = (
                  <span className="w-4 h-3 bg-gradient-to-r from-red-500 via-yellow-400 to-green-400 rounded-sm"></span>
                );
                break;
              case 'hexagon':
                indicator = (
                  <span className="w-4 h-3 bg-purple-600 rounded-sm"></span>
                );
                break;
              case 'lines':
                indicator = (
                  <span className="w-4 h-0.5 bg-yellow-500 block"></span>
                );
                break;
              case 'scatter':
                indicator = (
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                );
                break;
              case 'trips':
                indicator = (
                  <span className="w-4 h-0.5 bg-blue-500 block"></span>
                );
                break;
              case 'geojson':
              default:
                indicator = (
                  <span className="w-4 h-3 bg-cyan-400 rounded-sm"></span>
                );
            }
            return (
              <div key={layer} className="flex items-center gap-2">
                {indicator}
                <span className={currentLayer === layer ? 'text-white font-semibold' : ''}>{LAYER_LABELS[layer]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ExecutiveMapDeck;
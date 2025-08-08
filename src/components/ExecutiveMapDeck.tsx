import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type React from 'react';
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
  // Refs for draggable overlays
  const containerRef = useRef<HTMLDivElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  // Positions for draggable overlays (in px from top-left of map)
  const [legendPos, setLegendPos] = useState<{ top: number; left: number }>(() => {
    const saved = localStorage.getItem('deck.legendPos');
    return saved ? JSON.parse(saved) : { top: 64, left: 12 };
  });
  const [controlsPos, setControlsPos] = useState<{ top: number; left: number }>(() => {
    const saved = localStorage.getItem('deck.controlsPos');
    return saved ? JSON.parse(saved) : { top: 120, left: 12 };
  });
  const [legendCollapsed, setLegendCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('deck.legendCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
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

  // Initialize default positions after mount so elements start at right side without overlap
  useEffect(() => {
    const mapEl = containerRef.current;
    const legEl = legendRef.current;
    const ctlEl = controlsRef.current;
    if (!mapEl) return;
    const mapRect = mapEl.getBoundingClientRect();
    if (legEl) {
      const r = legEl.getBoundingClientRect();
      const within = {
        top: Math.max(MARGIN, Math.min(legendPos.top, mapRect.height - r.height - MARGIN)),
        left: Math.max(MARGIN, Math.min(legendPos.left, mapRect.width - r.width - MARGIN))
      };
      // Auto-place if not saved, else clamp saved into bounds
      if (!localStorage.getItem('deck.legendPos')) {
        within.top = 64;
        within.left = Math.max(MARGIN, mapRect.width - r.width - MARGIN);
      }
      setLegendPos(within);
      localStorage.setItem('deck.legendPos', JSON.stringify(within));
    }
    if (ctlEl) {
      const r = ctlEl.getBoundingClientRect();
      const within = {
        top: Math.max(MARGIN, Math.min(controlsPos.top, mapRect.height - r.height - MARGIN)),
        left: Math.max(MARGIN, Math.min(controlsPos.left, mapRect.width - r.width - MARGIN))
      };
      if (!localStorage.getItem('deck.controlsPos')) {
        within.top = Math.max(MARGIN, mapRect.height / 2 - r.height / 2);
        within.left = Math.max(MARGIN, mapRect.width - r.width - MARGIN);
      }
      setControlsPos(within);
      localStorage.setItem('deck.controlsPos', JSON.stringify(within));
    }
    // re-evaluate on window resize
    const onResize = () => {
      const mapRect2 = mapEl.getBoundingClientRect();
      if (legEl) {
        const r2 = legEl.getBoundingClientRect();
        setLegendPos(pos => {
          const next = { top: pos.top, left: Math.min(pos.left, Math.max(8, mapRect2.width - r2.width - 12)) };
          localStorage.setItem('deck.legendPos', JSON.stringify(next));
          return next;
        });
      }
      if (ctlEl) {
        const r2 = ctlEl.getBoundingClientRect();
        setControlsPos(pos => {
          const next = { top: pos.top, left: Math.min(pos.left, Math.max(8, mapRect2.width - r2.width - 12)) };
          localStorage.setItem('deck.controlsPos', JSON.stringify(next));
          return next;
        });
      }
    };
    window.addEventListener('resize', onResize);
    // keyboard shortcut: Shift+R to reset layout
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key.toLowerCase() === 'r' && ev.shiftKey) {
        const mapRect3 = mapEl.getBoundingClientRect();
        if (legEl) {
          const r3 = legEl.getBoundingClientRect();
          const next = { top: 64, left: Math.max(MARGIN, mapRect3.width - r3.width - MARGIN) };
          setLegendPos(next);
          localStorage.setItem('deck.legendPos', JSON.stringify(next));
        }
        if (ctlEl) {
          const r3 = ctlEl.getBoundingClientRect();
          const next = { top: Math.max(MARGIN, mapRect3.height / 2 - r3.height / 2), left: Math.max(MARGIN, mapRect3.width - r3.width - MARGIN) };
          setControlsPos(next);
          localStorage.setItem('deck.controlsPos', JSON.stringify(next));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Generic drag handler factory for overlays
  function snapToGrid(value: number, grid = 8) {
    return Math.round(value / grid) * grid;
  }

  function maybeSnapToCorner(pos: { top: number; left: number }, el: HTMLDivElement, mapRect: DOMRect) {
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const corners = [
      { top: MARGIN, left: MARGIN },
      { top: MARGIN, left: mapRect.width - w - MARGIN },
      { top: mapRect.height - h - MARGIN, left: MARGIN },
      { top: mapRect.height - h - MARGIN, left: mapRect.width - w - MARGIN }
    ];
    const nearest = corners.reduce((best, c) => {
      const dist = Math.hypot(pos.left - c.left, pos.top - c.top);
      return dist < best.dist ? { dist, corner: c } : best;
    }, { dist: Number.POSITIVE_INFINITY, corner: corners[0] });
    if (nearest.dist <= CORNER_SNAP_THRESHOLD) {
      return nearest.corner;
    }
    return pos;
  }

  function makeDragStartHandler(ref: React.RefObject<HTMLDivElement>, setPos: (p: { top: number; left: number }) => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const el = ref.current;
      const mapEl = containerRef.current;
      if (!el || !mapEl) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const mapRect = mapEl.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const originLeft = elRect.left - mapRect.left;
      const originTop = elRect.top - mapRect.top;
      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const newLeft = Math.max(0, Math.min(mapRect.width - elRect.width, originLeft + dx));
        const newTop = Math.max(0, Math.min(mapRect.height - elRect.height, originTop + dy));
        setPos({ top: newTop, left: newLeft });
      };
      const onUp = () => {
        // snap and persist on drop
        const mapRect2 = mapEl.getBoundingClientRect();
        const current = ref.current?.getBoundingClientRect();
        if (current) {
          let left = snapToGrid(current.left - mapRect2.left);
          let top = snapToGrid(current.top - mapRect2.top);
          // corner magnet
          const snapped = maybeSnapToCorner({ top, left }, ref.current!, mapRect2);
          top = snapped.top;
          left = snapped.left;
          setPos({ top, left });
          const key = ref === legendRef ? 'deck.legendPos' : 'deck.controlsPos';
          localStorage.setItem(key, JSON.stringify({ top, left }));
        }
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
  }
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

  // ---- Derived metrics for Legend ----
  const CORNER_SNAP_THRESHOLD = 48; // px proximity to corner to magnet
  const MARGIN = 12; // panel margins inside map bounds

  function toKmDistance([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const alertCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<string, number>;
    (alerts || []).forEach(a => {
      counts[a.severity] = (counts[a.severity] || 0) + 1;
    });
    return counts;
  }, [alerts]);

  const layerStats = useMemo(() => {
    switch (currentLayer) {
      case 'geojson': {
        const coords = baltimorePolygon.geometry.coordinates[0] as [number, number][];
        const west = coords[0][0];
        const south = coords[0][1];
        const east = coords[1][0];
        const north = coords[2][1];
        const widthKm = toKmDistance([west, centerLat], [east, centerLat]);
        const heightKm = toKmDistance([centerLon, south], [centerLon, north]);
        const areaKm2 = Math.round(widthKm * heightKm);
        return {
          title: 'Districts',
          items: [
            { label: 'Coverage area', value: `${areaKm2.toLocaleString()} km²` },
            { label: 'Bounds', value: `${widthKm.toFixed(1)} × ${heightKm.toFixed(1)} km` }
          ]
        };
      }
      case 'heatmap': {
        const count = heatmapData.length;
        const avg = heatmapData.reduce((s, p) => s + p.weight, 0) / Math.max(1, count);
        const max = Math.max(...heatmapData.map(p => p.weight));
        return {
          title: 'Heatmap',
          items: [
            { label: 'Input points', value: count.toLocaleString() },
            { label: 'Avg weight', value: avg.toFixed(2) },
            { label: 'Max weight', value: max.toFixed(2) }
          ]
        };
      }
      case 'hexagon': {
        const radiusM = 700;
        const approxBins = Math.max(1, Math.round(heatmapData.length / 6));
        return {
          title: 'Hex Bins',
          items: [
            { label: 'Input points', value: heatmapData.length.toLocaleString() },
            { label: 'Cell radius', value: `${(radiusM / 1000).toFixed(1)} km` },
            { label: 'Est. bins', value: approxBins.toLocaleString() }
          ]
        };
      }
      case 'lines': {
        const count = flightPaths.length;
        const avgWidth = flightPaths.reduce((s, f) => s + f.value, 0) / Math.max(1, count);
        const avgLenKm =
          flightPaths.reduce((s, f) => s + toKmDistance(f.sourcePosition, f.targetPosition), 0) /
          Math.max(1, count);
        return {
          title: 'Flights',
          items: [
            { label: 'Paths', value: count.toLocaleString() },
            { label: 'Avg width', value: avgWidth.toFixed(1) },
            { label: 'Avg length', value: `${avgLenKm.toFixed(1)} km` }
          ]
        };
      }
      case 'scatter': {
        const count = scatterData.length;
        const totalPop = scatterData.reduce((s, p) => s + p.population, 0);
        const avgPop = totalPop / Math.max(1, count);
        return {
          title: 'Population',
          items: [
            { label: 'Samples', value: count.toLocaleString() },
            { label: 'Total', value: Math.round(totalPop).toLocaleString() },
            { label: 'Avg/sample', value: Math.round(avgPop).toLocaleString() }
          ]
        };
      }
      case 'trips': {
        const count = tripsData.length;
        const avgPoints =
          tripsData.reduce((s, t) => s + t.waypoints.length, 0) / Math.max(1, count);
        // Approximate average route length
        const avgLenKm =
          tripsData.reduce((sum, t) => {
            let acc = 0;
            for (let i = 1; i < t.waypoints.length; i++) {
              acc += toKmDistance(t.waypoints[i - 1], t.waypoints[i]);
            }
            return sum + acc;
          }, 0) / Math.max(1, count);
        return {
          title: 'Trips',
          items: [
            { label: 'Routes', value: count.toLocaleString() },
            { label: 'Avg points/route', value: avgPoints.toFixed(0) },
            { label: 'Avg length', value: `${avgLenKm.toFixed(1)} km` }
          ]
        };
      }
      default:
        return { title: 'Layer', items: [] as { label: string; value: string }[] };
    }
  }, [currentLayer, heatmapData, scatterData, flightPaths, tripsData, centerLat, centerLon]);

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

    // Prepare alert markers layer (added after other layers so it renders on top)
    let alertLayer: ScatterplotLayer | null = null;
    if (alerts && alerts.length) {
      const severityColors: Record<string, [number, number, number, number]> = {
        critical: [220, 38, 38, 200],
        high: [252, 165, 3, 200],
        medium: [234, 179, 8, 200],
        low: [59, 130, 246, 200],
        info: [16, 185, 129, 200]
      };
      alertLayer = new ScatterplotLayer({
        id: 'alert-markers',
        data: alerts.filter(a => a.location),
        getPosition: (a: Alert) => [a.location!.longitude, a.location!.latitude],
        getFillColor: (a: Alert) => severityColors[a.severity] || severityColors['medium'],
        getRadius: () => {
          const pulse = Math.sin((alertPulse / 60) * Math.PI * 2) * 0.5 + 0.5;
          return 8 + pulse * 6; // 8–14 px
        },
        updateTriggers: { getRadius: alertPulse },
        radiusUnits: 'pixels',
        parameters: { depthTest: false }, // ensure markers draw above extruded layers
        pickable: true,
        onClick: info => {
          const alert = info.object as Alert;
          if (alert && onAlertSelect) onAlertSelect(alert);
        }
      });
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
    // Add selected analytical layer
    // ... existing switch above builds into baseLayers

    // Finally add alert markers so they render on top
    if (alertLayer) baseLayers.push(alertLayer);

    return baseLayers;
  }, [currentLayer, heatmapData, scatterData, flightPaths, tripsData, alerts, alertPulse, onAlertSelect]);
  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`} style={{ backgroundColor: '#0f172a' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        getTooltip={(info: any) => {
          if (info.layer && info.layer.id === 'alert-markers' && info.object) {
            const a = info.object as Alert;
            const date = new Date(a.timestamp).toLocaleString();
            return {
              html: `<div style="max-width:260px;padding:6px;background-color:rgba(15,23,42,0.85);color:#e5e7eb;border-radius:6px;font-size:12px;">
                      <div style="font-weight:600;margin-bottom:2px;">${a.title}</div>
                      <div><strong>Severity:</strong> ${a.severity}</div>
                      <div style="margin-top:2px;">${a.description}</div>
                      <div style="margin-top:2px;font-size:10px;color:#94a3b8;">${date}</div>
                    </div>`
            } as any;
          }
          return null;
        }}
      />
      {/* Layer selection controls */}
      <div
        ref={controlsRef}
        className="absolute z-30 flex flex-col gap-2 p-1 bg-slate-900/70 backdrop-blur-md rounded-lg border border-cyan-400/30 cursor-move"
        style={{
          boxShadow: '0 0 15px rgba(6,182,212,0.3)',
          top: controlsPos.top,
          left: controlsPos.left
        }}
        onMouseDown={makeDragStartHandler(controlsRef, setControlsPos)}
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
        <div className="mt-1 flex gap-1">
          <button
            className="px-2 py-1 text-[10px] rounded bg-slate-800/60 text-cyan-200 hover:bg-slate-700/60"
            title="Snap panels to nearest corners"
            onClick={() => {
              const mapEl = containerRef.current;
              if (!mapEl) return;
              const mapRect = mapEl.getBoundingClientRect();
              const legEl = legendRef.current!;
              const ctlEl = controlsRef.current!;
              if (legEl) {
                const next = maybeSnapToCorner(legendPos, legEl, mapRect);
                setLegendPos(next);
                localStorage.setItem('deck.legendPos', JSON.stringify(next));
              }
              if (ctlEl) {
                const next = maybeSnapToCorner(controlsPos, ctlEl, mapRect);
                setControlsPos(next);
                localStorage.setItem('deck.controlsPos', JSON.stringify(next));
              }
            }}
          >
            Snap
          </button>
          <button
            className="px-2 py-1 text-[10px] rounded bg-slate-800/60 text-rose-200 hover:bg-slate-700/60"
            title="Reset panel layout"
            onClick={() => {
              const mapEl = containerRef.current;
              if (!mapEl) return;
              const mapRect = mapEl.getBoundingClientRect();
              const legEl = legendRef.current;
              const ctlEl = controlsRef.current;
              if (legEl) {
                const r = legEl.getBoundingClientRect();
                const next = { top: 64, left: Math.max(MARGIN, mapRect.width - r.width - MARGIN) };
                setLegendPos(next);
                localStorage.setItem('deck.legendPos', JSON.stringify(next));
              }
              if (ctlEl) {
                const r = ctlEl.getBoundingClientRect();
                const next = { top: Math.max(MARGIN, mapRect.height / 2 - r.height / 2), left: Math.max(MARGIN, mapRect.width - r.width - MARGIN) };
                setControlsPos(next);
                localStorage.setItem('deck.controlsPos', JSON.stringify(next));
              }
            }}
          >
            Reset
          </button>
        </div>
      </div>
      {/* Map legend (click-through container with data summary for current overlay) */}
      <div
        ref={legendRef}
        className="absolute z-10 pointer-events-none"
        style={{ maxWidth: '280px', top: legendPos.top, left: legendPos.left }}
        onMouseDown={makeDragStartHandler(legendRef, setLegendPos)}
      >
        {/* legend box is interactive; higher contrast for readability */}
        <div
          className="rounded-lg border shadow-xl pointer-events-auto text-sm select-none"
          style={{
            backgroundColor: 'rgba(2,6,23,0.92)',
            borderColor: LAYER_COLORS[currentLayer],
            color: '#fde68a'
          }}
        >
          <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-2 cursor-move"
               onMouseDown={makeDragStartHandler(legendRef, setLegendPos)}>
            <div className="font-semibold tracking-wide">Legend</div>
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-sm" style={{ width: 16, height: 8, backgroundColor: LAYER_COLORS[currentLayer] }} />
              <div className="text-xs uppercase" style={{ color: '#a7f3d0' }}>{LAYER_LABELS[currentLayer]}</div>
              <button
                aria-label={legendCollapsed ? 'Expand legend' : 'Collapse legend'}
                className="ml-1 text-xs px-2 py-0.5 rounded bg-slate-800/70 text-cyan-200 hover:bg-slate-700/70 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setLegendCollapsed(v => { const nv = !v; localStorage.setItem('deck.legendCollapsed', JSON.stringify(nv)); return nv; }); }}
              >
                {legendCollapsed ? '▾' : '▴'}
              </button>
            </div>
          </div>

          <AnimatePresence initial={false} mode="wait">
            {!legendCollapsed && (
              <motion.div
                key={currentLayer}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="px-3 pb-3"
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {layerStats.items.map(item => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <span className="text-[12px]" style={{ color: '#93c5fd' }}>{item.label}</span>
                      <motion.span
                        className="font-semibold"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.value}
                      </motion.span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default ExecutiveMapDeck;
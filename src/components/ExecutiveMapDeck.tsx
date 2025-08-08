import { useState, useMemo } from 'react';
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer, ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
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

interface ExecutiveMapDeckProps {
  className?: string;
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

export function ExecutiveMapDeck({ className = '' }: ExecutiveMapDeckProps) {
  // Initial view centered on Baltimore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewState, setViewState] = useState<MapViewState>({
    latitude: 39.29,
    longitude: -76.61,
    zoom: 10.5,
    pitch: 45,
    bearing: 0
  });
  const [currentLayer, setCurrentLayer] = useState<LayerType>('geojson');
  // Generate mock data once
  const heatmapData = useMemo<HeatmapPoint[]>(() => generateHeatmapData(250, 10), []);
  const scatterData = useMemo<ScatterPoint[]>(() => generateScatterData(350, 11), []);
  const flightPaths = useMemo<FlightPath[]>(() => generateFlightPaths(25, 12), []);
  const tripsData = useMemo<Trip[]>(() => generateTrips(10, 40, 13), []);
  // Build deck.gl layers based on selected visualization
  const layers = useMemo(() => {
    const baseLayers: any[] = [];
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
            radiusPixels: 50,
            intensity: 1,
            threshold: 0.03,
            aggregation: 'SUM'
          })
        );
        break;
      case 'hexagon':
        baseLayers.push(
          new HexagonLayer({
            id: 'hexagon-layer',
            data: heatmapData,
            getPosition: (d: HeatmapPoint) => d.position,
            radius: 0.01,
            elevationScale: 20,
            extruded: true,
            coverage: 0.8,
            lowerPercentile: 50,
            opacity: 0.6
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
            trailLength: 600,
            currentTime: Date.now() % 1000,
            shadowEnabled: false
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
    </div>
  );
}

export default ExecutiveMapDeck;
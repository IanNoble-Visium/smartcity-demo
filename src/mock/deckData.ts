// Data generation utilities for deck.gl visualizations
// This module provides mock data for the Baltimore Executive Dashboard deck.gl layers.
// It generates random points within a predefined bounding box covering
// Baltimore, along with simple flight paths and trip routes. These values
// are deterministic for a given seed to help maintain consistent visuals
// during development. The polygon describing the Baltimore metro area is
// intentionally simplified to a rectangular boundary since real GIS data
// is outside the scope of this demo.

export interface HeatmapPoint {
  position: [number, number];
  weight: number;
}

export interface ScatterPoint {
  position: [number, number];
  population: number;
}

export interface FlightPath {
  sourcePosition: [number, number];
  targetPosition: [number, number];
  name: string;
  value: number;
}

export interface Trip {
  waypoints: [number, number][];
  timestamps: number[];
}

// Define a simple bounding box for the Baltimore metropolitan area
const BALTIMORE_BOUNDS = {
  north: 39.3729,
  south: 39.1970,
  east: -76.5290,
  west: -76.7900
};

// Generate a pseudo‑random number generator with a seed
function seededRandom(seed: number) {
  let value = seed;
  return function () {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

// Helper to generate a random geographic point within the bounding box
function randomPosition(rng: () => number): [number, number] {
  const lat = BALTIMORE_BOUNDS.south + (BALTIMORE_BOUNDS.north - BALTIMORE_BOUNDS.south) * rng();
  const lon = BALTIMORE_BOUNDS.west + (BALTIMORE_BOUNDS.east - BALTIMORE_BOUNDS.west) * rng();
  return [lon, lat];
}

// Create GeoJSON polygon representing Baltimore bounds
export const baltimorePolygon: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: 'Feature',
  properties: { name: 'Baltimore Bounding Box' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [BALTIMORE_BOUNDS.west, BALTIMORE_BOUNDS.south],
        [BALTIMORE_BOUNDS.east, BALTIMORE_BOUNDS.south],
        [BALTIMORE_BOUNDS.east, BALTIMORE_BOUNDS.north],
        [BALTIMORE_BOUNDS.west, BALTIMORE_BOUNDS.north],
        [BALTIMORE_BOUNDS.west, BALTIMORE_BOUNDS.south]
      ]
    ]
  }
};

// Generate heatmap points
export function generateHeatmapData(count = 200, seed = 1): HeatmapPoint[] {
  const rng = seededRandom(seed);
  const data: HeatmapPoint[] = [];
  for (let i = 0; i < count; i++) {
    const [lon, lat] = randomPosition(rng);
    data.push({
      position: [lon, lat],
      weight: 0.5 + rng() // weight between 0.5 and 1.5
    });
  }
  return data;
}

// Generate scatterplot points representing population density
export function generateScatterData(count = 300, seed = 2): ScatterPoint[] {
  const rng = seededRandom(seed);
  const data: ScatterPoint[] = [];
  for (let i = 0; i < count; i++) {
    const [lon, lat] = randomPosition(rng);
    data.push({
      position: [lon, lat],
      population: 50 + rng() * 500 // random population between 50 and 550
    });
  }
  return data;
}

// Generate flight paths connecting random locations across the city
export function generateFlightPaths(count = 20, seed = 3): FlightPath[] {
  const rng = seededRandom(seed);
  const paths: FlightPath[] = [];
  for (let i = 0; i < count; i++) {
    const [lon1, lat1] = randomPosition(rng);
    const [lon2, lat2] = randomPosition(rng);
    paths.push({
      sourcePosition: [lon1, lat1],
      targetPosition: [lon2, lat2],
      name: `Flight ${i + 1}`,
      value: 1 + rng() * 5
    });
  }
  return paths;
}

// Generate trip data for animated vehicle movements
export function generateTrips(count = 8, pointsPerTrip = 30, seed = 4): Trip[] {
  const rng = seededRandom(seed);
  const trips: Trip[] = [];
  for (let i = 0; i < count; i++) {
    const start = randomPosition(rng);
    const end = randomPosition(rng);
    const waypoints: [number, number][] = [];
    const timestamps: number[] = [];
    for (let j = 0; j < pointsPerTrip; j++) {
      const t = j / (pointsPerTrip - 1);
      // Linear interpolation between start and end
      const lon = start[0] + (end[0] - start[0]) * t;
      const lat = start[1] + (end[1] - start[1]) * t;
      waypoints.push([lon, lat]);
      timestamps.push(j * (1000 / pointsPerTrip));
    }
    trips.push({ waypoints, timestamps });
  }
  return trips;
}
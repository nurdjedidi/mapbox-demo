import { MAPBOX_TOKEN } from "./config";

export interface RouteOptions {
  profile?: "driving" | "walking" | "cycling" | "driving-traffic";
  alternatives?: boolean;
  steps?: boolean;
  geometries?: "geojson" | "polyline" | "polyline6";
}

export interface RouteData {
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  duration: number;
  distance: number;
  legs?: Array<{
    steps?: Array<{
      maneuver: {
        instruction: string;
        type: string;
        modifier?: string;
      };
      distance: number;
      duration: number;
      name: string;
    }>;
  }>;
}

export async function getRoute(
  start: [number, number],
  end: [number, number],
  options: RouteOptions = {}
): Promise<RouteData[]> {
  const {
    profile = "driving",
    alternatives = true,
    steps = true,
    geometries = "geojson",
  } = options;

  const coords = `${start[0]},${start[1]};${end[0]},${end[1]}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}?alternatives=${alternatives}&steps=${steps}&geometries=${geometries}&access_token=${MAPBOX_TOKEN}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error("No route found");
  }

  return data.routes;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

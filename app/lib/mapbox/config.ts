export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

export const DEFAULT_MAP_STYLE = "mapbox://styles/mapbox/navigation-night-v1";

export const MAP_STYLES = {
  standard: "mapbox://styles/mapbox/standard",
  dark: "mapbox://styles/mapbox/dark-v11",
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  navigation: "mapbox://styles/mapbox/navigation-night-v1",
} as const;

export type CityKey = "dubai" | "casablanca";

export interface CityConfig {
  name: string;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  description: string;
}

export const CITIES: Record<CityKey, CityConfig> = {
  dubai: {
    name: "Dubai",
    center: [55.2744, 25.1972],
    zoom: 16,
    pitch: 62,
    bearing: -17.6,
    description: "Skyline futuriste & gratte-ciels spectaculaires",
  },
  casablanca: {
    name: "Casablanca",
    center: [-7.6186, 33.5893],
    zoom: 15.5,
    pitch: 60,
    bearing: 0,
    description: "Mix ancien & moderne, Mosquee Hassan II",
  },
};

export const DEFAULT_CITY: CityKey = "dubai";
export const DEFAULT_CENTER: [number, number] = CITIES.dubai.center;
export const DEFAULT_ZOOM = 13;
export const DEFAULT_PITCH = 60;
export const DEFAULT_BEARING = -17.6;

export const ANIMATION_DURATION = 15000; // 15s for immersive drive animation
export const ROUTE_LINE_WIDTH = 4;
export const ROUTE_COLOR = "#00D9FF";
export const ROUTE_ALT_COLOR = "#FFB800";

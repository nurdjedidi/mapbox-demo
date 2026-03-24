import { createContext, useContext } from "react";
import type mapboxgl from "mapbox-gl";

interface MapContextValue {
  map: mapboxgl.Map | null;
  setMap: (map: mapboxgl.Map | null) => void;
}

export const MapContext = createContext<MapContextValue>({
  map: null,
  setMap: () => {},
});

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
}

import { useState, useEffect } from "react";
import { MAPBOX_TOKEN } from "~/lib/mapbox/config";
import type { Tanker } from "./TankersLayer";

export interface TruckRoute {
  coords: [number, number][];
  distance_m: number;
  duration_s: number;
}

async function fetchRoute(
  origin: [number, number],
  dest: [number, number],
  signal: AbortSignal
): Promise<TruckRoute | null> {
  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${origin[0]},${origin[1]};${dest[0]},${dest[1]}` +
      `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url, { signal });
    const data = await res.json();
    if (!data.routes?.length) return null;
    const route = data.routes[0];
    return {
      coords: route.geometry.coordinates as [number, number][],
      distance_m: route.legs[0].distance,
      duration_s: route.legs[0].duration,
    };
  } catch {
    return null;
  }
}

export function useFleetRoutes(tankers: Tanker[], hubCoords: [number, number]) {
  const [routes, setRoutes] = useState<Map<string, TruckRoute>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tankers.length === 0) return;
    const abort = new AbortController();

    Promise.allSettled(
      tankers.map((t) => fetchRoute(t.route[0], hubCoords, abort.signal))
    ).then((results) => {
      if (abort.signal.aborted) return;
      const map = new Map<string, TruckRoute>();
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) {
          map.set(tankers[i].id, r.value);
        }
      });
      setRoutes(map);
      setLoading(false);
    });

    return () => abort.abort();
  }, []); // intentional: only run once on mount

  return { routes, loading };
}

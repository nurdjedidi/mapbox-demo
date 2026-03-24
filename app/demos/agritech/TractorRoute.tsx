import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";

interface TractorRouteProps {
  waypoints: [number, number][];
  isPlaying: boolean;
  onStop: () => void;
}

function interpolatePosition(coords: [number, number][], progress: number): [number, number] {
  const total = coords.length - 1;
  const sp = progress * total;
  const idx = Math.min(Math.floor(sp), total - 1);
  const t = sp - idx;
  const from = coords[idx];
  const to = coords[Math.min(idx + 1, coords.length - 1)];
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}

function getBearing(from: [number, number], to: [number, number]): number {
  const dLon = ((to[0] - from[0]) * Math.PI) / 180;
  const lat1 = (from[1] * Math.PI) / 180;
  const lat2 = (to[1] * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function createTractorEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = "display:flex;align-items:center;justify-content:center;";
  el.innerHTML = `
    <div style="
      width:36px;height:36px;border-radius:8px;background:#22C55E;
      display:flex;align-items:center;justify-content:center;
      border:2.5px solid rgba(255,255,255,0.9);
      box-shadow:0 3px 12px rgba(0,0,0,0.4),0 0 16px #22C55E66;
    ">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 4h9l1 7H3z"/>
        <circle cx="7" cy="17" r="3"/>
        <circle cx="17" cy="17" r="3"/>
        <path d="M13 11h5l2 6"/>
      </svg>
    </div>
  `;
  return el;
}

export function TractorRoute({ waypoints, isPlaying, onStop }: TractorRouteProps) {
  const { map } = useMap();
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const initialized = useRef(false);
  const DURATION = 20000;

  // Setup route + trail
  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    const routeId = "tractor-route";
    const trailId = "tractor-trail";

    try {
      if (map.getLayer(routeId)) map.removeLayer(routeId);
      if (map.getSource(routeId)) map.removeSource(routeId);
      if (map.getLayer(trailId)) map.removeLayer(trailId);
      if (map.getSource(trailId)) map.removeSource(trailId);
    } catch {}

    map.addSource(routeId, {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: waypoints } },
    });
    map.addLayer({
      id: routeId, type: "line", source: routeId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#22C55E", "line-width": 3, "line-opacity": 0.35, "line-dasharray": [2, 2] },
    });

    map.addSource(trailId, {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [waypoints[0]] } },
    });
    map.addLayer({
      id: trailId, type: "line", source: trailId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#22C55E", "line-width": 4, "line-opacity": 0.85 },
    });

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      const el = createTractorEl();
      markerRef.current = new mapboxgl.Marker({ element: el, rotationAlignment: "map", pitchAlignment: "map" })
        .setLngLat(waypoints[0])
        .addTo(map);
    });

    initialized.current = true;

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      markerRef.current?.remove();
      markerRef.current = null;
      try {
        if (map.getLayer(trailId)) map.removeLayer(trailId);
        if (map.getSource(trailId)) map.removeSource(trailId);
        if (map.getLayer(routeId)) map.removeLayer(routeId);
        if (map.getSource(routeId)) map.removeSource(routeId);
      } catch {}
      initialized.current = false;
    };
  }, [map, waypoints]);

  // Animation loop
  useEffect(() => {
    if (!map || !isPlaying || !initialized.current) return;

    startRef.current = performance.now();

    function animate(now: number) {
      if (!startRef.current) return;
      const progress = Math.min((now - startRef.current) / DURATION, 1);
      const pos = interpolatePosition(waypoints, progress);
      const nextPos = interpolatePosition(waypoints, Math.min(progress + 0.01, 0.99));
      const bearing = getBearing(pos, nextPos);

      markerRef.current?.setLngLat(pos);
      markerRef.current?.setRotation(bearing - 90);

      // Trail update
      const trailIdx = Math.floor(progress * (waypoints.length - 1)) + 1;
      const trail = waypoints.slice(0, trailIdx);
      trail.push(pos);
      try {
        const src = map!.getSource("tractor-trail") as mapboxgl.GeoJSONSource;
        if (src) src.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: trail } });
      } catch {}

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        onStop();
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      startRef.current = null;
    };
  }, [map, isPlaying]);

  return null;
}

import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";

export interface FleetVehicle {
  id: number;
  name: string;
  type: "diesel" | "electric";
  waypoints: [number, number][];
  co2_per_km: number;
  fuel_liters_per_100km?: number;
  battery_percent?: number;
  autonomy_km?: number;
}

interface VehicleLayerProps {
  vehicles: FleetVehicle[];
  isPlaying: boolean;
  speed: number;
  onProgress?: (p: number) => void;
}

function interpolate(coords: [number, number][], progress: number): [number, number] {
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

function createVehicleEl(v: FleetVehicle): HTMLDivElement {
  const isDiesel = v.type === "diesel";
  const color = isDiesel ? "#6B7280" : "#22C55E";
  const badge = isDiesel
    ? `<span style="font-size:8px;font-weight:700;color:#F87171;font-family:'JetBrains Mono',monospace;">${(v.co2_per_km * 10).toFixed(0)}g CO₂</span>`
    : `<span style="font-size:8px;font-weight:700;color:#22C55E;font-family:'JetBrains Mono',monospace;">⚡${v.battery_percent ?? 0}%</span>`;

  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:default;";
  el.innerHTML = `
    <div style="background:rgba(10,14,26,0.85);border:1px solid ${color}55;border-radius:6px;padding:2px 5px;margin-bottom:3px;">
      ${badge}
    </div>
    <div style="
      width:32px;height:32px;border-radius:7px;display:flex;align-items:center;justify-content:center;
      background:${color}22;border:2px solid ${color};
      box-shadow:0 2px 8px rgba(0,0,0,0.35),0 0 10px ${color}44;
    ">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h1"/>
        <path d="M15 18H9"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
        <circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
      </svg>
    </div>
  `;
  return el;
}

export function VehicleLayer({ vehicles, isPlaying, speed, onProgress }: VehicleLayerProps) {
  const { map } = useMap();
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const accRef = useRef(0);

  // Setup routes + markers
  useEffect(() => {
    if (!map) return;

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      // Remove old
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      vehicles.forEach((v) => {
        const isDiesel = v.type === "diesel";
        const trailColor = isDiesel ? "#9CA3AF" : "#22C55E";
        const routeId = `gf-route-${v.id}`;
        const trailId = `gf-trail-${v.id}`;

        try { if (map.getLayer(routeId)) map.removeLayer(routeId); if (map.getSource(routeId)) map.removeSource(routeId); } catch {}
        try { if (map.getLayer(trailId)) map.removeLayer(trailId); if (map.getSource(trailId)) map.removeSource(trailId); } catch {}

        map.addSource(routeId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: v.waypoints } },
        });
        map.addLayer({
          id: routeId, type: "line", source: routeId,
          paint: { "line-color": trailColor, "line-width": 2, "line-opacity": 0.25, "line-dasharray": [2, 2] },
        });

        map.addSource(trailId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [v.waypoints[0]] } },
        });
        map.addLayer({
          id: trailId, type: "line", source: trailId,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": trailColor, "line-width": 3, "line-opacity": 0.85 },
        });

        const el = createVehicleEl(v);
        const marker = new mapboxgl.Marker({ element: el, rotationAlignment: "map", pitchAlignment: "map" })
          .setLngLat(v.waypoints[0])
          .addTo(map);
        markersRef.current.push(marker);
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      try {
        vehicles.forEach((v) => {
          if (map.getLayer(`gf-route-${v.id}`)) map.removeLayer(`gf-route-${v.id}`);
          if (map.getSource(`gf-route-${v.id}`)) map.removeSource(`gf-route-${v.id}`);
          if (map.getLayer(`gf-trail-${v.id}`)) map.removeLayer(`gf-trail-${v.id}`);
          if (map.getSource(`gf-trail-${v.id}`)) map.removeSource(`gf-trail-${v.id}`);
        });
      } catch {}
    };
  }, [map, vehicles]);

  // Animation
  useEffect(() => {
    if (!map || !isPlaying || markersRef.current.length === 0) return;
    startRef.current = performance.now();
    const duration = 30000 / speed;

    function animate(now: number) {
      if (!startRef.current) return;
      const progress = (accRef.current + (now - startRef.current) / duration) % 1;

      vehicles.forEach((v, i) => {
        const marker = markersRef.current[i];
        if (!marker) return;
        const pos = interpolate(v.waypoints, progress);
        const next = interpolate(v.waypoints, Math.min(progress + 0.015, 0.99));
        marker.setLngLat(pos);
        marker.setRotation(getBearing(pos, next) - 90);

        const trailIdx = Math.floor(progress * (v.waypoints.length - 1)) + 1;
        const trail = [...v.waypoints.slice(0, trailIdx), pos];
        try {
          const src = map!.getSource(`gf-trail-${v.id}`) as mapboxgl.GeoJSONSource;
          if (src) src.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: trail } });
        } catch {}
      });

      onProgress?.(progress);
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (startRef.current) {
        accRef.current = (accRef.current + (performance.now() - startRef.current) / (30000 / speed)) % 1;
      }
      if (animRef.current) cancelAnimationFrame(animRef.current);
      startRef.current = null;
    };
  }, [map, isPlaying, speed]);

  return null;
}

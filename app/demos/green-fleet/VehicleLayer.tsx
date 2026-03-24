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

interface VehicleElements {
  el: HTMLDivElement;
  puck: HTMLDivElement;
}

function createVehicleEl(v: FleetVehicle): VehicleElements {
  const isDiesel = v.type === "diesel";
  const color = isDiesel ? "#6B7280" : "#22C55E";
  const badgeText = isDiesel
    ? `${(v.co2_per_km * 10).toFixed(0)}g CO₂`
    : `⚡ ${v.battery_percent ?? 0}%`;
  const badgeColor = isDiesel ? "#F87171" : "#22C55E";

  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:default;";

  // Badge — always readable (no rotation)
  const badge = document.createElement("div");
  badge.style.cssText = `
    background:rgba(10,14,26,0.9);border-radius:10px;padding:2px 7px;margin-bottom:4px;
    border:1px solid ${color}44;white-space:nowrap;
  `;
  badge.innerHTML = `<span style="font-size:9px;font-weight:700;color:${badgeColor};font-family:'JetBrains Mono',monospace;">${badgeText}</span>`;
  el.appendChild(badge);

  // Puck — rotates to show bearing
  const puck = document.createElement("div");
  puck.style.cssText = `
    width:28px;height:28px;border-radius:50%;position:relative;
    background:radial-gradient(circle at 40% 35%, ${color}44, ${color}11);
    border:2.5px solid ${color};
    box-shadow:0 2px 10px rgba(0,0,0,0.4), 0 0 12px ${color}33;
    transition:transform 0.1s linear;
  `;

  // Direction arrow (triangle pointing up, rotates with puck)
  const arrow = document.createElement("div");
  arrow.style.cssText = `
    position:absolute;top:-5px;left:50%;transform:translateX(-50%);
    width:0;height:0;
    border-left:5px solid transparent;border-right:5px solid transparent;
    border-bottom:6px solid ${color};
    filter:drop-shadow(0 0 3px ${color}88);
  `;
  puck.appendChild(arrow);

  // Inner dot
  const dot = document.createElement("div");
  dot.style.cssText = `
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:10px;height:10px;border-radius:50%;
    background:${color};
    box-shadow:0 0 6px ${color}88;
  `;
  puck.appendChild(dot);

  el.appendChild(puck);

  // Name label
  const name = document.createElement("div");
  name.style.cssText = `font-size:8px;color:rgba(255,255,255,0.35);margin-top:2px;font-family:'JetBrains Mono',monospace;`;
  name.textContent = v.name;
  el.appendChild(name);

  return { el, puck };
}

export function VehicleLayer({ vehicles, isPlaying, speed, onProgress }: VehicleLayerProps) {
  const { map } = useMap();
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const pucksRef = useRef<HTMLDivElement[]>([]);
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
      pucksRef.current = [];

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

        const { el, puck } = createVehicleEl(v);
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(v.waypoints[0])
          .addTo(map);
        markersRef.current.push(marker);
        pucksRef.current.push(puck);
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      pucksRef.current = [];
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
        const puck = pucksRef.current[i];
        if (!marker) return;
        const pos = interpolate(v.waypoints, progress);
        const next = interpolate(v.waypoints, Math.min(progress + 0.015, 0.99));
        marker.setLngLat(pos);

        // Rotate only the puck, not the whole marker
        if (puck) {
          const bearing = getBearing(pos, next);
          puck.style.transform = `rotate(${bearing}deg)`;
        }

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

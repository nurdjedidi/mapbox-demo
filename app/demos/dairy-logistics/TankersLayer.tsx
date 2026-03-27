import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";
import { getMapboxGL } from "~/lib/mapbox/mapboxSingleton";
import * as turf from "@turf/turf";

export interface Tanker {
  id: string;
  name: string;
  temp_celsius: number;
  fill_pct: number;
  route: [number, number][];
}

function getPositionAndBearing(coords: [number, number][], p: number): { pos: [number, number]; bearing: number } {
  if (coords.length < 2) return { pos: coords[0] || [0, 0], bearing: 0 };
  const line = turf.lineString(coords);
  const len = turf.length(line);
  const dist = p * len;
  
  const pt = turf.along(line, dist);
  const pos = pt.geometry.coordinates as [number, number];
  
  // To get bearing, take a point slightly ahead
  const aheadDist = Math.min(dist + 0.05, len); // 50m ahead or end of line
  const aheadPt = turf.along(line, aheadDist);
  const aheadPos = aheadPt.geometry.coordinates as [number, number];
  
  // If we are at the very end, take a point slightly behind
  if (dist >= len - 0.01) {
    const behindDist = Math.max(0, len - 0.1);
    const behindPt = turf.along(line, behindDist);
    const behindPos = behindPt.geometry.coordinates as [number, number];
    return { pos, bearing: turf.bearing(behindPos, pos) };
  }

  return { pos, bearing: turf.bearing(pos, aheadPos) };
}

export function tempColor(temp: number): string {
  if (temp <= 4) return "#22D3EE";
  if (temp <= 6) return "#F97316";
  return "#FF1744";
}

function createNavArrow(t: Tanker): HTMLDivElement {
  const color = tempColor(t.temp_celsius);
  const isAlert = t.temp_celsius > 4;
  const w = isAlert ? 30 : 22;
  const h = Math.round(w * 1.3);

  const el = document.createElement("div");
  el.style.cssText = "display:flex;align-items:center;justify-content:center;cursor:pointer;";
  el.innerHTML = `
    <style>
      ${isAlert ? `
      @keyframes nav-ring-${t.id} {
        0%   { transform:scale(0.75);opacity:0.8; }
        100% { transform:scale(2.4); opacity:0; }
      }
      .nav-ring-${t.id} {
        position:absolute;width:${w}px;height:${w}px;border-radius:50%;
        border:2px solid ${color};
        animation:nav-ring-${t.id} 1.4s ease-out infinite;
        pointer-events:none;
      }` : ""}
    </style>
    <div style="position:relative;display:flex;align-items:center;justify-content:center;" title="${t.name} · ${t.temp_celsius}°C">
      ${isAlert ? `<div class="nav-ring-${t.id}"></div>` : ""}
      <svg viewBox="0 0 28 36" width="${w}" height="${h}"
           style="filter:drop-shadow(0 0 ${isAlert ? 6 : 3}px ${color})drop-shadow(0 1px 3px rgba(0,0,0,0.7));"
           xmlns="http://www.w3.org/2000/svg">
        <path d="M14 1 L27 35 L14 27 L1 35 Z" fill="${color}"/>
        <path d="M14 7 L21 31 L14 25 L7 31 Z" fill="white" opacity="0.22"/>
      </svg>
    </div>`;
  return el;
}

interface TankersLayerProps {
  tankers: Tanker[];
  isPlaying: boolean;
  selectedTankerId: string | null;
  onSelectTanker: (id: string | null) => void;
  /** Pre-fetched real road routes from useFleetRoutes */
  realRoutes: Map<string, [number, number][]>;
}

const START_OFFSETS = [0, 0.12, 0.25, 0.38, 0.5, 0.62, 0.75, 0.88];
const DURATIONS = [28000, 22000, 18000, 32000, 38000, 26000, 16000, 34000];

export function TankersLayer({ tankers, isPlaying, selectedTankerId, onSelectTanker, realRoutes }: TankersLayerProps) {
  const { map } = useMap();
  const markersRef  = useRef<mapboxgl.Marker[]>([]);
  const elsRef      = useRef<HTMLDivElement[]>([]);
  const animRef     = useRef<number>(0);
  const progressRef = useRef<number[]>(START_OFFSETS.slice());
  const lastTimeRef = useRef<number>(0);
  const frameRef    = useRef<number>(0);
  const realRoutesRef = useRef(realRoutes);
  const selectedIdRef = useRef<string | null>(selectedTankerId);

  useEffect(() => { realRoutesRef.current = realRoutes; }, [realRoutes]);
  useEffect(() => { selectedIdRef.current = selectedTankerId; }, [selectedTankerId]);

  // Update arrow visuals on selection change
  useEffect(() => {
    tankers.forEach((tanker, i) => {
      const el = elsRef.current[i];
      if (el) el.innerHTML = createNavArrow(tanker).innerHTML;
    });
  }, [selectedTankerId, tankers]);

  // ── Create markers + route/trail layers (runs once) ──────────────────────
  useEffect(() => {
    if (!map || tankers.length === 0) return;

    getMapboxGL().then(({ default: mapboxgl }) => {
      tankers.forEach((tanker, i) => {
        const routeId = `tanker-route-${tanker.id}`;
        const trailId = `tanker-trail-${tanker.id}`;
        try {
          if (map.getLayer(trailId))  map.removeLayer(trailId);
          if (map.getSource(trailId)) map.removeSource(trailId);
          if (map.getLayer(routeId))  map.removeLayer(routeId);
          if (map.getSource(routeId)) map.removeSource(routeId);
        } catch {}

        map.addSource(routeId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: tanker.route } },
        });
        map.addLayer({
          id: routeId, type: "line", source: routeId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": tempColor(tanker.temp_celsius), "line-width": 1.5, "line-opacity": 0.18, "line-dasharray": [3, 3] },
        });

        map.addSource(trailId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [tanker.route[0]] } },
        });
        map.addLayer({
          id: trailId, type: "line", source: trailId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": tempColor(tanker.temp_celsius), "line-width": 2.5, "line-opacity": 0.65 },
        });

        const el = createNavArrow(tanker);
        const { pos: startPos } = getPositionAndBearing(tanker.route, progressRef.current[i]);
        const popup = new mapboxgl.Popup({ offset: 28, closeButton: false }).setHTML(`
          <div style="padding:8px 12px;background:#0a0e1a;border:1px solid rgba(59,130,246,0.3);border-radius:8px;min-width:160px;">
            <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:.08em;margin-bottom:4px;">${tanker.id}</div>
            <div style="font-size:13px;color:#fff;font-weight:600;margin-bottom:6px;">${tanker.name}</div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.5);margin-top:2px;">
              <span>Température</span><span style="color:${tempColor(tanker.temp_celsius)};font-family:monospace;font-weight:700;">${tanker.temp_celsius}°C</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.5);margin-top:2px;">
              <span>Remplissage</span><span style="color:#22C55E;font-family:monospace;font-weight:700;">${tanker.fill_pct}%</span>
            </div>
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.05);font-size:10px;color:#3B82F6;text-align:center;">
              Cliquer pour mode navigation
            </div>
          </div>`);

        const marker = new mapboxgl.Marker({ element: el, rotationAlignment: "map", pitchAlignment: "map" })
          .setLngLat(startPos).setPopup(popup).addTo(map);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectTanker(selectedIdRef.current === tanker.id ? null : tanker.id);
        });
        markersRef.current[i] = marker;
        elsRef.current[i] = el;
      });
    });

    return () => {
      cancelAnimationFrame(animRef.current);
      markersRef.current.forEach((m) => m?.remove());
      markersRef.current = [];
      elsRef.current = [];
      tankers.forEach((t) => {
        try {
          if (map.getLayer(`tanker-trail-${t.id}`))  map.removeLayer(`tanker-trail-${t.id}`);
          if (map.getSource(`tanker-trail-${t.id}`)) map.removeSource(`tanker-trail-${t.id}`);
          if (map.getLayer(`tanker-route-${t.id}`))  map.removeLayer(`tanker-route-${t.id}`);
          if (map.getSource(`tanker-route-${t.id}`)) map.removeSource(`tanker-route-${t.id}`);
        } catch {}
      });
    };
  }, [map, tankers, onSelectTanker]);

  // Gentle overview pan when truck selected
  useEffect(() => {
    if (!map || !selectedTankerId) return;
    const idx = tankers.findIndex((t) => t.id === selectedTankerId);
    if (idx === -1) return;
    const route = realRoutesRef.current.get(selectedTankerId) ?? tankers[idx].route;
    const { pos } = getPositionAndBearing(route, progressRef.current[idx]);
    map.flyTo({ center: pos, zoom: 11.5, pitch: 55, duration: 1200, essential: true });
  }, [map, selectedTankerId, tankers]);

  // Single animation loop
  useEffect(() => {
    if (!map || !isPlaying) { cancelAnimationFrame(animRef.current); return; }
    lastTimeRef.current = performance.now();
    frameRef.current = 0;

    function animate(now: number) {
      if (!map) return;
      const dt = Math.min(now - lastTimeRef.current, 100);
      lastTimeRef.current = now;
      frameRef.current++;
      const frame = frameRef.current;

      tankers.forEach((tanker, i) => {
        const route = realRoutesRef.current.get(tanker.id) ?? tanker.route;
        progressRef.current[i] = (progressRef.current[i] + dt / DURATIONS[i]) % 1;
        const p = progressRef.current[i];
        const { pos, bearing } = getPositionAndBearing(route, p);

        markersRef.current[i]?.setLngLat(pos);
        markersRef.current[i]?.setRotation(bearing);

        if (tanker.id === selectedIdRef.current || frame % 8 === 0) {
          const end = Math.floor(p * (route.length - 1)) + 1;
          const trail = [...route.slice(0, Math.max(end, 1)), pos];
          try {
            (map.getSource(`tanker-trail-${tanker.id}`) as mapboxgl.GeoJSONSource)
              ?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: trail } });
          } catch {}
        }
      });
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isPlaying, tankers]);

  return null;
}

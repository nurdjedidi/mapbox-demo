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

export function tempColor(temp: number): string {
  if (temp <= 4) return "#22D3EE";
  if (temp <= 6) return "#F97316";
  return "#FF1744";
}

function posAt(coords: [number, number][], p: number): { pos: [number, number]; bearing: number } {
  if (!coords || coords.length < 2) return { pos: coords?.[0] ?? [0, 0], bearing: 0 };
  try {
    const line = turf.lineString(coords);
    const totalKm = turf.length(line, { units: "kilometers" });
    if (totalKm <= 0) return { pos: coords[0], bearing: 0 };

    const clampedP = Math.max(0, Math.min(p, 0.9999));
    const distKm   = clampedP * totalKm;
    const lookKm   = Math.min(distKm + 0.1, totalKm * 0.9999);

    const cur  = turf.along(line, distKm, { units: "kilometers" }).geometry.coordinates as [number, number];
    const look = turf.along(line, lookKm, { units: "kilometers" }).geometry.coordinates as [number, number];

    return { pos: cur, bearing: turf.bearing(turf.point(cur), turf.point(look)) };
  } catch {
    const idx = Math.min(Math.floor(p * (coords.length - 1)), coords.length - 2);
    return { pos: coords[idx], bearing: 0 };
  }
}

function createMarkerEl(t: Tanker): HTMLDivElement {
  const color = tempColor(t.temp_celsius);
  const alert = t.temp_celsius > 4;
  const size  = alert ? 28 : 20;
  const el    = document.createElement("div");
  el.style.cssText = "cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;";
  el.innerHTML = `
    ${alert ? `<style>
      @keyframes ring-${t.id}{0%{transform:scale(.8);opacity:.8}100%{transform:scale(2.2);opacity:0}}
      .ring-${t.id}{position:absolute;width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${color};animation:ring-${t.id} 1.4s ease-out infinite;pointer-events:none;}
    </style><div class="ring-${t.id}"></div>` : ""}
    <svg viewBox="0 0 28 36" width="${size}" height="${Math.round(size * 1.3)}"
         style="filter:drop-shadow(0 0 ${alert ? 6 : 3}px ${color})drop-shadow(0 1px 3px rgba(0,0,0,.7));"
         xmlns="http://www.w3.org/2000/svg">
      <path d="M14 1 L27 35 L14 27 L1 35 Z" fill="${color}"/>
      <path d="M14 7 L21 31 L14 25 L7 31 Z" fill="white" opacity=".2"/>
    </svg>`;
  return el;
}

interface TankersLayerProps {
  tankers: Tanker[];
  isPlaying: boolean;
  selectedTankerId: string | null;
  onSelectTanker: (id: string | null) => void;
  realRoutes: Map<string, [number, number][]>;
}

const DURATIONS_MS = [28000, 22000, 18000, 32000, 38000, 26000, 16000, 34000];

export function TankersLayer({ tankers, isPlaying, selectedTankerId, onSelectTanker, realRoutes }: TankersLayerProps) {
  const { map } = useMap();

  const markersRef    = useRef<(mapboxgl.Marker | null)[]>([]);
  const readyRef      = useRef(false);          // true once getMapboxGL() resolves
  const animRef       = useRef<number>(0);
  const progressRef   = useRef<number[]>(tankers.map(() => 0)); // all start at origin
  const lastTimeRef   = useRef<number>(0);
  const frameRef      = useRef<number>(0);

  const isPlayingRef  = useRef(isPlaying);
  const realRoutesRef = useRef(realRoutes);
  const selectedIdRef = useRef(selectedTankerId);
  const onSelectRef   = useRef(onSelectTanker);

  useEffect(() => { isPlayingRef.current  = isPlaying;      }, [isPlaying]);
  useEffect(() => { realRoutesRef.current = realRoutes;     }, [realRoutes]);
  useEffect(() => { selectedIdRef.current = selectedTankerId; }, [selectedTankerId]);
  useEffect(() => { onSelectRef.current   = onSelectTanker; }, [onSelectTanker]);

  useEffect(() => {
    if (isPlaying || !readyRef.current) return;
    tankers.forEach((t, i) => {
      progressRef.current[i] = 0;
      const route = realRoutesRef.current.get(t.id) ?? t.route;
      markersRef.current[i]?.setLngLat(route[0]);
      markersRef.current[i]?.setRotation(0);
    });
  }, [isPlaying, tankers]);

  useEffect(() => {
    if (!map || tankers.length === 0) return;
    let cancelled = false;

    getMapboxGL().then(({ default: mapboxgl }) => {
      if (cancelled) return;
      readyRef.current = true;

      tankers.forEach((t, i) => {
        const routeId = `tanker-route-${t.id}`;
        const trailId = `tanker-trail-${t.id}`;

        for (const id of [trailId, routeId]) {
          try { if (map.getLayer(id)) map.removeLayer(id); } catch {}
          try { if (map.getSource(id)) map.removeSource(id); } catch {}
        }

        const coords = realRoutesRef.current.get(t.id) ?? t.route;

        map.addSource(routeId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } },
        });
        map.addLayer({
          id: routeId, type: "line", source: routeId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": tempColor(t.temp_celsius), "line-width": 1.5, "line-opacity": 0.22, "line-dasharray": [3, 4] },
        });

        map.addSource(trailId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [coords[0], coords[0]] } },
        });
        map.addLayer({
          id: trailId, type: "line", source: trailId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": tempColor(t.temp_celsius), "line-width": 2.5, "line-opacity": 0.7 },
        });

        const el = createMarkerEl(t);

        const popup = new mapboxgl.Popup({ offset: 28, closeButton: false }).setHTML(`
          <div style="padding:8px 12px;background:#0a0e1a;border:1px solid rgba(59,130,246,.3);border-radius:8px;min-width:160px;">
            <div style="font-size:10px;color:rgba(255,255,255,.4);letter-spacing:.08em;margin-bottom:4px;">${t.id}</div>
            <div style="font-size:13px;color:#fff;font-weight:600;margin-bottom:6px;">${t.name}</div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.5);margin-top:2px;">
              <span>Température</span><span style="color:${tempColor(t.temp_celsius)};font-family:monospace;font-weight:700;">${t.temp_celsius}°C</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.5);margin-top:2px;">
              <span>Remplissage</span><span style="color:#22C55E;font-family:monospace;font-weight:700;">${t.fill_pct}%</span>
            </div>
          </div>`);

        const marker = new mapboxgl.Marker({ element: el, rotationAlignment: "map", pitchAlignment: "map" })
          .setLngLat(coords[0])   
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectRef.current(selectedIdRef.current === t.id ? null : t.id);
        });

        markersRef.current[i] = marker;
      });
    });

    return () => {
      cancelled = true;
      readyRef.current = false;
      cancelAnimationFrame(animRef.current);
      markersRef.current.forEach((m) => m?.remove());
      markersRef.current = [];
      tankers.forEach((t) => {
        for (const id of [`tanker-trail-${t.id}`, `tanker-route-${t.id}`]) {
          try { if (map.getLayer(id)) map.removeLayer(id); } catch {}
          try { if (map.getSource(id)) map.removeSource(id); } catch {}
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, tankers]);

  useEffect(() => {
    if (!map || !readyRef.current || realRoutes.size === 0) return;
    tankers.forEach((t, i) => {
      const coords = realRoutes.get(t.id);
      if (!coords || coords.length < 2) return;
      try {
        (map.getSource(`tanker-route-${t.id}`) as mapboxgl.GeoJSONSource)
          ?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
        if (!isPlayingRef.current) {
          markersRef.current[i]?.setLngLat(coords[0]);
        }
      } catch {}
    });
  }, [map, realRoutes, tankers]);

  useEffect(() => {
    if (!map || !selectedTankerId) return;
    const i = tankers.findIndex((t) => t.id === selectedTankerId);
    if (i === -1) return;
    const route = realRoutesRef.current.get(selectedTankerId) ?? tankers[i].route;
    const { pos } = posAt(route, progressRef.current[i]);
    map.flyTo({ center: pos, zoom: 11.5, pitch: 55, duration: 1200, essential: true });
  }, [map, selectedTankerId, tankers]);

  useEffect(() => {
    if (!map) return;
    const m = map;

    function animate(now: number) {
      if (isPlayingRef.current && lastTimeRef.current > 0) {
        const dt = Math.min(now - lastTimeRef.current, 100);
        frameRef.current++;
        const frame = frameRef.current;

        tankers.forEach((t, i) => {
          const route = realRoutesRef.current.get(t.id) ?? t.route;
          const dur   = DURATIONS_MS[i % DURATIONS_MS.length];
          progressRef.current[i] = (progressRef.current[i] + dt / dur) % 1;
          const p = progressRef.current[i];

          const { pos, bearing } = posAt(route, p);
          markersRef.current[i]?.setLngLat(pos);
          markersRef.current[i]?.setRotation(bearing);

          if (t.id === selectedIdRef.current || frame % 6 === i) {
            const end   = Math.min(Math.floor(p * route.length) + 2, route.length);
            const trail: [number, number][] = [...route.slice(0, end), pos];
            try {
              (m.getSource(`tanker-trail-${t.id}`) as mapboxgl.GeoJSONSource)
                ?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: trail } });
            } catch {}
          }
        });
      }

      lastTimeRef.current = now;
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, tankers]);

  return null;
}

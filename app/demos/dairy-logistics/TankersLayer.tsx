import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";
import { getMapboxGL } from "~/lib/mapbox/mapboxSingleton";

export interface Tanker {
  id: string;
  name: string;
  temp_celsius: number;
  fill_pct: number;
  route: [number, number][];
}

function interpolate(coords: [number, number][], progress: number): [number, number] {
  const total = coords.length - 1;
  const sp = progress * total;
  const idx = Math.min(Math.floor(sp), total - 1);
  const t = sp - idx;
  const a = coords[idx];
  const b = coords[Math.min(idx + 1, coords.length - 1)];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function getBearing(a: [number, number], b: [number, number]): number {
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function tempColor(temp: number): string {
  if (temp <= 4) return "#3B82F6";
  if (temp <= 6) return "#D97706";
  return "#FF3366";
}

function createTankerEl(t: Tanker): HTMLDivElement {
  const color = tempColor(t.temp_celsius);
  const el = document.createElement("div");
  el.style.cssText = "display:flex;align-items:center;justify-content:center;";
  el.innerHTML = `
    <style>
      @keyframes tanker-pulse {
        0% { transform: scale(1); box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 5px ${color}44; }
        50% { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 12px ${color}88; }
        100% { transform: scale(1); box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 5px ${color}44; }
      }
      .tanker-inner { animation: tanker-pulse 2s ease-in-out infinite; }
    </style>
    <div title="${t.name} · ${t.temp_celsius}°C · ${t.fill_pct}%" class="tanker-inner" style="
      width:34px;height:34px;border-radius:10px;
      background:linear-gradient(135deg,#12203a,#0a0e1a);
      border:1.5px solid ${color};
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;position:relative;
    ">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h9"></path>
        <path d="M15 18h3a4 4 0 0 0 4-4V10a2 2 0 0 0-2-2h-3v10z"></path>
        <circle cx="7" cy="18" r="2"></circle>
        <circle cx="17" cy="18" r="2"></circle>
        <path d="M2 13h12"></path>
      </svg>
      <div style="position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;background:#0a0e1a;border:1px solid ${color};display:flex;align-items:center;justify-content:center;">
        <div style="width:6px;height:6px;border-radius:50%;background:${color};"></div>
      </div>
    </div>
  `;
  return el;
}

interface TankersLayerProps {
  tankers: Tanker[];
  isPlaying: boolean;
  selectedTankerId: string | null;
  onSelectTanker: (id: string | null) => void;
}

const START_OFFSETS = [0, 0.12, 0.25, 0.38, 0.5, 0.62, 0.75, 0.88];
const DURATIONS = [28000, 22000, 18000, 32000, 38000, 26000, 16000, 34000];

export function TankersLayer({ tankers, isPlaying, selectedTankerId, onSelectTanker }: TankersLayerProps) {
  const { map } = useMap();
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const animsRef = useRef<number[]>([]);
  const progressRef = useRef<number[]>(START_OFFSETS.slice());
  const lastTimeRef = useRef<number[]>(new Array(8).fill(0));
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!map || tankers.length === 0) return;

    getMapboxGL().then(({ default: mapboxgl }) => {
      tankers.forEach((tanker, i) => {
        const routeId = `tanker-route-${tanker.id}`;
        const trailId = `tanker-trail-${tanker.id}`;

        try {
          if (map.getLayer(trailId)) map.removeLayer(trailId);
          if (map.getSource(trailId)) map.removeSource(trailId);
          if (map.getLayer(routeId)) map.removeLayer(routeId);
          if (map.getSource(routeId)) map.removeSource(routeId);
        } catch {}

        map.addSource(routeId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: tanker.route } },
        });
        map.addLayer({
          id: routeId,
          type: "line",
          source: routeId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": tempColor(tanker.temp_celsius),
            "line-width": 1.5,
            "line-opacity": 0.2,
            "line-dasharray": [3, 3],
          },
        });

        map.addSource(trailId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [tanker.route[0]] } },
        });
        map.addLayer({
          id: trailId,
          type: "line",
          source: trailId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": tempColor(tanker.temp_celsius),
            "line-width": 2.5,
            "line-opacity": 0.75,
          },
        });

        const el = createTankerEl(tanker);
        const startPos = interpolate(tanker.route, progressRef.current[i]);
        const popup = new mapboxgl.Popup({ offset: 20, closeButton: false })
          .setHTML(`
            <div style="padding:8px 12px;background:#0a0e1a;border:1px solid rgba(59,130,246,0.3);border-radius:8px;min-width:160px;">
              <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:0.08em;margin-bottom:5px;">${tanker.id}</div>
              <div style="font-size:13px;color:#fff;font-weight:600;margin-bottom:6px;">${tanker.name}</div>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">
                <span>Température</span>
                <span style="color:${tempColor(tanker.temp_celsius)};font-family:monospace;font-weight:700;">${tanker.temp_celsius}°C</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">
                <span>Remplissage</span>
                <span style="color:#22C55E;font-family:monospace;font-weight:700;">${tanker.fill_pct}%</span>
              </div>
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);font-size:10px;color:#3B82F6;text-align:center;">
                Cliquer pour suivre le véhicule
              </div>
            </div>
          `);

        const marker = new mapboxgl.Marker({ element: el, rotationAlignment: "map", pitchAlignment: "map" })
          .setLngLat(startPos)
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectTanker(selectedTankerId === tanker.id ? null : tanker.id);
        });
        markersRef.current[i] = marker;
      });

      initializedRef.current = true;
    });

    return () => {
      animsRef.current.forEach((id) => cancelAnimationFrame(id));
      animsRef.current = [];
      markersRef.current.forEach((m) => m?.remove());
      markersRef.current = [];
      tankers.forEach((tanker) => {
        try {
          if (map.getLayer(`tanker-trail-${tanker.id}`)) map.removeLayer(`tanker-trail-${tanker.id}`);
          if (map.getSource(`tanker-trail-${tanker.id}`)) map.removeSource(`tanker-trail-${tanker.id}`);
          if (map.getLayer(`tanker-route-${tanker.id}`)) map.removeLayer(`tanker-route-${tanker.id}`);
          if (map.getSource(`tanker-route-${tanker.id}`)) map.removeSource(`tanker-route-${tanker.id}`);
        } catch {}
      });
      initializedRef.current = false;
    };
  }, [map, tankers, onSelectTanker, selectedTankerId]);

  // Animation loop — continuous cycling
  useEffect(() => {
    if (!map || !isPlaying) {
      animsRef.current.forEach((id) => cancelAnimationFrame(id));
      animsRef.current = [];
      return;
    }

    tankers.forEach((tanker, i) => {
      lastTimeRef.current[i] = performance.now();

      function animate(now: number) {
        if (!map) return;
        const dt = now - lastTimeRef.current[i];
        lastTimeRef.current[i] = now;

        progressRef.current[i] = (progressRef.current[i] + dt / DURATIONS[i]) % 1;
        const p = progressRef.current[i];

        const pos = interpolate(tanker.route, p);
        const nextPos = interpolate(tanker.route, Math.min(p + 0.01, 0.99));
        const bearing = getBearing(pos, nextPos);

        markersRef.current[i]?.setLngLat(pos);
        markersRef.current[i]?.setRotation(bearing - 90);

        // Driving Mode: Follow camera
        if (selectedTankerId === tanker.id) {
          map.jumpTo({
            center: pos,
            bearing: bearing,
            pitch: 65,
            zoom: 16.5,
          });
        }

        // Update trail: from start of route up to current position
        const trailEnd = Math.floor(p * (tanker.route.length - 1)) + 1;
        const trail = tanker.route.slice(0, trailEnd);
        trail.push(pos);
        try {
          const src = map.getSource(`tanker-trail-${tanker.id}`) as mapboxgl.GeoJSONSource;
          if (src) src.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: trail } });
        } catch {}

        animsRef.current[i] = requestAnimationFrame(animate);
      }

      animsRef.current[i] = requestAnimationFrame(animate);
    });

    return () => {
      animsRef.current.forEach((id) => cancelAnimationFrame(id));
      animsRef.current = [];
    };
  }, [map, isPlaying, tankers, selectedTankerId]);

  return null;
}

import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";
import { getMapboxGL } from "~/lib/mapbox/mapboxSingleton";

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: "suv" | "berline" | "citadine" | "minivan";
  status: "available" | "rented" | "maintenance" | "reserved";
  client: string | null;
  fuel_pct: number;
  mileage_km: number;
  coordinates: [number, number];
  returnTime: string | null;
  issue?: string;
  waypoints: [number, number][] | null;
}

export const STATUS_COLORS: Record<Vehicle["status"], string> = {
  available:   "#22C55E",
  rented:      "#3B82F6",
  maintenance: "#F97316",
  reserved:    "#A855F7",
};

export const STATUS_LABELS: Record<Vehicle["status"], string> = {
  available:   "Disponible",
  rented:      "En location",
  maintenance: "Maintenance",
  reserved:    "Réservé",
};

const TYPE_LABELS: Record<Vehicle["type"], string> = {
  suv:      "SUV",
  berline:  "Berline",
  citadine: "Citadine",
  minivan:  "Minivan",
};

/** Top-down car SVG icon */
function carSVG(color: string, size: number, isPulse: boolean): string {
  const w = size;
  const h = Math.round(size * 1.7);
  return `<svg viewBox="0 0 32 54" width="${w}" height="${h}"
    style="filter:drop-shadow(0 0 ${isPulse ? 7 : 4}px ${color})drop-shadow(0 2px 4px rgba(0,0,0,.8));"
    xmlns="http://www.w3.org/2000/svg">
    <!-- body -->
    <rect x="4" y="10" width="24" height="34" rx="6" fill="${color}" opacity=".95"/>
    <!-- windshield front -->
    <rect x="7" y="12" width="18" height="10" rx="3" fill="white" opacity=".25"/>
    <!-- windshield rear -->
    <rect x="7" y="32" width="18" height="8" rx="2" fill="white" opacity=".15"/>
    <!-- wheels -->
    <rect x="1"  y="12" width="4" height="8" rx="2" fill="${color}" opacity=".7"/>
    <rect x="27" y="12" width="4" height="8" rx="2" fill="${color}" opacity=".7"/>
    <rect x="1"  y="34" width="4" height="8" rx="2" fill="${color}" opacity=".7"/>
    <rect x="27" y="34" width="4" height="8" rx="2" fill="${color}" opacity=".7"/>
    <!-- headlights -->
    <rect x="6"  y="9"  width="7" height="3" rx="1.5" fill="white" opacity=".7"/>
    <rect x="19" y="9"  width="7" height="3" rx="1.5" fill="white" opacity=".7"/>
    <!-- taillights -->
    <rect x="6"  y="42" width="7" height="3" rx="1.5" fill="#FF4444" opacity=".8"/>
    <rect x="19" y="42" width="7" height="3" rx="1.5" fill="#FF4444" opacity=".8"/>
  </svg>`;
}

function createVehicleEl(v: Vehicle): HTMLDivElement {
  const color   = STATUS_COLORS[v.status];
  const isMoving = v.status === "rented" || (v.status === "maintenance" && v.waypoints);
  const size    = v.type === "suv" || v.type === "minivan" ? 18 : 14;
  const el      = document.createElement("div");
  el.style.cssText = "cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;";
  el.innerHTML = `
    ${isMoving ? `
    <style>
      @keyframes car-ring-${v.id}{0%{transform:scale(.7);opacity:.7}100%{transform:scale(2.2);opacity:0}}
      .car-ring-${v.id}{position:absolute;width:${size + 4}px;height:${size + 4}px;border-radius:50%;
        border:2px solid ${color};animation:car-ring-${v.id} 1.8s ease-out infinite;pointer-events:none;}
    </style>
    <div class="car-ring-${v.id}"></div>` : ""}
    <div style="position:relative;z-index:1;" title="${v.model} · ${TYPE_LABELS[v.type]} · ${STATUS_LABELS[v.status]}">
      ${carSVG(color, size, isMoving)}
    </div>`;
  return el;
}

const DURATIONS_MS = [22000, 28000, 18000, 34000, 26000, 20000, 30000, 24000];

interface VehiclesLayerProps {
  vehicles: Vehicle[];
  isPlaying: boolean;
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string | null) => void;
}

export function VehiclesLayer({ vehicles, isPlaying, selectedVehicleId, onSelectVehicle }: VehiclesLayerProps) {
  const { map } = useMap();

  const markersRef    = useRef<(mapboxgl.Marker | null)[]>([]);
  const readyRef      = useRef(false);
  const animRef       = useRef<number>(0);
  const progressRef   = useRef<number[]>(vehicles.map(() => 0));
  const lastTimeRef   = useRef<number>(0);

  const isPlayingRef   = useRef(isPlaying);
  const selectedIdRef  = useRef(selectedVehicleId);
  const onSelectRef    = useRef(onSelectVehicle);

  useEffect(() => { isPlayingRef.current  = isPlaying;         }, [isPlaying]);
  useEffect(() => { selectedIdRef.current = selectedVehicleId; }, [selectedVehicleId]);
  useEffect(() => { onSelectRef.current   = onSelectVehicle;   }, [onSelectVehicle]);

  // Reset to start when stopped
  useEffect(() => {
    if (isPlaying || !readyRef.current) return;
    vehicles.forEach((v, i) => {
      progressRef.current[i] = 0;
      const start = v.waypoints?.[0] ?? v.coordinates;
      markersRef.current[i]?.setLngLat(start);
      markersRef.current[i]?.setRotation(0);
    });
  }, [isPlaying, vehicles]);

  // Pan to selected vehicle
  useEffect(() => {
    if (!map || !selectedVehicleId) return;
    const i = vehicles.findIndex((v) => v.id === selectedVehicleId);
    if (i === -1) return;
    const pos = vehicles[i].waypoints?.[0] ?? vehicles[i].coordinates;
    map.flyTo({ center: pos, zoom: 14.5, pitch: 55, duration: 1000, essential: true });
  }, [map, selectedVehicleId, vehicles]);

  // Create markers + trail sources
  useEffect(() => {
    if (!map || vehicles.length === 0) return;
    let cancelled = false;

    getMapboxGL().then(({ default: mapboxgl }) => {
      if (cancelled) return;
      readyRef.current = true;

      vehicles.forEach((v, i) => {
        const trailId = `rental-trail-${v.id}`;
        try { if (map.getLayer(trailId)) map.removeLayer(trailId); } catch {}
        try { if (map.getSource(trailId)) map.removeSource(trailId); } catch {}

        const hasRoute = v.waypoints && v.waypoints.length >= 2;
        const startCoord = v.waypoints?.[0] ?? v.coordinates;

        // Route ghost line
        if (hasRoute) {
          const routeId = `rental-route-${v.id}`;
          try { if (map.getLayer(routeId)) map.removeLayer(routeId); } catch {}
          try { if (map.getSource(routeId)) map.removeSource(routeId); } catch {}
          map.addSource(routeId, {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: v.waypoints! } },
          });
          map.addLayer({
            id: routeId, type: "line", source: routeId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": STATUS_COLORS[v.status],
              "line-width": 1.5,
              "line-opacity": 0.18,
              "line-dasharray": [3, 4],
            },
          });

          // Trail
          map.addSource(trailId, {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [startCoord, startCoord] } },
          });
          map.addLayer({
            id: trailId, type: "line", source: trailId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": STATUS_COLORS[v.status],
              "line-width": 2,
              "line-opacity": 0.65,
            },
          });
        }

        const el = createVehicleEl(v);

        const fuelBar = `<div style="height:3px;background:rgba(255,255,255,.1);border-radius:2px;margin-top:6px;overflow:hidden;">
          <div style="height:100%;width:${v.fuel_pct}%;background:${v.fuel_pct < 30 ? "#EF4444" : v.fuel_pct < 60 ? "#F97316" : "#22C55E"};border-radius:2px;"></div>
        </div>`;

        const popup = new mapboxgl.Popup({ offset: 24, closeButton: false }).setHTML(`
          <div style="padding:10px 14px;background:#080e1a;border:1px solid ${STATUS_COLORS[v.status]}40;border-radius:10px;min-width:190px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <div style="width:8px;height:8px;border-radius:50%;background:${STATUS_COLORS[v.status]};box-shadow:0 0 6px ${STATUS_COLORS[v.status]};"></div>
              <span style="font-size:10px;color:${STATUS_COLORS[v.status]};font-weight:700;letter-spacing:.06em;">${STATUS_LABELS[v.status].toUpperCase()}</span>
            </div>
            <div style="font-size:13px;color:#fff;font-weight:700;margin-bottom:2px;">${v.model}</div>
            <div style="font-size:10px;color:rgba(255,255,255,.35);font-family:monospace;margin-bottom:8px;">${v.plate} · ${TYPE_LABELS[v.type]}</div>
            ${v.client ? `<div style="font-size:11px;color:rgba(255,255,255,.6);margin-bottom:4px;">👤 ${v.client}</div>` : ""}
            ${v.issue  ? `<div style="font-size:11px;color:#F97316;margin-bottom:4px;">⚠ ${v.issue}</div>` : ""}
            ${v.returnTime ? `<div style="font-size:11px;color:rgba(255,255,255,.5);">🕐 ${v.returnTime}</div>` : ""}
            <div style="margin-top:8px;">
              <div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,.4);margin-bottom:3px;">
                <span>Carburant</span><span style="color:#fff;font-family:monospace;">${v.fuel_pct}%</span>
              </div>
              ${fuelBar}
            </div>
          </div>`);

        const marker = new mapboxgl.Marker({ element: el, rotationAlignment: "map", pitchAlignment: "map" })
          .setLngLat(startCoord)
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectRef.current(selectedIdRef.current === v.id ? null : v.id);
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
      vehicles.forEach((v) => {
        for (const id of [`rental-trail-${v.id}`, `rental-route-${v.id}`]) {
          try { if (map.getLayer(id)) map.removeLayer(id); } catch {}
          try { if (map.getSource(id)) map.removeSource(id); } catch {}
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, vehicles]);

  // Animation loop
  useEffect(() => {
    if (!map) return;
    const m = map;

    function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }

    function bearing(a: [number, number], b: [number, number]): number {
      const dLng = (b[0] - a[0]) * (Math.PI / 180);
      const lat1 = a[1] * (Math.PI / 180);
      const lat2 = b[1] * (Math.PI / 180);
      const y = Math.sin(dLng) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
      return (Math.atan2(y, x) * 180) / Math.PI;
    }

    function animate(now: number) {
      if (isPlayingRef.current && lastTimeRef.current > 0) {
        const dt = Math.min(now - lastTimeRef.current, 100);

        vehicles.forEach((v, i) => {
          if (!v.waypoints || v.waypoints.length < 2) return;
          const pts = v.waypoints;
          const dur = DURATIONS_MS[i % DURATIONS_MS.length];
          progressRef.current[i] = (progressRef.current[i] + dt / dur) % 1;
          const p = progressRef.current[i];

          // Position along waypoints (linear segments)
          const segCount = pts.length - 1;
          const totalP   = p * segCount;
          const segIdx   = Math.min(Math.floor(totalP), segCount - 1);
          const segP     = totalP - segIdx;
          const pos = lerp(pts[segIdx], pts[segIdx + 1], segP);
          const b   = bearing(pts[segIdx], pts[segIdx + 1]);

          markersRef.current[i]?.setLngLat(pos);
          markersRef.current[i]?.setRotation(b);

          // Trail: all points up to current segment + current pos
          const trail: [number, number][] = [...pts.slice(0, segIdx + 1), pos];
          try {
            (m.getSource(`rental-trail-${v.id}`) as mapboxgl.GeoJSONSource)
              ?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: trail } });
          } catch {}
        });
      }
      lastTimeRef.current = now;
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, vehicles]);

  return null;
}

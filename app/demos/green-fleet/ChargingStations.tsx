import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";

export interface ChargingStation {
  id: number;
  name: string;
  position: [number, number];
  available_slots: number;
  total_slots: number;
  power_kw: number;
  charge_time_min: number;
}

interface ChargingStationsProps {
  stations: ChargingStation[];
  lowBatteryPositions?: [number, number][];
}

function createStationMarker(station: ChargingStation, highlight: boolean): HTMLDivElement {
  const availColor = station.available_slots > 0 ? "#22C55E" : "#EF4444";
  const borderColor = highlight ? "#FACC15" : "#22C55E55";
  const glowColor = highlight ? "#FACC1544" : "#22C55E33";

  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:default;";

  const box = document.createElement("div");
  box.style.cssText = `
    min-width:80px;padding:6px 8px;border-radius:8px;
    background:rgba(10,14,26,0.9);backdrop-filter:blur(8px);
    border:1.5px solid ${borderColor};
    box-shadow:0 2px 12px rgba(0,0,0,0.4),0 0 8px ${glowColor};
  `;

  box.innerHTML = `
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <span style="font-size:9px;color:rgba(255,255,255,0.6);font-family:Inter,sans-serif;white-space:nowrap;">${station.name}</span>
      ${highlight ? `<span style="font-size:8px;background:#FACC1520;border:1px solid #FACC1560;color:#FACC15;border-radius:3px;padding:0 3px;">LOW</span>` : ""}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;">
      <div style="text-align:center;">
        <div style="font-size:12px;font-weight:700;color:${availColor};font-family:'JetBrains Mono',monospace;">${station.available_slots}/${station.total_slots}</div>
        <div style="font-size:7.5px;color:rgba(255,255,255,0.35);">Slots</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:12px;font-weight:700;color:white;font-family:'JetBrains Mono',monospace;">${station.power_kw}kW</div>
        <div style="font-size:7.5px;color:rgba(255,255,255,0.35);">Puissance</div>
      </div>
    </div>
    <div style="margin-top:3px;font-size:8px;color:rgba(255,255,255,0.4);text-align:center;">~${station.charge_time_min} min charge</div>
  `;

  el.appendChild(box);

  const dot = document.createElement("div");
  dot.style.cssText = `width:7px;height:7px;border-radius:50%;background:#22C55E;margin-top:3px;box-shadow:0 0 8px #22C55E99;`;
  el.appendChild(dot);

  return el;
}

function isNear(a: [number, number], b: [number, number], thresholdDeg = 0.03): boolean {
  return Math.abs(a[0] - b[0]) < thresholdDeg && Math.abs(a[1] - b[1]) < thresholdDeg;
}

export function ChargingStations({ stations, lowBatteryPositions = [] }: ChargingStationsProps) {
  const { map } = useMap();
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      const markers = stations.map((s) => {
        const highlight = lowBatteryPositions.some((pos) => isNear(s.position, pos));
        const el = createStationMarker(s, highlight);
        return new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat(s.position)
          .addTo(map);
      });
      markersRef.current = markers;
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, stations, lowBatteryPositions]);

  return null;
}

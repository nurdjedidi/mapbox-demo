import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";

export interface Station {
  id: number;
  position: [number, number];
  capacity: number;
  occupied: number;
  type: "parking" | "charging";
  name: string;
}

interface StationLayerProps {
  stations: Station[];
}

function createStationElement(station: Station): HTMLDivElement {
  const available = station.capacity - station.occupied;
  const ratio = available / station.capacity;
  const borderColor = station.type === "charging" ? "#FFB800" : "#00D9FF";
  const icon = station.type === "charging"
    ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${borderColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`
    : `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${borderColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`;

  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:default;";

  // Station marker
  const box = document.createElement("div");
  box.style.cssText = `
    width:38px;height:38px;border-radius:8px;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:2px;
    background:rgba(10,14,26,0.85);backdrop-filter:blur(4px);
    border:2px solid ${borderColor};
    box-shadow:0 2px 10px rgba(0,0,0,0.4);
  `;

  // Icon
  const iconDiv = document.createElement("div");
  iconDiv.innerHTML = icon;
  box.appendChild(iconDiv);

  // Capacity text
  const cap = document.createElement("div");
  cap.style.cssText = `font-size:9px;font-weight:700;color:white;font-family:'JetBrains Mono',monospace;line-height:1;`;
  cap.textContent = `${available}/${station.capacity}`;
  box.appendChild(cap);

  el.appendChild(box);

  // Gauge bar under station
  const gauge = document.createElement("div");
  gauge.style.cssText = `width:30px;height:3px;border-radius:2px;background:rgba(255,255,255,0.1);margin-top:3px;overflow:hidden;`;
  const gaugeFill = document.createElement("div");
  gaugeFill.style.cssText = `height:100%;border-radius:2px;width:${ratio * 100}%;background:${ratio > 0.5 ? "#00FF88" : ratio > 0.2 ? "#FFB800" : "#FF3366"};`;
  gauge.appendChild(gaugeFill);
  el.appendChild(gauge);

  return el;
}

export function StationLayer({ stations }: StationLayerProps) {
  const { map } = useMap();
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      const markers = stations.map((s) => {
        const el = createStationElement(s);
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat(s.position)
          .addTo(map);

        return marker;
      });

      markersRef.current = markers;
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, stations]);

  return null;
}

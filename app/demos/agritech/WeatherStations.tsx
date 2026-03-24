import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";

export interface WeatherStation {
  id: number;
  name: string;
  position: [number, number];
  temp: number;
  humidity: number;
  rain_24h: number;
  wind_kmh: number;
  forecast: string;
}

interface WeatherStationsProps {
  stations: WeatherStation[];
}

function weatherIcon(forecast: string): string {
  if (forecast.includes("nuageux") || forecast.includes("Nuageux")) {
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94A3B8" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`;
  }
  if (forecast.includes("pluie") || forecast.includes("Pluie")) {
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#3B82F6" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M13 19v3M9 21v1M17 21v1"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FFB800" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;
}

function createStationMarker(station: WeatherStation): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:default;";

  const box = document.createElement("div");
  box.style.cssText = `
    min-width:72px;padding:6px 8px;border-radius:8px;
    background:rgba(10,14,26,0.88);backdrop-filter:blur(8px);
    border:1.5px solid rgba(34,197,94,0.4);
    box-shadow:0 2px 12px rgba(0,0,0,0.4);
  `;

  box.innerHTML = `
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
      ${weatherIcon(station.forecast)}
      <span style="font-size:9px;color:rgba(255,255,255,0.5);font-family:Inter,sans-serif;">${station.name}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">
      <div style="text-align:center;">
        <div style="font-size:14px;font-weight:700;color:white;font-family:'JetBrains Mono',monospace;">${station.temp}°</div>
        <div style="font-size:8px;color:rgba(255,255,255,0.35);">Temp</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:14px;font-weight:700;color:#3B82F6;font-family:'JetBrains Mono',monospace;">${station.humidity}%</div>
        <div style="font-size:8px;color:rgba(255,255,255,0.35);">Hum.</div>
      </div>
    </div>
    ${station.rain_24h > 0 ? `<div style="margin-top:3px;font-size:9px;color:#3B82F6;text-align:center;">${station.rain_24h}mm pluie 24h</div>` : ""}
  `;

  el.appendChild(box);

  // Connector dot
  const dot = document.createElement("div");
  dot.style.cssText = "width:6px;height:6px;border-radius:50%;background:#22C55E;margin-top:3px;box-shadow:0 0 6px #22C55E88;";
  el.appendChild(dot);

  return el;
}

export function WeatherStations({ stations }: WeatherStationsProps) {
  const { map } = useMap();
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      const markers = stations.map((s) => {
        const el = createStationMarker(s);
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
  }, [map, stations]);

  return null;
}

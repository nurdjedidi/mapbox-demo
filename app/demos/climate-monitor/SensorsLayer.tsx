import { useEffect, useRef, useState } from "react";
import { useMap } from "~/lib/hooks/useMap";

export interface Sensor {
  id: number;
  type: "air" | "water" | "noise";
  position: [number, number];
  status: "good" | "warning" | "critical";
  history_7d: number[];
  // air
  pm25?: number;
  no2?: number;
  o3?: number;
  // water
  ph?: number;
  nitrates?: number;
  turbidity?: number;
  // noise
  decibels?: number;
}

interface SensorsLayerProps {
  sensors: Sensor[];
  activeType: "air" | "water" | "noise";
  onSelect?: (sensor: Sensor | null) => void;
}

const STATUS_COLOR: Record<string, string> = {
  good: "#22C55E",
  warning: "#F59E0B",
  critical: "#EF4444",
};

function airIcon(color: string) {
  return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>`;
}

function waterIcon(color: string) {
  return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3.8-6.8l-3.2-3.2-3.2 3.2C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;
}

function noiseIcon(color: string) {
  return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
}

function getSensorIcon(type: string, color: string) {
  if (type === "water") return waterIcon(color);
  if (type === "noise") return noiseIcon(color);
  return airIcon(color);
}

function getSensorValue(s: Sensor) {
  if (s.type === "air") return `PM2.5: ${s.pm25} µg/m³`;
  if (s.type === "water") return `NO₃: ${s.nitrates} mg/L`;
  return `${s.decibels} dB`;
}

function createSensorEl(sensor: Sensor, onClick: () => void): HTMLDivElement {
  const color = STATUS_COLOR[sensor.status];
  const el = document.createElement("div");
  el.style.cssText = "cursor:pointer;";

  const circle = document.createElement("div");
  circle.style.cssText = `
    width:28px;height:28px;border-radius:50%;
    background:${color}22;border:2px solid ${color};
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 0 8px ${color}55;
    transition:transform 0.15s;
  `;
  circle.innerHTML = getSensorIcon(sensor.type, color);
  circle.onmouseenter = () => { circle.style.transform = "scale(1.2)"; };
  circle.onmouseleave = () => { circle.style.transform = "scale(1)"; };
  circle.onclick = onClick;

  el.appendChild(circle);
  return el;
}

export function SensorsLayer({ sensors, activeType, onSelect }: SensorsLayerProps) {
  const { map } = useMap();
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = sensors.filter((s) => s.type === activeType);

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      const markers = filtered.map((s) => {
        const el = createSensorEl(s, () => onSelect?.(s));
        return new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(s.position)
          .addTo(map);
      });
      markersRef.current = markers;
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, sensors, activeType]);

  return null;
}

export function SensorDetail({ sensor, onClose }: { sensor: Sensor; onClose: () => void }) {
  const color = STATUS_COLOR[sensor.status];
  const max = Math.max(...sensor.history_7d) * 1.1;
  const days = ["L", "M", "M", "J", "V", "S", "D"];

  const label =
    sensor.type === "air"
      ? `PM2.5: ${sensor.pm25} µg/m³ · NO₂: ${sensor.no2} · O₃: ${sensor.o3}`
      : sensor.type === "water"
      ? `pH: ${sensor.ph} · Nitrates: ${sensor.nitrates} mg/L · Turbidité: ${sensor.turbidity}`
      : `Bruit: ${sensor.decibels} dB`;

  return (
    <div className="glass-panel p-3 border border-white/15">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs font-semibold">Capteur #{sensor.id}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize"
              style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
            >
              {sensor.status === "good" ? "OK" : sensor.status === "warning" ? "Alerte" : "Critique"}
            </span>
          </div>
          <p className="text-[10px] text-white/40 mt-0.5 font-mono">{label}</p>
        </div>
        <button onClick={onClose} className="text-xs text-white/30 hover:text-white/60 ml-2">✕</button>
      </div>

      {/* Mini bar chart — 7 days */}
      <div className="flex items-end gap-1 h-10">
        {sensor.history_7d.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full rounded-sm"
              style={{ height: `${(v / max) * 32}px`, background: color, opacity: i === 6 ? 1 : 0.4 }}
            />
            <span className="text-[8px] text-white/30">{days[i]}</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-white/25 mt-1 text-right">7 derniers jours</p>
    </div>
  );
}

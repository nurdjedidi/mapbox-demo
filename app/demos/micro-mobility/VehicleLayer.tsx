import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";
import { getMapboxGL } from "~/lib/mapbox/mapboxSingleton";

export interface Vehicle {
  id: number;
  type: "bike" | "scooter";
  position: [number, number];
  battery: number;
  status: "available" | "in_use" | "charging";
}

interface VehicleLayerProps {
  vehicles: Vehicle[];
  onVehicleClick: (id: number) => void;
}

const STATUS_CONFIG = {
  available: { color: "#00FF88", ring: "#00FF8866", label: "Dispo" },
  in_use: { color: "#FF3366", ring: "#FF336666", label: "En cours" },
  charging: { color: "#FFB800", ring: "#FFB80066", label: "Charge" },
};

const BIKE_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17L10 9h4"/><path d="M10 9l8.5 8"/><path d="M14 9l-2 8"/></svg>`;

const SCOOTER_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="18" r="3"/><circle cx="18.5" cy="18" r="3"/><path d="M12 18V5l4 0"/><path d="M7.5 18h7"/></svg>`;

function createVehicleElement(vehicle: Vehicle): HTMLDivElement {
  const cfg = STATUS_CONFIG[vehicle.status];
  const svg = vehicle.type === "bike" ? BIKE_SVG : SCOOTER_SVG;

  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";

  // Main marker
  const dot = document.createElement("div");
  dot.style.cssText = `
    width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:${cfg.color};border:2px solid rgba(255,255,255,0.85);
    box-shadow:0 2px 8px rgba(0,0,0,0.3),0 0 12px ${cfg.ring};
    transition:transform 0.2s ease;
  `;
  dot.innerHTML = svg;
  el.appendChild(dot);

  // Battery indicator (small bar below)
  const batContainer = document.createElement("div");
  batContainer.style.cssText = `
    width:22px;height:3px;border-radius:2px;background:rgba(0,0,0,0.5);
    margin-top:3px;overflow:hidden;
  `;
  const batFill = document.createElement("div");
  batFill.style.cssText = `
    height:100%;border-radius:2px;
    width:${vehicle.battery}%;
    background:${vehicle.battery > 50 ? "#00FF88" : vehicle.battery > 20 ? "#FFB800" : "#FF3366"};
  `;
  batContainer.appendChild(batFill);
  el.appendChild(batContainer);

  // Hover effect
  el.onmouseenter = () => { dot.style.transform = "scale(1.2)"; };
  el.onmouseleave = () => { dot.style.transform = "scale(1)"; };

  return el;
}

export function VehicleLayer({ vehicles, onVehicleClick }: VehicleLayerProps) {
  const { map } = useMap();
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    getMapboxGL().then(({ default: mapboxgl }) => {
      const markers = vehicles.map((v) => {
        const el = createVehicleElement(v);
        el.onclick = () => onVehicleClick(v.id);

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat(v.position)
          .addTo(map);

        return marker;
      });

      markersRef.current = markers;
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, vehicles]);

  return null;
}

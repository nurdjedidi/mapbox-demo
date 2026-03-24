import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";

export interface Customer {
  id: number;
  name: string;
  position: [number, number];
  segment: "premium" | "standard" | "inactif" | "prospect";
  revenue: number;
  rep: string;
  zone: string;
  lastContact: number;
}

interface CustomerLayerProps {
  customers: Customer[];
  onSelect: (id: number) => void;
  selectedId: number | null;
  showDeadZones: boolean;
}

const SEGMENT_CONFIG = {
  premium: { color: "#00FF88", ring: "#00FF8840", minSize: 30, maxSize: 50 },
  standard: { color: "#00D9FF", ring: "#00D9FF40", minSize: 22, maxSize: 32 },
  inactif: { color: "#4B5563", ring: "#4B556340", minSize: 18, maxSize: 18 },
  prospect: { color: "#FFB800", ring: "#FFB80040", minSize: 22, maxSize: 22 },
};

function revenueToSize(revenue: number, segment: string): number {
  const cfg = SEGMENT_CONFIG[segment as keyof typeof SEGMENT_CONFIG];
  if (segment !== "premium" && segment !== "standard") return cfg.minSize;
  const maxRev = 100000;
  const ratio = Math.min(revenue / maxRev, 1);
  return cfg.minSize + ratio * (cfg.maxSize - cfg.minSize);
}

function createMarkerEl(customer: Customer, isSelected: boolean): HTMLDivElement {
  const cfg = SEGMENT_CONFIG[customer.segment];
  const size = revenueToSize(customer.revenue, customer.segment);
  const isPulse = customer.segment === "premium" && customer.revenue > 60000;
  const isStale = customer.lastContact > 60;

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";

  const dot = document.createElement("div");
  dot.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    background:${isStale && customer.segment !== "prospect" ? "rgba(75,85,99,0.7)" : cfg.color + "22"};
    border:2px solid ${isSelected ? "white" : isStale ? "#4B5563" : cfg.color};
    box-shadow:${isSelected ? `0 0 0 3px ${cfg.color}66,` : ""}0 2px 8px rgba(0,0,0,0.3)${isPulse ? `,0 0 16px ${cfg.color}88` : ""};
    transition:transform 0.15s ease,box-shadow 0.15s ease;
    position:relative;
  `;

  // Inner dot
  const inner = document.createElement("div");
  inner.style.cssText = `
    width:${size * 0.45}px;height:${size * 0.45}px;border-radius:50%;
    background:${isStale ? "#4B5563" : cfg.color};
    opacity:${customer.segment === "inactif" ? 0.4 : 0.9};
  `;
  dot.appendChild(inner);

  // Prospect = dashed border
  if (customer.segment === "prospect") {
    dot.style.borderStyle = "dashed";
  }

  wrapper.appendChild(dot);
  wrapper.onmouseenter = () => { dot.style.transform = "scale(1.2)"; };
  wrapper.onmouseleave = () => { dot.style.transform = "scale(1)"; };

  return wrapper;
}

export function CustomerLayer({ customers, onSelect, selectedId, showDeadZones }: CustomerLayerProps) {
  const { map } = useMap();
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      const markers = customers.map((c) => {
        const el = createMarkerEl(c, c.id === selectedId);
        el.onclick = () => onSelect(c.id);

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(c.position)
          .addTo(map);

        return marker;
      });

      markersRef.current = markers;
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, customers, selectedId]);

  return null;
}

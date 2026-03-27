import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";
import { getMapboxGL } from "~/lib/mapbox/mapboxSingleton";

interface AkbouHubProps {
  coordinates: [number, number];
  currentVolume: number;
  capacity: number;
}

function createHubElement(currentVolume: number, capacity: number): HTMLDivElement {
  const pct = Math.round((currentVolume / capacity) * 100);
  const el = document.createElement("div");
  el.style.cssText = "position:relative;display:flex;align-items:center;justify-content:center;";
  el.innerHTML = `
    <style>
      @keyframes hub-pulse-ring {
        0% { transform: scale(0.8); opacity: 0.8; }
        100% { transform: scale(2.4); opacity: 0; }
      }
      @keyframes hub-scan {
        0% { top: 0%; opacity: 0; }
        50% { opacity: 0.5; }
        100% { top: 100%; opacity: 0; }
      }
      .hub-ring1 { animation: hub-pulse-ring 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      .hub-scanner { 
        position: absolute; left: 0; right: 0; height: 2px; 
        background: rgba(34, 197, 94, 0.5); 
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
        animation: hub-scan 2.5s linear infinite; 
      }
    </style>
    <div style="position:absolute;width:64px;height:64px;border-radius:50%;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);" class="hub-ring1"></div>
    <div style="
      position:relative;z-index:1;
      width:52px;height:52px;border-radius:14px;
      background:linear-gradient(145deg,#1a2d1a,#0a111a);
      border:2px solid rgba(34,197,94,0.8);
      box-shadow:0 0 25px rgba(34,197,94,0.4), inset 0 0 15px rgba(34,197,94,0.2);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      cursor:pointer;overflow:hidden;
    ">
      <div class="hub-scanner"></div>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:2px;">
        <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3zM4 21v-3m16 3v-3M9 21v-4m6 4v-4"></path>
      </svg>
      <span style="font-size:9px;color:#22C55E;font-family:'JetBrains Mono',monospace;font-weight:800;text-shadow:0 0 5px rgba(34,197,94,0.5);">${pct}%</span>
    </div>
  `;
  return el;
}

export function AkbouHub({ coordinates, currentVolume, capacity }: AkbouHubProps) {
  const { map } = useMap();
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    getMapboxGL().then(({ default: mapboxgl }) => {
      const el = createHubElement(currentVolume, capacity);
      const popup = new mapboxgl.Popup({ offset: 28, closeButton: false, className: "dairy-popup" })
        .setHTML(`
          <div style="padding:10px 14px;background:#0f1a2e;border:1px solid rgba(34,197,94,0.3);border-radius:10px;min-width:180px;">
            <div style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Usine principale</div>
            <div style="font-size:14px;color:#fff;font-weight:600;margin-bottom:8px;">Soummam · Akbou Hub</div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.5);">
              <span>Capacité</span><span style="color:#22C55E;font-family:monospace;font-weight:700;">${capacity.toLocaleString("fr-FR")} L</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.5);margin-top:3px;">
              <span>En stock</span><span style="color:#3B82F6;font-family:monospace;font-weight:700;">${currentVolume.toLocaleString("fr-FR")} L</span>
            </div>
          </div>
        `);

      markerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => markerRef.current?.togglePopup());
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, [map]);

  return null;
}

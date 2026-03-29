import { useEffect } from "react";
import { useMap } from "~/lib/hooks/useMap";
import { getMapboxGL } from "~/lib/mapbox/mapboxSingleton";

export interface PremiumZone {
  id: string;
  name: string;
  type: "golf" | "premium" | "airport";
  coordinates: [number, number][];
}

export interface Garage {
  id: string;
  name: string;
  coordinates: [number, number];
  capacity: number;
  available_spots: number;
}

const ZONE_STYLES = {
  golf:    { fill: "#22C55E", border: "#4ADE80", label: "⛳" },
  premium: { fill: "#F59E0B", border: "#FCD34D", label: "★" },
  airport: { fill: "#3B82F6", border: "#60A5FA", label: "✈" },
};

interface PremiumZonesProps {
  zones: PremiumZone[];
  garages: Garage[];
  visible: boolean;
}

export function PremiumZones({ zones, garages, visible }: PremiumZonesProps) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    let cancelled = false;

    getMapboxGL().then(({ default: mapboxgl }) => {
      if (cancelled) return;

      // ── Zones ──────────────────────────────────────────────────────────────
      zones.forEach((zone) => {
        const fillId   = `zone-fill-${zone.id}`;
        const borderId = `zone-border-${zone.id}`;
        const srcId    = `zone-src-${zone.id}`;

        for (const id of [fillId, borderId]) {
          try { if (map.getLayer(id)) map.removeLayer(id); } catch {}
        }
        try { if (map.getSource(srcId)) map.removeSource(srcId); } catch {}

        const style = ZONE_STYLES[zone.type];

        map.addSource(srcId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: { name: zone.name, type: zone.type },
            geometry: { type: "Polygon", coordinates: [zone.coordinates] },
          },
        });

        map.addLayer({
          id: fillId, type: "fill", source: srcId,
          paint: {
            "fill-color": style.fill,
            "fill-opacity": visible ? 0.08 : 0,
          },
        });

        map.addLayer({
          id: borderId, type: "line", source: srcId,
          paint: {
            "line-color": style.border,
            "line-width": 1.5,
            "line-opacity": visible ? 0.5 : 0,
            "line-dasharray": zone.type === "airport" ? [1, 0] : [4, 3],
          },
        });
      });

      // ── Garage markers ─────────────────────────────────────────────────────
      garages.forEach((g) => {
        const pct  = ((g.capacity - g.available_spots) / g.capacity) * 100;
        const full = g.available_spots === 0;
        const color = full ? "#EF4444" : g.available_spots <= 2 ? "#F97316" : "#22C55E";

        const el = document.createElement("div");
        el.style.cssText = "cursor:pointer;";
        el.innerHTML = `
          <div style="
            width:38px;height:38px;border-radius:10px;
            background:linear-gradient(135deg,#0f172a,#1e293b);
            border:2px solid ${color}80;
            box-shadow:0 0 14px ${color}40;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            position:relative;overflow:hidden;
          ">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="${color}" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span style="font-size:8px;color:${color};font-family:monospace;font-weight:800;line-height:1;">${g.available_spots}</span>
            <div style="
              position:absolute;bottom:0;left:0;right:0;height:3px;
              background:rgba(255,255,255,.06);
            ">
              <div style="height:100%;width:${pct}%;background:${color};opacity:.7;"></div>
            </div>
          </div>`;

        const popup = new mapboxgl.Popup({ offset: 22, closeButton: false }).setHTML(`
          <div style="padding:8px 12px;background:#080e1a;border:1px solid ${color}40;border-radius:8px;min-width:170px;">
            <div style="font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Garage / Hub</div>
            <div style="font-size:12px;color:#fff;font-weight:600;margin-bottom:6px;">${g.name}</div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.5);">
              <span>Capacité</span><span style="color:#fff;font-family:monospace;">${g.capacity} véh.</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.5);margin-top:3px;">
              <span>Places libres</span><span style="color:${color};font-family:monospace;font-weight:700;">${g.available_spots}</span>
            </div>
          </div>`);

        new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(g.coordinates)
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("click", () => {
          // marker toggles popup via Mapbox
        });
      });
    });

    return () => {
      cancelled = true;
      zones.forEach((zone) => {
        for (const id of [`zone-fill-${zone.id}`, `zone-border-${zone.id}`]) {
          try { if (map.getLayer(id)) map.removeLayer(id); } catch {}
        }
        try { if (map.getSource(`zone-src-${zone.id}`)) map.removeSource(`zone-src-${zone.id}`); } catch {}
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, zones, garages]);

  // Toggle visibility
  useEffect(() => {
    if (!map) return;
    zones.forEach((zone) => {
      for (const id of [`zone-fill-${zone.id}`, `zone-border-${zone.id}`]) {
        try {
          if (map.getLayer(id)) {
            const opacity = id.includes("fill") ? (visible ? 0.08 : 0) : (visible ? 0.5 : 0);
            map.setPaintProperty(id, id.includes("fill") ? "fill-opacity" : "line-opacity", opacity);
          }
        } catch {}
      }
    });
  }, [map, zones, visible]);

  return null;
}

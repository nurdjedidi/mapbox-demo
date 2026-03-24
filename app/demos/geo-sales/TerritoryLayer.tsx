import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";
import type { Customer } from "./CustomerLayer";

interface TerritoryLayerProps {
  customers: Customer[];
  activeRep: string;
}

// Approximate zone polygons around Casablanca
const ZONES: Record<string, { coords: [number, number][][]; label: [number, number] }> = {
  "Centre Affaires": {
    coords: [[[-7.628, 33.610], [-7.595, 33.610], [-7.595, 33.575], [-7.628, 33.575], [-7.628, 33.610]]],
    label: [-7.611, 33.592],
  },
  "Maarif": {
    coords: [[[-7.650, 33.585], [-7.628, 33.585], [-7.628, 33.560], [-7.650, 33.560], [-7.650, 33.585]]],
    label: [-7.638, 33.572],
  },
  "Anfa Premium": {
    coords: [[[-7.668, 33.600], [-7.650, 33.600], [-7.650, 33.578], [-7.628, 33.578], [-7.628, 33.590], [-7.650, 33.590], [-7.650, 33.600]]],
    label: [-7.652, 33.589],
  },
  "Corniche": {
    coords: [[[-7.690, 33.585], [-7.668, 33.585], [-7.668, 33.558], [-7.690, 33.558], [-7.690, 33.585]]],
    label: [-7.678, 33.571],
  },
  "Ain Sebaa": {
    coords: [[[-7.628, 33.625], [-7.560, 33.625], [-7.560, 33.590], [-7.628, 33.590], [-7.628, 33.625]]],
    label: [-7.592, 33.608],
  },
  "Hay Hassani": {
    coords: [[[-7.690, 33.558], [-7.628, 33.558], [-7.628, 33.530], [-7.690, 33.530], [-7.690, 33.558]]],
    label: [-7.658, 33.543],
  },
};

function getZoneRevenue(zoneName: string, customers: Customer[], rep: string): number {
  return customers
    .filter((c) => c.zone === zoneName && (rep === "all" || c.rep === rep))
    .reduce((sum, c) => sum + c.revenue, 0);
}

function revenueToColor(revenue: number): string {
  if (revenue === 0) return "rgba(255,51,102,0.15)";
  if (revenue < 20000) return "rgba(255,184,0,0.15)";
  if (revenue < 60000) return "rgba(0,217,255,0.15)";
  return "rgba(0,255,136,0.18)";
}

function revenueToBorder(revenue: number): string {
  if (revenue === 0) return "rgba(255,51,102,0.5)";
  if (revenue < 20000) return "rgba(255,184,0,0.45)";
  if (revenue < 60000) return "rgba(0,217,255,0.45)";
  return "rgba(0,255,136,0.5)";
}

export function TerritoryLayer({ customers, activeRep }: TerritoryLayerProps) {
  const { map } = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (!map) return;

    const sourceId = "territory-source";
    const fillId = "territory-fill";
    const lineId = "territory-line";
    const labelSourceId = "territory-labels-source";
    const labelId = "territory-labels";

    const features = Object.entries(ZONES).map(([name, zone]) => {
      const revenue = getZoneRevenue(name, customers, activeRep);
      return {
        type: "Feature" as const,
        properties: {
          name,
          revenue,
          fillColor: revenueToColor(revenue),
          lineColor: revenueToBorder(revenue),
          label: revenue > 0 ? `${Math.round(revenue / 1000)}k MAD` : "∅",
        },
        geometry: { type: "Polygon" as const, coordinates: zone.coords },
      };
    });

    const labelFeatures = Object.entries(ZONES).map(([name, zone]) => {
      const revenue = getZoneRevenue(name, customers, activeRep);
      return {
        type: "Feature" as const,
        properties: {
          name,
          label: revenue > 0 ? `${name}\n${Math.round(revenue / 1000)}k MAD` : name,
        },
        geometry: { type: "Point" as const, coordinates: zone.label },
      };
    });

    if (!initialized.current) {
      map.addSource(sourceId, { type: "geojson", data: { type: "FeatureCollection", features } });
      map.addLayer({
        id: fillId,
        type: "fill",
        source: sourceId,
        paint: { "fill-color": ["get", "fillColor"], "fill-opacity": 1 },
      });
      map.addLayer({
        id: lineId,
        type: "line",
        source: sourceId,
        paint: { "line-color": ["get", "lineColor"], "line-width": 1.5, "line-dasharray": [3, 2] },
      });

      map.addSource(labelSourceId, { type: "geojson", data: { type: "FeatureCollection", features: labelFeatures } });
      map.addLayer({
        id: labelId,
        type: "symbol",
        source: labelSourceId,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-allow-overlap": false,
        },
        paint: { "text-color": "rgba(255,255,255,0.5)", "text-halo-color": "rgba(0,0,0,0.5)", "text-halo-width": 1 },
      });

      initialized.current = true;
    } else {
      try {
        const src = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
        if (src) src.setData({ type: "FeatureCollection", features });
        const lblSrc = map.getSource(labelSourceId) as mapboxgl.GeoJSONSource;
        if (lblSrc) lblSrc.setData({ type: "FeatureCollection", features: labelFeatures });
      } catch {}
    }

    return () => {
      try {
        if (map.getLayer(labelId)) map.removeLayer(labelId);
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getLayer(fillId)) map.removeLayer(fillId);
        if (map.getSource(labelSourceId)) map.removeSource(labelSourceId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {}
      initialized.current = false;
    };
  }, [map, customers, activeRep]);

  return null;
}

import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";
import type { Customer } from "./CustomerLayer";

interface RevenueHeatmapProps {
  customers: Customer[];
}

export function RevenueHeatmap({ customers }: RevenueHeatmapProps) {
  const { map } = useMap();
  const initialized = useRef(false);

  const activeCustomers = customers.filter((c) => c.revenue > 0);

  useEffect(() => {
    if (!map) return;

    const sourceId = "revenue-heatmap-source";
    const layerId = "revenue-heatmap-layer";

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: activeCustomers.map((c) => ({
        type: "Feature",
        properties: { revenue: c.revenue, weight: c.revenue / 100000 },
        geometry: { type: "Point", coordinates: c.position },
      })),
    };

    if (!initialized.current) {
      map.addSource(sourceId, { type: "geojson", data: geojson });
      map.addLayer(
        {
          id: layerId,
          type: "heatmap",
          source: sourceId,
          maxzoom: 17,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 15, 2],
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.1, "rgba(0,217,255,0.1)",
              0.3, "rgba(0,217,255,0.35)",
              0.6, "rgba(0,255,136,0.5)",
              0.8, "rgba(0,255,136,0.7)",
              1, "rgba(0,255,136,0.9)",
            ],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 30, 15, 60],
            "heatmap-opacity": 0.55,
          },
        },
        "customers-layer"
      );
      initialized.current = true;
    } else {
      const src = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
      if (src) src.setData(geojson);
    }

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {}
      initialized.current = false;
    };
  }, [map, customers]);

  return null;
}

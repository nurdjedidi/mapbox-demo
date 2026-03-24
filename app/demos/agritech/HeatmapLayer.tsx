import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";
import type { Parcel } from "./FarmParcelsLayer";

type HeatmapType = "hydric" | "treatment" | "yield";

interface HeatmapLayerProps {
  parcels: Parcel[];
  type: HeatmapType;
}

function generateGridPoints(parcels: Parcel[], type: HeatmapType): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  parcels.forEach((p) => {
    // Centroid approx
    const lngs = p.coordinates.map((c) => c[0]);
    const lats = p.coordinates.map((c) => c[1]);
    const cLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const cLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const spanLng = Math.max(...lngs) - Math.min(...lngs);
    const spanLat = Math.max(...lats) - Math.min(...lats);

    // Generate ~9 points per parcel
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        let weight = 0;
        if (type === "hydric") {
          weight = p.health === "critical" ? 1.0 : p.health === "stress" ? 0.6 : 0.15;
          // add noise
          weight += (Math.random() - 0.5) * 0.1;
        } else if (type === "treatment") {
          const daysSince = Math.floor(
            (Date.now() - new Date(p.last_treatment).getTime()) / 86400000
          );
          weight = Math.min(daysSince / 30, 1.0);
          weight += (Math.random() - 0.5) * 0.1;
        } else {
          weight = p.yield_predicted / 10;
          weight += (Math.random() - 0.5) * 0.05;
        }

        features.push({
          type: "Feature",
          properties: { weight: Math.max(0, Math.min(weight, 1)) },
          geometry: {
            type: "Point",
            coordinates: [
              cLng + di * spanLng * 0.3,
              cLat + dj * spanLat * 0.3,
            ],
          },
        });
      }
    }
  });

  return { type: "FeatureCollection", features };
}

const HEATMAP_COLORS: Record<HeatmapType, mapboxgl.Expression> = {
  hydric: [
    "interpolate", ["linear"], ["heatmap-density"],
    0, "rgba(0,0,0,0)",
    0.2, "rgba(34,197,94,0.3)",
    0.5, "rgba(217,119,6,0.5)",
    0.8, "rgba(255,51,102,0.7)",
    1, "rgba(255,51,102,0.9)",
  ] as unknown as mapboxgl.Expression,
  treatment: [
    "interpolate", ["linear"], ["heatmap-density"],
    0, "rgba(0,0,0,0)",
    0.3, "rgba(34,197,94,0.3)",
    0.6, "rgba(217,119,6,0.5)",
    1, "rgba(255,51,102,0.8)",
  ] as unknown as mapboxgl.Expression,
  yield: [
    "interpolate", ["linear"], ["heatmap-density"],
    0, "rgba(0,0,0,0)",
    0.3, "rgba(255,51,102,0.3)",
    0.6, "rgba(217,119,6,0.5)",
    1, "rgba(34,197,94,0.85)",
  ] as unknown as mapboxgl.Expression,
};

export function HeatmapLayer({ parcels, type }: HeatmapLayerProps) {
  const { map } = useMap();
  const initialized = useRef(false);
  const currentType = useRef(type);

  useEffect(() => {
    if (!map) return;

    const sourceId = "agri-heatmap-source";
    const layerId = "agri-heatmap-layer";
    const geojson = generateGridPoints(parcels, type);

    if (!initialized.current) {
      map.addSource(sourceId, { type: "geojson", data: geojson });
      map.addLayer({
        id: layerId,
        type: "heatmap",
        source: sourceId,
        maxzoom: 17,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 2.5],
          "heatmap-color": HEATMAP_COLORS[type],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 40, 15, 80],
          "heatmap-opacity": 0.65,
        },
      }, "parcels-fill");
      initialized.current = true;
    } else {
      try {
        const src = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
        if (src) src.setData(geojson);
        // Update color if type changed
        if (currentType.current !== type) {
          map.setPaintProperty(layerId, "heatmap-color", HEATMAP_COLORS[type]);
          currentType.current = type;
        }
      } catch {}
    }

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {}
      initialized.current = false;
    };
  }, [map, parcels, type]);

  return null;
}

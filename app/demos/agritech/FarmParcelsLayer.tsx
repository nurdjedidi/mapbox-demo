import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";

export interface Parcel {
  id: string;
  name: string;
  coordinates: [number, number][];
  crop: string;
  area_hectares: number;
  health: "healthy" | "stress" | "critical";
  yield_predicted: number;
  last_treatment: string;
  irrigation_m3: number;
  stage: string;
}

interface FarmParcelsLayerProps {
  parcels: Parcel[];
  selectedId: string | null;
  cropStage: string;
  onSelect: (id: string) => void;
}

const HEALTH_COLORS = {
  healthy: "#22C55E",
  stress: "#D97706",
  critical: "#FF3366",
};

export function FarmParcelsLayer({ parcels, selectedId, cropStage, onSelect }: FarmParcelsLayerProps) {
  const { map } = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (!map) return;

    const fillId = "parcels-fill";
    const lineId = "parcels-line";
    const sourceId = "parcels-source";

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: parcels.map((p) => ({
        type: "Feature",
        properties: {
          id: p.id,
          health: p.health,
          color: HEALTH_COLORS[p.health],
          height: Math.max(p.yield_predicted * 400, 200),
          selected: p.id === selectedId ? 1 : 0,
          name: p.name,
          crop: p.crop,
        },
        geometry: {
          type: "Polygon",
          coordinates: [p.coordinates],
        },
      })),
    };

    if (!initialized.current) {
      map.addSource(sourceId, { type: "geojson", data: geojson });

      map.addLayer({
        id: fillId,
        type: "fill-extrusion",
        source: sourceId,
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": [
            "case", ["==", ["get", "selected"], 1], 1.0, 0.75
          ],
        },
      });

      map.addLayer({
        id: lineId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", ["==", ["get", "selected"], 1], 3, 1.5],
          "line-opacity": 0.9,
        },
      });

      map.on("click", fillId, (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) onSelect(id);
      });
      map.on("mouseenter", fillId, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", fillId, () => { map.getCanvas().style.cursor = ""; });

      initialized.current = true;
    } else {
      try {
        const src = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
        if (src) src.setData(geojson);
      } catch {}
    }

    return () => {
      try {
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getLayer(fillId)) map.removeLayer(fillId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {}
      initialized.current = false;
    };
  }, [map, parcels, selectedId]);

  return null;
}

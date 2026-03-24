import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";
import type { Vehicle } from "./VehicleLayer";

interface AvailabilityHeatmapProps {
  vehicles: Vehicle[];
}

export function AvailabilityHeatmap({ vehicles }: AvailabilityHeatmapProps) {
  const { map } = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (!map) return;

    const sourceId = "heatmap-source";
    const layerId = "heatmap-layer";

    const available = vehicles.filter((v) => v.status === "available");
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: available.map((v) => ({
        type: "Feature",
        properties: { battery: v.battery },
        geometry: {
          type: "Point",
          coordinates: v.position,
        },
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
            "heatmap-weight": [
              "interpolate", ["linear"], ["get", "battery"],
              0, 0,
              100, 1,
            ],
            "heatmap-intensity": [
              "interpolate", ["linear"], ["zoom"],
              0, 1,
              17, 3,
            ],
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.2, "rgba(255,51,102,0.4)",
              0.4, "rgba(255,184,0,0.5)",
              0.6, "rgba(0,217,255,0.5)",
              0.8, "rgba(0,255,136,0.6)",
              1, "rgba(0,255,136,0.8)",
            ],
            "heatmap-radius": [
              "interpolate", ["linear"], ["zoom"],
              10, 20,
              15, 40,
            ],
            "heatmap-opacity": 0.6,
          },
        },
        "vehicles-layer" // Place below vehicle dots
      );

      initialized.current = true;
    } else {
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
      if (source) source.setData(geojson);
    }

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* map already destroyed */ }
      initialized.current = false;
    };
  }, [map, vehicles]);

  return null;
}

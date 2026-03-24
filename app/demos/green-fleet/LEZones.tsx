import { useEffect } from "react";
import { useMap } from "~/lib/hooks/useMap";

export interface LEZone {
  id: number;
  name: string;
  restriction: string;
  coordinates: [number, number][];
}

interface LEZonesProps {
  zones: LEZone[];
}

export function LEZones({ zones }: LEZonesProps) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    const sourceId = "lez-zones";
    const fillId = "lez-fill";
    const lineId = "lez-line";

    try {
      if (map.getLayer(fillId)) map.removeLayer(fillId);
      if (map.getLayer(lineId)) map.removeLayer(lineId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch {}

    const features = zones.map((z) => ({
      type: "Feature" as const,
      properties: { name: z.name, restriction: z.restriction },
      geometry: {
        type: "Polygon" as const,
        coordinates: [z.coordinates],
      },
    }));

    map.addSource(sourceId, {
      type: "geojson",
      data: { type: "FeatureCollection", features },
    });

    map.addLayer({
      id: fillId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "#EF4444",
        "fill-opacity": 0.12,
      },
    });

    map.addLayer({
      id: lineId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#EF4444",
        "line-width": 2,
        "line-opacity": 0.7,
        "line-dasharray": [3, 2],
      },
    });

    return () => {
      try {
        if (map.getLayer(fillId)) map.removeLayer(fillId);
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {}
    };
  }, [map, zones]);

  return null;
}

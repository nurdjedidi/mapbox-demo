import { useEffect } from "react";
import { useMap } from "~/lib/hooks/useMap";

export interface RiskZone {
  id: number;
  type: "flood" | "drought";
  name: string;
  coordinates: [number, number][];
  risk_level: string;
  population_exposed: number;
  measures: string;
}

interface RiskZonesProps {
  zones: RiskZone[];
}

export function RiskZones({ zones }: RiskZonesProps) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    const sourceId = "risk-zones";
    const fillId = "risk-zones-fill";
    const lineId = "risk-zones-line";

    try {
      if (map.getLayer(fillId)) map.removeLayer(fillId);
      if (map.getLayer(lineId)) map.removeLayer(lineId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch {}

    const features = zones.map((z) => ({
      type: "Feature" as const,
      properties: {
        name: z.name,
        type: z.type,
        risk_level: z.risk_level,
        population_exposed: z.population_exposed,
        measures: z.measures,
        color: z.type === "flood" ? "#3B82F6" : "#F59E0B",
      },
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
        "fill-color": ["get", "color"],
        "fill-opacity": 0.15,
      },
    });

    map.addLayer({
      id: lineId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2,
        "line-opacity": 0.7,
        "line-dasharray": [4, 2],
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

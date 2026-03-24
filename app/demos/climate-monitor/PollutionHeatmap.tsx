import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";
import type { Sensor } from "./SensorsLayer";

interface PollutionHeatmapProps {
  sensors: Sensor[];
  type: "air" | "water" | "noise";
  year: number;
}

function getWeight(sensor: Sensor, type: "air" | "water" | "noise"): number {
  if (type === "air" && sensor.type === "air") return Math.min((sensor.pm25 ?? 0) / 80, 1);
  if (type === "water" && sensor.type === "water") return Math.min((sensor.nitrates ?? 0) / 80, 1);
  if (type === "noise" && sensor.type === "noise") return Math.min(((sensor.decibels ?? 0) - 50) / 40, 1);
  return 0;
}

function yearMultiplier(year: number): number {
  // 2020 = full intensity, 2026 = 70% (improvement trend)
  return 1 - ((year - 2020) / 6) * 0.3;
}

export function PollutionHeatmap({ sensors, type, year }: PollutionHeatmapProps) {
  const { map } = useMap();
  const initializedRef = useRef(false);

  const SOURCE_ID = "pollution-heatmap";
  const LAYER_ID = "pollution-heatmap-layer";

  function buildGeoJSON() {
    const mult = yearMultiplier(year);
    const filtered = sensors.filter((s) => s.type === type);
    return {
      type: "FeatureCollection" as const,
      features: filtered.map((s) => ({
        type: "Feature" as const,
        properties: { weight: getWeight(s, type) * mult },
        geometry: { type: "Point" as const, coordinates: s.position },
      })),
    };
  }

  useEffect(() => {
    if (!map) return;

    try {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    } catch {}

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: buildGeoJSON(),
    });

    map.addLayer(
      {
        id: LAYER_ID,
        type: "heatmap",
        source: SOURCE_ID,
        maxzoom: 17,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 2],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(59,130,246,0)",
            0.2, "rgba(59,130,246,0.5)",
            0.4, "rgba(251,191,36,0.7)",
            0.6, "rgba(249,115,22,0.8)",
            0.8, "rgba(239,68,68,0.9)",
            1, "rgba(185,28,28,1)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 30, 15, 60],
          "heatmap-opacity": 0.65,
        },
      },
      "waterway-label"
    );

    initializedRef.current = true;

    return () => {
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {}
      initializedRef.current = false;
    };
  }, [map, type]);

  // Update data when year changes (without recreating layer)
  useEffect(() => {
    if (!map || !initializedRef.current) return;
    try {
      const src = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
      if (src) src.setData(buildGeoJSON());
    } catch {}
  }, [year, sensors]);

  return null;
}

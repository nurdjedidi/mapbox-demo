import { useEffect } from "react";
import { useMap } from "~/lib/hooks/useMap";

export interface CollectionPoint {
  id: string;
  name: string;
  coordinates: [number, number];
  volume_liters: number;
  status: "cold_ok" | "temp_warning" | "critical_delay";
  temp_celsius: number;
  altitude_m: number;
}

const STATUS_COLORS: Record<CollectionPoint["status"], string> = {
  cold_ok: "#3B82F6",
  temp_warning: "#D97706",
  critical_delay: "#FF3366",
};

const STATUS_LABELS: Record<CollectionPoint["status"], string> = {
  cold_ok: "Froid OK",
  temp_warning: "Temp. élevée",
  critical_delay: "Retard critique",
};

function makeSquarePolygon(
  [lng, lat]: [number, number],
  halfDeg = 0.0006 
): [number, number][][] {
  return [[
    [lng - halfDeg, lat - halfDeg],
    [lng + halfDeg, lat - halfDeg],
    [lng + halfDeg, lat + halfDeg],
    [lng - halfDeg, lat + halfDeg],
    [lng - halfDeg, lat - halfDeg],
  ]];
}

interface CollectionPointsLayerProps {
  points: CollectionPoint[];
  onHover?: (point: CollectionPoint | null) => void;
}

export function CollectionPointsLayer({ points, onHover }: CollectionPointsLayerProps) {
  const { map } = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    const SOURCE_ID = "collection-points-extrusion";
    const LAYER_ID = "collection-points-towers";
    const GLOW_ID = "collection-points-glow";
    const ICON_LAYER_ID = "collection-points-icons";
    const TOP_HIGHLIGHT_ID = "collection-points-top";

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        properties: {
          id: p.id,
          name: p.name,
          volume: p.volume_liters,
          status: p.status,
          color: STATUS_COLORS[p.status],
          height: Math.round(p.volume_liters / 2.5),
          temp: p.temp_celsius,
          altitude: p.altitude_m,
        },
        geometry: {
          type: "Polygon",
          coordinates: makeSquarePolygon(p.coordinates),
        },
      })),
    };

    // Cleanup before adding
    try {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getLayer(GLOW_ID)) map.removeLayer(GLOW_ID);
      if (map.getLayer(TOP_HIGHLIGHT_ID)) map.removeLayer(TOP_HIGHLIGHT_ID);
      if (map.getLayer(ICON_LAYER_ID)) map.removeLayer(ICON_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    } catch (e) {
      console.error("Cleanup error in CollectionPointsLayer:", e);
    }

    map.addSource(SOURCE_ID, { type: "geojson", data: geojson });

    // 1. SILO GLOW
    map.addLayer({
      id: GLOW_ID,
      type: "circle",
      source: SOURCE_ID,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2, 16, 12],
        "circle-color": ["get", "color"],
        "circle-blur": 1.2,
        "circle-opacity": 0.4,
      },
    });

    // 2. INDUSTRIAL SILO
    map.addLayer({
      id: LAYER_ID,
      type: "fill-extrusion",
      source: SOURCE_ID,
      paint: {
        "fill-extrusion-color": ["get", "color"],
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.95,
        "fill-extrusion-vertical-gradient": true,
      },
    });

    map.addLayer({
      id: TOP_HIGHLIGHT_ID,
      type: "fill-extrusion",
      source: SOURCE_ID,
      paint: {
        "fill-extrusion-color": "#ffffff",
        "fill-extrusion-height": ["+", ["get", "height"], 1],
        "fill-extrusion-base": ["get", "height"],
        "fill-extrusion-opacity": 0.9,
      },
    });

    map.addLayer({
      id: ICON_LAYER_ID,
      type: "symbol",
      source: SOURCE_ID,
      layout: {
        "icon-image": "farm",
        "icon-size": 0.8,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "text-field": ["get", "name"],
        "text-size": 10,
        "text-offset": [0, 2],
        "text-anchor": "top",
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(0,0,0,0.8)",
        "text-halo-width": 1,
      }
    });

    map.on("mousemove", LAYER_ID, (e) => {
      if (!e.features?.length) return;
      map.getCanvas().style.cursor = "pointer";
      const props = e.features[0].properties as Record<string, unknown>;
      const pt = points.find((p) => p.id === props.id);
      if (pt) onHover?.(pt);
    });

    map.on("mouseleave", LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
      onHover?.(null);
    });

    return () => {
      try {
        map.off("mousemove", LAYER_ID, () => {});
        map.off("mouseleave", LAYER_ID, () => {});
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getLayer(GLOW_ID)) map.removeLayer(GLOW_ID);
        if (map.getLayer(TOP_HIGHLIGHT_ID)) map.removeLayer(TOP_HIGHLIGHT_ID);
        if (map.getLayer(ICON_LAYER_ID)) map.removeLayer(ICON_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {}
    };
  }, [map, points]);

  return null;
}

export { STATUS_COLORS, STATUS_LABELS };

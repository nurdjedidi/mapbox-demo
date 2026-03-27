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
  cold_ok: "#22D3EE",
  temp_warning: "#F97316",
  critical_delay: "#FF1744",
};

const STATUS_LABELS: Record<CollectionPoint["status"], string> = {
  cold_ok: "Froid OK",
  temp_warning: "Temp. élevée",
  critical_delay: "Retard critique",
};

/** 32-sided polygon approximating a circle (cylinder base) */
function makeCirclePolygon(
  [lng, lat]: [number, number],
  radiusDeg = 0.0008,
  sides = 32
): [number, number][][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * 2 * Math.PI;
    coords.push([lng + radiusDeg * Math.cos(angle), lat + radiusDeg * Math.sin(angle)]);
  }
  return [coords];
}

interface CollectionPointsLayerProps {
  points: CollectionPoint[];
  onHover?: (point: CollectionPoint | null) => void;
}

export function CollectionPointsLayer({ points, onHover }: CollectionPointsLayerProps) {
  const { map } = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    const POLY_SOURCE = "cp-poly-src";
    const PT_SOURCE = "cp-pt-src";
    const GLOW_OUTER = "cp-glow-outer";
    const GLOW_MID = "cp-glow-mid";
    const GLOW_INNER = "cp-glow-inner";
    const CYLINDER_ID = "cp-cylinders";
    const CAP_ID = "cp-caps";
    const LABEL_ID = "cp-labels";

    const polyGeoJSON: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        properties: {
          id: p.id,
          name: p.name,
          volume: p.volume_liters,
          status: p.status,
          color: STATUS_COLORS[p.status],
          height: Math.round(p.volume_liters / 1.8),
          temp: p.temp_celsius,
        },
        geometry: {
          type: "Polygon",
          coordinates: makeCirclePolygon(p.coordinates),
        },
      })),
    };

    const ptGeoJSON: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        properties: {
          id: p.id,
          color: STATUS_COLORS[p.status],
          volume: p.volume_liters,
        },
        geometry: { type: "Point", coordinates: p.coordinates },
      })),
    };

    // Cleanup
    const layers = [GLOW_OUTER, GLOW_MID, GLOW_INNER, CYLINDER_ID, CAP_ID, LABEL_ID];
    const sources = [POLY_SOURCE, PT_SOURCE];
    try {
      layers.forEach((l) => { if (map.getLayer(l)) map.removeLayer(l); });
      sources.forEach((s) => { if (map.getSource(s)) map.removeSource(s); });
    } catch {}

    map.addSource(POLY_SOURCE, { type: "geojson", data: polyGeoJSON });
    map.addSource(PT_SOURCE, { type: "geojson", data: ptGeoJSON });

    // 1. Outer glow — large, very diffuse
    map.addLayer({
      id: GLOW_OUTER,
      type: "circle",
      source: PT_SOURCE,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 8, 14, 40],
        "circle-color": ["get", "color"],
        "circle-blur": 1.8,
        "circle-opacity": 0.18,
      },
    });

    // 2. Mid glow
    map.addLayer({
      id: GLOW_MID,
      type: "circle",
      source: PT_SOURCE,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 5, 14, 24],
        "circle-color": ["get", "color"],
        "circle-blur": 1.2,
        "circle-opacity": 0.4,
      },
    });

    // 3. Inner glow — sharp halo
    map.addLayer({
      id: GLOW_INNER,
      type: "circle",
      source: PT_SOURCE,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 3, 14, 12],
        "circle-color": ["get", "color"],
        "circle-blur": 0.5,
        "circle-opacity": 0.7,
      },
    });

    // 4. Cylinder body (fill-extrusion)
    map.addLayer({
      id: CYLINDER_ID,
      type: "fill-extrusion",
      source: POLY_SOURCE,
      paint: {
        "fill-extrusion-color": ["get", "color"],
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.92,
        "fill-extrusion-vertical-gradient": true,
      },
    });

    // 5. Cylinder cap (white top)
    map.addLayer({
      id: CAP_ID,
      type: "fill-extrusion",
      source: POLY_SOURCE,
      paint: {
        "fill-extrusion-color": "#ffffff",
        "fill-extrusion-height": ["+", ["get", "height"], 1.5],
        "fill-extrusion-base": ["get", "height"],
        "fill-extrusion-opacity": 0.95,
      },
    });

    // 6. Name label
    map.addLayer({
      id: LABEL_ID,
      type: "symbol",
      source: PT_SOURCE,
      minzoom: 10,
      layout: {
        "text-field": ["get", "id"],
        "text-size": 9,
        "text-offset": [0, 1.8],
        "text-anchor": "top",
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(0,0,0,0.9)",
        "text-halo-width": 1,
        "text-opacity": 0.7,
      },
    });

    map.on("mousemove", CYLINDER_ID, (e) => {
      if (!e.features?.length) return;
      map.getCanvas().style.cursor = "pointer";
      const props = e.features[0].properties as Record<string, unknown>;
      const pt = points.find((p) => p.id === props.id);
      if (pt) onHover?.(pt);
    });
    map.on("mouseleave", CYLINDER_ID, () => {
      map.getCanvas().style.cursor = "";
      onHover?.(null);
    });

    return () => {
      try {
        map.off("mousemove", CYLINDER_ID, () => {});
        map.off("mouseleave", CYLINDER_ID, () => {});
        layers.forEach((l) => { if (map.getLayer(l)) map.removeLayer(l); });
        sources.forEach((s) => { if (map.getSource(s)) map.removeSource(s); });
      } catch {}
    };
  }, [map, points]);

  return null;
}

export { STATUS_COLORS, STATUS_LABELS };

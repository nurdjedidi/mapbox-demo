import { useEffect } from "react";
import { useMap } from "~/lib/hooks/useMap";

export function TerrainLayer() {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    try {
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
      }

      map.setTerrain({ source: "mapbox-dem", exaggeration: 2.8 });

      if (!map.getLayer("sky")) {
        map.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0.0, 90.0],
            "sky-atmosphere-sun-intensity": 12,
            "sky-atmosphere-color": "rgba(20, 30, 60, 1)",
            "sky-atmosphere-halo-color": "rgba(59, 130, 246, 0.3)",
          },
        } as mapboxgl.AnyLayer);
      }
    } catch {}

    return () => {
      try {
        map.setTerrain(null as unknown as mapboxgl.TerrainSpecification);
        if (map.getLayer("sky")) map.removeLayer("sky");
        if (map.getSource("mapbox-dem")) map.removeSource("mapbox-dem");
      } catch {}
    };
  }, [map]);

  return null;
}

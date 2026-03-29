import { useEffect } from "react";
import { useMap } from "~/lib/hooks/useMap";

/**
 * Hides road labels, POI labels, and settlement labels so that
 * only our custom data layers are visible on the dark basemap.
 */
export function CleanMapLayer() {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    function applyCleanup() {
      if (!map) return;
      const layers = map.getStyle().layers || [];
      layers.forEach((layer) => {
        if (layer.type !== "symbol") return;
        const id = layer.id.toLowerCase();
        const shouldHide =
          id.includes("road-label") ||
          id.includes("street-label") ||
          id.includes("poi-label") ||
          id.includes("transit") ||
          id.includes("ferry-aerialway-label");
        if (shouldHide) {
          try {
            map!.setLayoutProperty(layer.id, "visibility", "none");
          } catch {}
        }
      });
    }

    if (map.isStyleLoaded()) {
      applyCleanup();
    } else {
      map.once("styledata", applyCleanup);
    }

    return () => {
      try { map.off("styledata", applyCleanup); } catch {}
    };
  }, [map]);

  return null;
}

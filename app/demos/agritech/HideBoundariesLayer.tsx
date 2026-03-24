import { useEffect } from "react";
import { useMap } from "~/lib/hooks/useMap";

const BOUNDARY_LAYERS = [
  "admin-0-boundary-disputed",
  "admin-0-boundary-bg",
  "admin-1-boundary",
  "admin-1-boundary-bg",
];

export function HideBoundariesLayer() {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    function hideLayers() {
      for (const layerId of BOUNDARY_LAYERS) {
        try {
          if (map!.getLayer(layerId)) {
            map!.setLayoutProperty(layerId, "visibility", "none");
          }
        } catch {
        }
      }
    }

    if (map.isStyleLoaded()) {
      hideLayers();
    } else {
      map.once("styledata", hideLayers);
    }

    return () => {
      try {
        map.off("styledata", hideLayers);
      } catch {
      }
    };
  }, [map]);

  return null;
}

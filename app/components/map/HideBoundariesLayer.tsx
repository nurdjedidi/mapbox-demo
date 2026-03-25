import { useEffect } from "react";
import { useMap } from "~/lib/hooks/useMap";

export function HideBoundariesLayer() {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    function applyOverrides() {
      if (!map) return;

      map.getStyle().layers?.forEach((layer) => {
        if (layer.id.toLowerCase().includes("disputed")) {
          try {
            map.setLayoutProperty(layer.id, "visibility", "none");
          } catch {}
        }
      });

      try {
        if (map.getLayer("country-label")) {
          const existing = map.getFilter("country-label");
          let newFilter: any;
          const excludes = [
            ["!=", ["get", "name_en"], "Israel"],
            ["!=", ["get", "name_en"], "Western Sahara"],
          ];
          if (Array.isArray(existing) && existing[0] === "all") {
            newFilter = [...existing, ...excludes];
          } else if (existing) {
            newFilter = ["all", existing, ...excludes];
          } else {
            newFilter = ["all", ...excludes];
          }
          map.setFilter("country-label", newFilter);
        }
      } catch {}

      try {
        if (!map.getSource("_palestine-src")) {
          map.addSource("_palestine-src", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: { type: "Point", coordinates: [35.3, 31.9] },
              properties: {},
            },
          });
        }
        if (!map.getLayer("_palestine-label")) {
          map.addLayer({
            id: "_palestine-label",
            type: "symbol",
            source: "_palestine-src",
            minzoom: 2,
            maxzoom: 7,
            layout: {
              "text-field": "PALESTINE",
              "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
              "text-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2, 11,
                5, 15,
                7, 17,
              ],
              "text-letter-spacing": 0.12,
            },
            paint: {
              "text-color": "#ACBCD2",
              "text-halo-width": 0,
              "text-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2, 0.8,
                6.5, 0.8,
                7, 0,
              ],
            },
          });
        }
      } catch {}
    }

    if (map.isStyleLoaded()) {
      applyOverrides();
    } else {
      map.once("styledata", applyOverrides);
    }

    return () => {
      try {
        map.off("styledata", applyOverrides);
      } catch {}
    };
  }, [map]);

  return null;
}

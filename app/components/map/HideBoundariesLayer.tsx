import { useEffect } from "react";
import { useMap } from "~/lib/hooks/useMap";

export function HideBoundariesLayer() {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    function applyOverrides() {
      if (!map) return;

      const layers = map.getStyle().layers || [];
      const styleName = map.getStyle().name?.toLowerCase() || "";
      const isStandardStyle = styleName.includes("standard") || 
        (map.getStyle().metadata as any)?.["mapbox:origin"] === "standard";
      const WORLDVIEW = "MA";

      // 1. Pour le style Standard -> Désactiver les frontières dans la config du basemap
      if (isStandardStyle) {
        try {
          (map as any).setConfigProperty?.("basemap", "showAdminBoundaries", false);
          (map as any).setConfigProperty?.("basemap", "showRoadLabels", true);
        } catch (e) {}
      }

      // 2. Parcourir toutes les couches pour appliquer le Worldview et les filtres de sécurité
      layers.forEach((layer) => {
        const id = layer.id.toLowerCase();
        const isAdminOrBoundary = id.includes('admin') || id.includes('boundary') || id.includes('disputed');
        const isCountryLabel = id.includes('country-label') || id.includes('place-label-country');

        if (isAdminOrBoundary || isCountryLabel) {
          try {
            // Filtre par worldview (Méthode officielle)
            const worldviewFilter = [
              "match",
              ["get", "worldview"],
              ["all", WORLDVIEW],
              true,
              false
            ];

            // On combine avec les filtres existants et l'exclusion EH/Israel
            const excludes = [
              ["!=", ["get", "name_en"], "Israel"],
              ["!=", ["get", "name_en"], "Western Sahara"],
              ["!=", ["get", "name_en"], "W. Sahara"],
              ["!=", ["get", "iso_3166_1"], "EH"],
              ["!=", ["get", "iso_3166_1_l"], "EH"],
            ];

            const existingFilter = map!.getFilter(layer.id) || ["all"];
            map!.setFilter(layer.id, [
              "all",
              existingFilter,
              worldviewFilter,
              ...excludes
            ] as any);

            // Pour les frontières, on force aussi le masquage si nécessaire
            if (isAdminOrBoundary && id.includes('disputed')) {
              map!.setLayoutProperty(layer.id, "visibility", "none");
            }
          } catch (e) {}
        }
      });

      // 3. Label PALESTINE (Style de ton snippet)
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
                "interpolate", ["linear"], ["zoom"],
                2, 11, 5, 15, 7, 17,
              ],
              "text-letter-spacing": 0.12,
            },
            paint: {
              "text-color": "#ACBCD2",
              "text-halo-width": 0,
              "text-opacity": [
                "interpolate", ["linear"], ["zoom"],
                2, 0.8, 6.5, 0.8, 7, 0,
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
      try { map.off("styledata", applyOverrides); } catch {}
    };
  }, [map]);

  return null;
}

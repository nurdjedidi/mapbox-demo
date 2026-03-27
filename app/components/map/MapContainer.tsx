import { useEffect, useRef, useState, type ReactNode } from "react";
import { MapContext } from "~/lib/hooks/useMap";
import {
  DEFAULT_BEARING,
  DEFAULT_CENTER,
  DEFAULT_MAP_STYLE,
  DEFAULT_PITCH,
  DEFAULT_ZOOM,
  MAPBOX_TOKEN,
} from "~/lib/mapbox/config";
import { getMapboxGL } from "~/lib/mapbox/mapboxSingleton";

interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  style?: string;
  onLoad?: (map: mapboxgl.Map) => void;
  className?: string;
  children?: ReactNode;
}

export function MapContainer({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  pitch = DEFAULT_PITCH,
  bearing = DEFAULT_BEARING,
  style = DEFAULT_MAP_STYLE,
  onLoad,
  className = "",
  children,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Initialisation...");

  const isSatellite = style.includes("satellite");
  const isStandard = style.includes("standard");

  useEffect(() => {
    if (!containerRef.current) return;

    let mapInstance: mapboxgl.Map;

    getMapboxGL().then((mapboxgl) => {
      if (!containerRef.current) return;

      mapboxgl.default.accessToken = MAPBOX_TOKEN;

      mapInstance = new mapboxgl.default.Map({
        container: containerRef.current,
        style,
        center,
        zoom,
        pitch,
        bearing,
        antialias: true,
        attributionControl: false,

      });

      mapInstance.on("styledata", () => setLoadingMsg("Chargement du style..."));
      mapInstance.on("sourcedataloading", () => setLoadingMsg("Chargement des tuiles..."));

      mapInstance.on("load", () => {
        // Basic setup without worldview (HideBoundariesLayer handles territories via filters)

        if (!isSatellite && !isStandard) {
          try {
            const layers = mapInstance.getStyle().layers;
            const labelLayerId = layers?.find(
              (layer) =>
                layer.type === "symbol" &&
                (layer.layout as Record<string, unknown>)?.["text-field"]
            )?.id;

            if (mapInstance.getSource("composite")) {
              mapInstance.addLayer(
                {
                  id: "3d-buildings",
                  source: "composite",
                  "source-layer": "building",
                  filter: ["==", "extrude", "true"],
                  type: "fill-extrusion",
                  minzoom: 14,
                  paint: {
                    "fill-extrusion-color": "#1E2840",
                    "fill-extrusion-height": [
                      "interpolate", ["linear"], ["zoom"],
                      15, 0, 15.05, ["get", "height"],
                    ],
                    "fill-extrusion-base": [
                      "interpolate", ["linear"], ["zoom"],
                      15, 0, 15.05, ["get", "min_height"],
                    ],
                    "fill-extrusion-opacity": 0.8,
                  },
                },
                labelLayerId
              );
            }
          } catch {}
        }

        setMap(mapInstance);
        onLoad?.(mapInstance);
      });
    });

    return () => {
      if (mapInstance) mapInstance.remove();
      setMap(null);
      setLoadingMsg("Initialisation...");
    };
  }, []);

  return (
    <MapContext value={{ map, setMap }}>
      <div className={`absolute inset-0 ${className}`}>
        <div ref={containerRef} className="w-full h-full" />

        {!map && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-bg/90 backdrop-blur-sm z-20 pointer-events-none">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-white/5" />
                <div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-eco-green"
                  style={{ animation: "spin 0.9s linear infinite" }}
                />
                <div className="absolute inset-2 rounded-full border border-eco-green/20" />
              </div>
              <div className="text-center">
                <p className="text-xs text-white/60 font-mono tracking-wider">{loadingMsg}</p>
              </div>
            </div>
          </div>
        )}

        {map && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ animation: "fadeIn 0.4s ease-out forwards" }}
          >
            {children}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </MapContext>
  );
}

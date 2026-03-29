import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
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
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const [map, setMap]           = useState<mapboxgl.Map | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Initialisation...");
  const [isPanorama, setIsPanorama] = useState(false);

  const origCameraRef = useRef<{ pitch: number; zoom: number; bearing: number } | null>(null);
  const orbitRef      = useRef<number>(0);
  const orbitAngleRef = useRef<number>(0);

  const isSatellite = style.includes("satellite");
  const isStandard  = style.includes("standard");

  // ── Panorama toggle ────────────────────────────────────────────────────────
  const handlePanorama = useCallback(() => {
    const m = mapRef.current;
    if (!m) return;

    if (!isPanorama) {
      // Store current camera
      origCameraRef.current = {
        pitch:   m.getPitch(),
        zoom:    m.getZoom(),
        bearing: m.getBearing(),
      };
      orbitAngleRef.current = m.getBearing();

      // Fly to dramatic bird's-eye view
      m.flyTo({
        pitch:    68,
        zoom:     Math.max(Math.min(m.getZoom() + 2.2, 16), 14.5),
        bearing:  m.getBearing() + 20,
        duration: 2600,
        essential: true,
        easing: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
      });

      // Enhance 3D buildings
      try {
        if (m.getLayer("3d-buildings")) {
          m.setPaintProperty("3d-buildings", "fill-extrusion-color", [
            "interpolate", ["linear"], ["zoom"],
            14, "#1a3a5c",
            16, "#2563eb",
            17, "#3b82f6",
          ]);
          m.setPaintProperty("3d-buildings", "fill-extrusion-opacity", 0.95);
          m.setLayerZoomRange("3d-buildings", 12, 24);
        }
      } catch {}

      // Start slow orbit after fly finishes
      const startOrbit = () => {
        function orbit() {
          const currentMap = mapRef.current;
          if (!currentMap) return;
          orbitAngleRef.current += 0.025;
          currentMap.setBearing(orbitAngleRef.current);
          orbitRef.current = requestAnimationFrame(orbit);
        }
        orbitRef.current = requestAnimationFrame(orbit);
      };
      setTimeout(startOrbit, 2700);

      setIsPanorama(true);
    } else {
      // Stop orbit
      cancelAnimationFrame(orbitRef.current);

      // Restore original camera
      const orig = origCameraRef.current;
      m.flyTo({
        pitch:    orig?.pitch   ?? pitch,
        zoom:     orig?.zoom    ?? zoom,
        bearing:  orig?.bearing ?? bearing,
        duration: 1800,
        essential: true,
      });

      // Restore 3D buildings
      try {
        if (m.getLayer("3d-buildings")) {
          m.setPaintProperty("3d-buildings", "fill-extrusion-color", "#1E2840");
          m.setPaintProperty("3d-buildings", "fill-extrusion-opacity", 0.8);
          m.setLayerZoomRange("3d-buildings", 14, 24);
        }
      } catch {}

      setIsPanorama(false);
    }
  }, [isPanorama, pitch, zoom, bearing]);

  // Cleanup orbit on unmount
  useEffect(() => () => cancelAnimationFrame(orbitRef.current), []);

  // ── Map init ───────────────────────────────────────────────────────────────
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

      mapInstance.on("styledata",       () => setLoadingMsg("Chargement du style..."));
      mapInstance.on("sourcedataloading", () => setLoadingMsg("Chargement des tuiles..."));

      mapInstance.on("load", () => {
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

        mapRef.current = mapInstance;
        setMap(mapInstance);
        onLoad?.(mapInstance);
      });
    });

    return () => {
      cancelAnimationFrame(orbitRef.current);
      if (mapInstance) mapInstance.remove();
      mapRef.current = null;
      setMap(null);
      setLoadingMsg("Initialisation...");
    };
  }, []);

  return (
    <MapContext value={{ map, setMap }}>
      <div className={`absolute inset-0 ${className}`}>
        <div ref={containerRef} className="w-full h-full" />

        {/* Loading overlay */}
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
              <p className="text-xs text-white/60 font-mono tracking-wider">{loadingMsg}</p>
            </div>
          </div>
        )}

        {map && (
          <>
            {/* Map layers */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ animation: "fadeIn 0.4s ease-out forwards" }}
            >
              {children}
            </div>

            {/* Panorama button */}
            <button
              onClick={handlePanorama}
              title={isPanorama ? "Vue normale" : "Vue panoramique 3D"}
              className="absolute bottom-8 left-3 z-10 pointer-events-auto group"
              style={{ filter: isPanorama ? "drop-shadow(0 0 8px rgba(59,130,246,0.7))" : "none" }}
            >
              <div className={`
                flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300
                backdrop-blur-md border
                ${isPanorama
                  ? "bg-blue-500/20 border-blue-400/50 text-blue-300"
                  : "bg-black/40 border-white/10 text-white/50 hover:bg-black/60 hover:border-white/20 hover:text-white/80"
                }
              `}>
                {/* 3D building icon */}
                <svg viewBox="0 0 20 20" width="15" height="15" fill="none" xmlns="http://www.w3.org/2000/svg"
                     className="transition-transform duration-300 group-hover:scale-110">
                  {isPanorama ? (
                    <>
                      {/* Active: coloured 3D building */}
                      <path d="M2 14 L2 7 L8 4 L8 14 Z" fill="currentColor" opacity="0.9"/>
                      <path d="M8 14 L8 4 L14 6 L14 14 Z" fill="currentColor" opacity="0.6"/>
                      <path d="M2 7 L8 4 L14 6 L8 9 Z" fill="currentColor" opacity="1"/>
                      <path d="M5 14 L5 10 L7.5 9 L7.5 14 Z" fill="white" opacity="0.25"/>
                    </>
                  ) : (
                    <>
                      {/* Idle: outline building */}
                      <path d="M2 14 L2 7 L8 4 L8 14 Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                      <path d="M8 14 L8 4 L14 6 L14 14 Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                      <path d="M2 7 L8 4 L14 6 L8 9 Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                      <line x1="2" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2"/>
                    </>
                  )}
                </svg>
                <span className="text-[10px] font-medium tracking-wide leading-none">
                  {isPanorama ? "3D ON" : "3D"}
                </span>
                {isPanorama && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                )}
              </div>
            </button>

            {/* Panorama mode label */}
            {isPanorama && (
              <div
                className="absolute bottom-8 left-[4.5rem] z-10 pointer-events-none"
                style={{ animation: "fadeIn 0.5s ease-out forwards" }}
              >
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-400/20 backdrop-blur-sm">
                  <span className="text-[10px] text-blue-300/70 font-mono tracking-wider">VUE PANORAMIQUE</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin   { to   { transform: rotate(360deg); } }
      `}</style>
    </MapContext>
  );
}

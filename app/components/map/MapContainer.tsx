import { useEffect, useRef, useState, type ReactNode } from "react";
import { MapContext } from "~/lib/hooks/useMap";
import {
  MAPBOX_TOKEN,
  DEFAULT_MAP_STYLE,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  DEFAULT_PITCH,
  DEFAULT_BEARING,
} from "~/lib/mapbox/config";

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

  useEffect(() => {
    if (!containerRef.current) return;

    let mapInstance: mapboxgl.Map;

    import("mapbox-gl").then((mapboxgl) => {
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

      mapInstance.on("load", () => {
        const isStandardStyle = style.includes("standard");
        if (!isStandardStyle) {
          const layers = mapInstance.getStyle().layers;
          const labelLayerId = layers?.find(
            (layer) =>
              layer.type === "symbol" &&
              (layer.layout as Record<string, unknown>)?.["text-field"]
          )?.id;

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
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15, 0,
                  15.05, ["get", "height"],
                ],
                "fill-extrusion-base": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15, 0,
                  15.05, ["get", "min_height"],
                ],
                "fill-extrusion-opacity": 0.8,
              },
            },
            labelLayerId
          );
        }

        setMap(mapInstance);
        onLoad?.(mapInstance);
      });
    });

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
      setMap(null);
    };
  }, []);

  return (
    <MapContext value={{ map, setMap }}>
      <div className={`absolute inset-0 ${className}`}>
        <div ref={containerRef} className="w-full h-full" />
        {map && children}
      </div>
    </MapContext>
  );
}

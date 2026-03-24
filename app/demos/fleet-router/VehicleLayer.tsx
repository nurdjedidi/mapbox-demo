import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";

export interface FleetVehicle {
  id: number;
  name: string;
  color: string;
  waypoints: [number, number][];
  route?: [number, number][];
}

interface VehicleLayerProps {
  vehicles: FleetVehicle[];
  isPlaying: boolean;
  speed: number;
  onProgress?: (progress: number) => void;
}

function interpolatePosition(
  coords: [number, number][],
  progress: number
): [number, number] {
  const totalSegments = coords.length - 1;
  const segmentProgress = progress * totalSegments;
  const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
  const t = segmentProgress - segmentIndex;

  const from = coords[segmentIndex];
  const to = coords[Math.min(segmentIndex + 1, coords.length - 1)];

  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
  ];
}

function getBearing(from: [number, number], to: [number, number]): number {
  const dLon = ((to[0] - from[0]) * Math.PI) / 180;
  const lat1 = (from[1] * Math.PI) / 180;
  const lat2 = (to[1] * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function createTruckElement(color: string, name: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;";

  // Label above
  const label = document.createElement("div");
  label.textContent = name;
  label.style.cssText = `
    font-size:10px;font-weight:700;color:white;background:rgba(0,0,0,0.75);
    padding:2px 6px;border-radius:4px;margin-bottom:4px;white-space:nowrap;
    font-family:'Inter',sans-serif;letter-spacing:0.3px;
  `;
  el.appendChild(label);

  // Truck icon container
  const truck = document.createElement("div");
  truck.style.cssText = `
    width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;
    background:${color};border:2.5px solid rgba(255,255,255,0.9);
    box-shadow:0 3px 12px rgba(0,0,0,0.4),0 0 16px ${color}66;
    transition:transform 0.15s ease;
  `;
  truck.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h1"/>
    <path d="M15 18H9"/>
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
    <circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
  </svg>`;
  el.appendChild(truck);

  return el;
}

export function VehicleLayer({ vehicles, isPlaying, speed, onProgress }: VehicleLayerProps) {
  const { map } = useMap();
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const trailSourcesRef = useRef<string[]>([]);

  // Draw routes + waypoints + truck markers
  useEffect(() => {
    if (!map) return;

    const markerCleanups: (() => void)[] = [];

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      vehicles.forEach((vehicle) => {
        const routeCoords = vehicle.route ?? vehicle.waypoints;
        const routeSourceId = `fleet-route-${vehicle.id}`;
        const routeLayerId = `fleet-route-layer-${vehicle.id}`;
        const routeGlowId = `fleet-route-glow-${vehicle.id}`;
        const trailSourceId = `fleet-trail-${vehicle.id}`;
        const trailLayerId = `fleet-trail-layer-${vehicle.id}`;
        const stopsSourceId = `fleet-stops-${vehicle.id}`;
        const stopsLayerId = `fleet-stops-layer-${vehicle.id}`;
        const stopsLabelId = `fleet-stops-label-${vehicle.id}`;

        // Route line with glow
        try { if (map.getLayer(routeGlowId)) map.removeLayer(routeGlowId); } catch {}
        try { if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId); } catch {}
        try { if (map.getSource(routeSourceId)) map.removeSource(routeSourceId); } catch {}

        map.addSource(routeSourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: routeCoords },
          },
        });

        // Glow behind route
        map.addLayer({
          id: routeGlowId,
          type: "line",
          source: routeSourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": vehicle.color,
            "line-width": 8,
            "line-opacity": 0.15,
            "line-blur": 6,
          },
        });

        // Main route line
        map.addLayer({
          id: routeLayerId,
          type: "line",
          source: routeSourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": vehicle.color,
            "line-width": 3,
            "line-opacity": 0.5,
            "line-dasharray": [2, 2],
          },
        });

        // Trail (animated progress line)
        try { if (map.getLayer(trailLayerId)) map.removeLayer(trailLayerId); } catch {}
        try { if (map.getSource(trailSourceId)) map.removeSource(trailSourceId); } catch {}

        map.addSource(trailSourceId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [routeCoords[0]] } },
        });

        map.addLayer({
          id: trailLayerId,
          type: "line",
          source: trailSourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": vehicle.color,
            "line-width": 4,
            "line-opacity": 0.9,
          },
        });

        trailSourcesRef.current.push(trailSourceId);

        // Waypoint stops (numbered circles)
        const stops = vehicle.waypoints.slice(1, -1); // exclude start/end (same point)
        try { if (map.getLayer(stopsLabelId)) map.removeLayer(stopsLabelId); } catch {}
        try { if (map.getLayer(stopsLayerId)) map.removeLayer(stopsLayerId); } catch {}
        try { if (map.getSource(stopsSourceId)) map.removeSource(stopsSourceId); } catch {}

        map.addSource(stopsSourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: stops.map((s, i) => ({
              type: "Feature" as const,
              properties: { num: i + 1, color: vehicle.color },
              geometry: { type: "Point" as const, coordinates: s },
            })),
          },
        });

        map.addLayer({
          id: stopsLayerId,
          type: "circle",
          source: stopsSourceId,
          paint: {
            "circle-radius": 6,
            "circle-color": "rgba(10,14,26,0.8)",
            "circle-stroke-width": 2,
            "circle-stroke-color": ["get", "color"],
          },
        });

        map.addLayer({
          id: stopsLabelId,
          type: "symbol",
          source: stopsSourceId,
          layout: {
            "text-field": ["get", "num"],
            "text-size": 9,
            "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
            "text-allow-overlap": true,
          },
          paint: { "text-color": "#fff" },
        });

        // Truck marker
        const el = createTruckElement(vehicle.color, vehicle.name);
        const marker = new mapboxgl.Marker({
          element: el,
          rotationAlignment: "map",
          pitchAlignment: "map",
        })
          .setLngLat(routeCoords[0])
          .addTo(map);

        markersRef.current.push(marker);
      });
    });

    return () => {
      // Remove markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      trailSourcesRef.current = [];

      // Remove map layers/sources
      try {
        vehicles.forEach((v) => {
          const ids = [
            [`fleet-route-glow-${v.id}`, `fleet-route-layer-${v.id}`, `fleet-trail-layer-${v.id}`, `fleet-stops-label-${v.id}`, `fleet-stops-layer-${v.id}`],
            [`fleet-route-${v.id}`, `fleet-trail-${v.id}`, `fleet-stops-${v.id}`],
          ];
          ids[0].forEach((id) => { if (map.getLayer(id)) map.removeLayer(id); });
          ids[1].forEach((id) => { if (map.getSource(id)) map.removeSource(id); });
        });
      } catch { /* map already destroyed */ }
    };
  }, [map, vehicles]);

  // Animation loop
  useEffect(() => {
    if (!map || !isPlaying || markersRef.current.length === 0) return;

    startTimeRef.current = performance.now();
    const duration = 30000 / speed;

    function animate(currentTime: number) {
      if (!startTimeRef.current) return;

      const elapsed = currentTime - startTimeRef.current;
      const progress = (accumulatedRef.current + elapsed / duration) % 1;

      vehicles.forEach((v, i) => {
        const marker = markersRef.current[i];
        if (!marker) return;

        const routeCoords = v.route ?? v.waypoints;
        const pos = interpolatePosition(routeCoords, progress);

        // Calculate bearing
        const nextProgress = Math.min(progress + 0.02, 0.99);
        const nextPos = interpolatePosition(routeCoords, nextProgress);
        const bearing = getBearing(pos, nextPos);

        marker.setLngLat(pos);
        marker.setRotation(bearing - 90); // SVG truck faces right, adjust

        // Update trail
        const trailIdx = Math.floor(progress * (routeCoords.length - 1)) + 1;
        const trailCoords = routeCoords.slice(0, trailIdx);
        trailCoords.push(pos);

        try {
          const trailSource = map!.getSource(`fleet-trail-${v.id}`) as mapboxgl.GeoJSONSource;
          if (trailSource) {
            trailSource.setData({
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: trailCoords },
            });
          }
        } catch { /* ignore */ }
      });

      onProgress?.(progress);
      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (startTimeRef.current) {
        const elapsed = performance.now() - startTimeRef.current;
        accumulatedRef.current = (accumulatedRef.current + elapsed / (30000 / speed)) % 1;
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      startTimeRef.current = null;
    };
  }, [map, isPlaying, speed]);

  return null;
}

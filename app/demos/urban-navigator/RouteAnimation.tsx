import { useEffect, useRef } from "react";
import { useMap } from "~/lib/hooks/useMap";
import { ROUTE_COLOR, ROUTE_ALT_COLOR, ROUTE_LINE_WIDTH, ANIMATION_DURATION } from "~/lib/mapbox/config";
import type { RouteData } from "~/lib/mapbox/routing";

interface RouteAnimationProps {
  routes: RouteData[];
  selectedIndex: number;
  isAnimating: boolean;
  onAnimationEnd: () => void;
}

// Calculate bearing between two points
function getBearing(from: [number, number], to: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLon = toRad(to[0] - from[0]);
  const lat1 = toRad(from[1]);
  const lat2 = toRad(to[1]);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Interpolate along coordinates with fractional position
function interpolateAlongRoute(
  coords: [number, number][],
  progress: number
): { position: [number, number]; bearing: number; index: number } {
  const totalSegments = coords.length - 1;
  const segmentProgress = progress * totalSegments;
  const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
  const t = segmentProgress - segmentIndex;

  const from = coords[segmentIndex];
  const to = coords[Math.min(segmentIndex + 1, coords.length - 1)];

  const position: [number, number] = [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
  ];

  // Look ahead a few points for smoother bearing
  const lookAheadIdx = Math.min(segmentIndex + 3, coords.length - 1);
  const bearing = getBearing(from, coords[lookAheadIdx]);

  return { position, bearing, index: segmentIndex };
}

// Smooth bearing transition to avoid 360->0 jumps
function smoothBearing(current: number, target: number, factor: number): number {
  let diff = target - current;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return current + diff * factor;
}

export function RouteAnimation({ routes, selectedIndex, isAnimating, onAnimationEnd }: RouteAnimationProps) {
  const { map } = useMap();
  const animationRef = useRef<number | null>(null);
  const currentBearingRef = useRef(0);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const savedViewRef = useRef<{ center: [number, number]; zoom: number; pitch: number; bearing: number } | null>(null);

  // Draw all routes
  useEffect(() => {
    if (!map || routes.length === 0) return;

    // Clean up existing layers
    for (let i = 0; i < 5; i++) {
      if (map.getLayer(`route-${i}`)) map.removeLayer(`route-${i}`);
      if (map.getSource(`route-${i}`)) map.removeSource(`route-${i}`);
    }
    if (map.getLayer("route-trail")) map.removeLayer("route-trail");
    if (map.getSource("route-trail")) map.removeSource("route-trail");

    // Add route layers
    routes.forEach((route, i) => {
      const isSelected = i === selectedIndex;

      map.addSource(`route-${i}`, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: route.geometry as GeoJSON.Geometry,
        },
      });

      // Glow effect for selected route
      if (isSelected) {
        map.addLayer({
          id: `route-${i}`,
          type: "line",
          source: `route-${i}`,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ROUTE_COLOR,
            "line-width": ROUTE_LINE_WIDTH + 2,
            "line-opacity": 0.9,
            "line-blur": 3,
          },
        });
      } else {
        map.addLayer({
          id: `route-${i}`,
          type: "line",
          source: `route-${i}`,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ROUTE_ALT_COLOR,
            "line-width": 2,
            "line-opacity": 0.25,
          },
        });
      }
    });

    // Fit bounds
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      const coords = routes[selectedIndex].geometry.coordinates;
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((coord) => bounds.extend(coord as [number, number]));
      map.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 50, right: 440 },
        duration: 1000,
        pitch: 60,
      });
    });

    return () => {
      try {
        for (let i = 0; i < 5; i++) {
          if (map.getLayer(`route-${i}`)) map.removeLayer(`route-${i}`);
          if (map.getSource(`route-${i}`)) map.removeSource(`route-${i}`);
        }
        if (map.getLayer("route-trail")) map.removeLayer("route-trail");
        if (map.getSource("route-trail")) map.removeSource("route-trail");
      } catch { /* map already destroyed */ }
    };
  }, [map, routes, selectedIndex]);

  // Immersive drive animation
  useEffect(() => {
    if (!map || !isAnimating || routes.length === 0) return;

    const route = routes[selectedIndex];
    const coordinates = route.geometry.coordinates as [number, number][];

    // Save current view to restore later
    const center = map.getCenter();
    savedViewRef.current = {
      center: [center.lng, center.lat],
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
    };

    // Create vehicle marker
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      // Vehicle marker element
      const el = document.createElement("div");
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";
      el.style.background = ROUTE_COLOR;
      el.style.border = "3px solid white";
      el.style.boxShadow = `0 0 20px ${ROUTE_COLOR}, 0 0 40px ${ROUTE_COLOR}44`;
      el.style.transition = "transform 0.1s ease";

      markerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(coordinates[0])
        .addTo(map);

      // Trail line (already driven path)
      if (map.getLayer("route-trail")) map.removeLayer("route-trail");
      if (map.getSource("route-trail")) map.removeSource("route-trail");

      map.addSource("route-trail", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [coordinates[0]] },
        },
      });

      map.addLayer({
        id: "route-trail",
        type: "line",
        source: "route-trail",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": ROUTE_LINE_WIDTH + 1,
          "line-opacity": 0.6,
        },
      });

      // Dim route during animation
      if (map.getLayer(`route-${selectedIndex}`)) {
        map.setPaintProperty(`route-${selectedIndex}`, "line-opacity", 0.3);
      }

      // Initialize bearing
      currentBearingRef.current = getBearing(coordinates[0], coordinates[Math.min(5, coordinates.length - 1)]);

      // Initial camera swoop
      map.easeTo({
        center: coordinates[0],
        zoom: 17.5,
        pitch: 72,
        bearing: currentBearingRef.current,
        duration: 1500,
      });

      const startTime = performance.now() + 1500; // Wait for initial swoop

      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        if (elapsed < 0) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        // Ease: slow start, steady middle, slow end
        const eased = progress < 0.1
          ? progress * 5 * progress * 5 * 0.04 // ease in
          : progress > 0.9
            ? 1 - Math.pow(1 - progress, 3) // ease out
            : progress; // linear middle

        const { position, bearing } = interpolateAlongRoute(coordinates, eased);

        // Smooth bearing
        currentBearingRef.current = smoothBearing(currentBearingRef.current, bearing, 0.08);

        // Update vehicle position
        markerRef.current?.setLngLat(position);

        // Update trail
        const trailIdx = Math.floor(eased * (coordinates.length - 1)) + 1;
        const trailCoords = coordinates.slice(0, trailIdx);
        trailCoords.push(position);
        const trailSource = map!.getSource("route-trail") as mapboxgl.GeoJSONSource;
        if (trailSource) {
          trailSource.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: trailCoords },
          });
        }

        // Camera follows vehicle
        map!.easeTo({
          center: position,
          bearing: currentBearingRef.current,
          pitch: 72,
          zoom: 17.5,
          duration: 100,
          easing: (t) => t, // linear for smooth following
        });

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete — restore view
          cleanup();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    });

    function cleanup() {
      if (!map) return;
      // Remove marker
      markerRef.current?.remove();
      markerRef.current = null;

      // Remove trail
      if (map.getLayer("route-trail")) map.removeLayer("route-trail");
      if (map.getSource("route-trail")) map.removeSource("route-trail");

      // Restore route opacity
      if (map.getLayer(`route-${selectedIndex}`)) {
        map.setPaintProperty(`route-${selectedIndex}`, "line-opacity", 0.9);
      }

      // Fly back to overview
      if (savedViewRef.current) {
        const { center, zoom, pitch, bearing } = savedViewRef.current;
        map.flyTo({ center, zoom, pitch, bearing, duration: 2000 });
      }

      onAnimationEnd();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      markerRef.current?.remove();
      markerRef.current = null;
      try {
        if (map.getLayer("route-trail")) map.removeLayer("route-trail");
        if (map.getSource("route-trail")) map.removeSource("route-trail");
      } catch { /* map already destroyed */ }
    };
  }, [map, isAnimating, routes, selectedIndex]);

  return null;
}

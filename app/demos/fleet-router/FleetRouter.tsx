import { useState, useMemo, useRef, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { MapContainer } from "~/components/map/MapContainer";
import { DemoLayout } from "~/components/layout/DemoLayout";
import { SidePanel } from "~/components/layout/SidePanel";
import { VehicleLayer, type FleetVehicle } from "./VehicleLayer";
import { OptimizationPanel } from "./OptimizationPanel";
import { ReplayControls } from "./ReplayControls";
import { CITIES } from "~/lib/mapbox/config";
import rawVehicles from "~/data/mock-vehicles.json";

function optimizeRoute(waypoints: [number, number][]): [number, number][] {
  if (waypoints.length <= 2) return waypoints;

  const start = waypoints[0];
  const remaining = [...waypoints.slice(1, -1)];
  const optimized: [number, number][] = [start];

  while (remaining.length > 0) {
    const last = optimized[optimized.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;

    remaining.forEach((point, idx) => {
      const dist = Math.sqrt(
        Math.pow(point[0] - last[0], 2) + Math.pow(point[1] - last[1], 2)
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });

    optimized.push(remaining[nearestIdx]);
    remaining.splice(nearestIdx, 1);
  }

  optimized.push(start);
  return optimized;
}

export function FleetRouter() {
  const [isOptimized, setIsOptimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const progressRef = useRef(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);

  // Memoize vehicles so they don't change on every render
  const vehicles: FleetVehicle[] = useMemo(
    () =>
      (rawVehicles as FleetVehicle[]).map((v) => ({
        ...v,
        route: isOptimized ? optimizeRoute(v.waypoints) : v.waypoints,
      })),
    [isOptimized]
  );

  const cityConfig = CITIES.casablanca;

  const handleOptimize = () => {
    setIsOptimized(true);
    setIsPlaying(false);
    progressRef.current = 0;
  };

  const handleReset = () => {
    setIsPlaying(false);
    progressRef.current = 0;
    if (progressBarRef.current) progressBarRef.current.style.width = "0%";
    if (progressTextRef.current) progressTextRef.current.textContent = "0%";
  };

  // Update progress DOM directly — no setState per frame
  const handleProgress = useCallback((p: number) => {
    progressRef.current = p;
    if (progressBarRef.current) progressBarRef.current.style.width = `${Math.round(p * 100)}%`;
    if (progressTextRef.current) progressTextRef.current.textContent = `${Math.round(p * 100)}%`;
  }, []);

  return (
    <DemoLayout>
      <MapContainer
        center={cityConfig.center}
        zoom={cityConfig.zoom}
        pitch={cityConfig.pitch}
        bearing={cityConfig.bearing}
      >
        <VehicleLayer
          vehicles={vehicles}
          isPlaying={isPlaying}
          speed={speed}
          onProgress={handleProgress}
        />
      </MapContainer>

      <SidePanel title="Fleet Router">
        <button
          onClick={handleOptimize}
          disabled={isOptimized}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-medium transition-all ${
            isOptimized
              ? "bg-success/15 border border-success/30 text-success"
              : "bg-electric-blue/20 border border-electric-blue/40 text-electric-blue hover:bg-electric-blue/30"
          }`}
        >
          <Sparkles size={16} />
          {isOptimized ? "Routes optimisees" : "Optimiser les tournees"}
        </button>

        <ReplayControls
          isPlaying={isPlaying}
          speed={speed}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onReset={handleReset}
          onSpeedChange={setSpeed}
        />

        <OptimizationPanel
          vehicleCount={vehicles.length}
          isOptimized={isOptimized}
          progressBarRef={progressBarRef}
          progressTextRef={progressTextRef}
        />
      </SidePanel>
    </DemoLayout>
  );
}

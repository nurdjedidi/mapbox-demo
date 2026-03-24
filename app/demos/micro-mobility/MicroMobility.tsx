import { useState, useMemo, useEffect, useRef } from "react";
import { Eye, EyeOff, Activity } from "lucide-react";
import { MapContainer } from "~/components/map/MapContainer";
import { DemoLayout } from "~/components/layout/DemoLayout";
import { SidePanel } from "~/components/layout/SidePanel";
import { VehicleLayer, type Vehicle } from "./VehicleLayer";
import { StationLayer, type Station } from "./StationLayer";
import { AvailabilityHeatmap } from "./AvailabilityHeatmap";
import { VehicleFilters } from "./VehicleFilters";
import { StatsPanel } from "./StatsPanel";
import { CITIES } from "~/lib/mapbox/config";
import initialVehicles from "~/data/mock-mobility-vehicles.json";
import mockStations from "~/data/mock-stations.json";

type VehicleType = "bike" | "scooter" | "all";

// Simulate live vehicle movements and status changes
function useSimulation(baseVehicles: Vehicle[]) {
  const [vehicles, setVehicles] = useState(baseVehicles);
  const [revenue, setRevenue] = useState(1247);
  const [tripsToday, setTripsToday] = useState(89);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          // Random status transitions
          const rand = Math.random();
          let newStatus = v.status;
          let newBattery = v.battery;
          const newPos: [number, number] = [...v.position];

          if (v.status === "available" && rand < 0.08) {
            newStatus = "in_use";
          } else if (v.status === "in_use") {
            // Move slightly
            newPos[0] += (Math.random() - 0.5) * 0.002;
            newPos[1] += (Math.random() - 0.5) * 0.002;
            newBattery = Math.max(0, v.battery - 1);
            if (rand < 0.05) newStatus = "available";
            if (newBattery < 10) newStatus = "charging";
          } else if (v.status === "charging") {
            newBattery = Math.min(100, v.battery + 3);
            if (newBattery >= 90) newStatus = "available";
          }

          return { ...v, status: newStatus, battery: newBattery, position: newPos };
        })
      );

      // Increment revenue & trips
      setRevenue((r) => r + Math.floor(Math.random() * 8 + 2));
      setTripsToday((t) => t + (Math.random() > 0.6 ? 1 : 0));
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLive]);

  return { vehicles, revenue, tripsToday, isLive, setIsLive };
}

export function MicroMobility() {
  const [vehicleType, setVehicleType] = useState<VehicleType>("all");
  const [minBattery, setMinBattery] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);

  const { vehicles, revenue, tripsToday, isLive, setIsLive } = useSimulation(
    initialVehicles as Vehicle[]
  );
  const stations = mockStations as Station[];

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((v) => {
        if (vehicleType !== "all" && v.type !== vehicleType) return false;
        if (v.battery < minBattery) return false;
        return true;
      }),
    [vehicles, vehicleType, minBattery]
  );

  const stats = useMemo(() => ({
    total: filteredVehicles.length,
    available: filteredVehicles.filter((v) => v.status === "available").length,
    inUse: filteredVehicles.filter((v) => v.status === "in_use").length,
    charging: filteredVehicles.filter((v) => v.status === "charging").length,
  }), [filteredVehicles]);

  // Count zones with low availability for rebalancing alert
  const rebalancingNeeded = useMemo(() => {
    // Simple grid-based zone analysis
    const gridSize = 0.01;
    const zones = new Map<string, { available: number; total: number }>();
    vehicles.forEach((v) => {
      const key = `${Math.floor(v.position[0] / gridSize)},${Math.floor(v.position[1] / gridSize)}`;
      const zone = zones.get(key) ?? { available: 0, total: 0 };
      zone.total++;
      if (v.status === "available") zone.available++;
      zones.set(key, zone);
    });
    return Array.from(zones.values()).filter(
      (z) => z.total >= 2 && z.available / z.total < 0.3
    ).length;
  }, [vehicles]);

  const selected = selectedVehicle
    ? vehicles.find((v) => v.id === selectedVehicle)
    : null;

  const cityConfig = CITIES.dubai;

  return (
    <DemoLayout>
      <MapContainer
        center={cityConfig.center}
        zoom={cityConfig.zoom}
        pitch={cityConfig.pitch}
        bearing={cityConfig.bearing}
      >
        {showHeatmap && <AvailabilityHeatmap vehicles={filteredVehicles} />}
        <VehicleLayer vehicles={filteredVehicles} onVehicleClick={setSelectedVehicle} />
        <StationLayer stations={stations} />
      </MapContainer>

      <SidePanel title="Micro-Mobility">
        {/* Live simulation toggle */}
        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
            isLive
              ? "bg-success/15 border border-success/30 text-success"
              : "bg-electric-blue/20 border border-electric-blue/40 text-electric-blue"
          }`}
        >
          <Activity size={16} className={isLive ? "animate-pulse" : ""} />
          {isLive ? "Simulation LIVE" : "Demarrer simulation"}
        </button>

        <VehicleFilters
          vehicleType={vehicleType}
          onVehicleTypeChange={setVehicleType}
          minBattery={minBattery}
          onMinBatteryChange={setMinBattery}
        />

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
            showHeatmap
              ? "bg-success/15 border border-success/30 text-success"
              : "glass-button text-white/50"
          }`}
        >
          {showHeatmap ? <Eye size={16} /> : <EyeOff size={16} />}
          Heatmap disponibilite
        </button>

        <StatsPanel
          totalVehicles={stats.total}
          available={stats.available}
          inUse={stats.inUse}
          charging={stats.charging}
          revenue={revenue}
          tripsToday={tripsToday}
          rebalancingNeeded={rebalancingNeeded}
        />

        {/* Selected vehicle detail */}
        {selected && (
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {selected.type === "bike" ? "Velo" : "Trottinette"} #{selected.id}
              </h3>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="text-xs text-white/40 hover:text-white/70"
              >
                Fermer
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-white/40 block text-xs">Status</span>
                <span className={
                  selected.status === "available" ? "text-success" :
                  selected.status === "in_use" ? "text-danger" : "text-warning"
                }>
                  {selected.status === "available" ? "Disponible" :
                   selected.status === "in_use" ? "En course" : "En charge"}
                </span>
              </div>
              <div>
                <span className="text-white/40 block text-xs">Batterie</span>
                <span className="font-mono">{selected.battery}%</span>
              </div>
            </div>
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${selected.battery}%`,
                  backgroundColor: selected.battery > 50 ? "#00FF88" : selected.battery > 20 ? "#FFB800" : "#FF3366",
                }}
              />
            </div>
          </div>
        )}
      </SidePanel>
    </DemoLayout>
  );
}

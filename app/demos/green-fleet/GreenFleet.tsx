import { useState } from "react";
import { Leaf, Play, Square, Zap, AlertTriangle } from "lucide-react";
import { MapContainer } from "~/components/map/MapContainer";
import { DemoLayout } from "~/components/layout/DemoLayout";
import { SidePanel } from "~/components/layout/SidePanel";
import { VehicleLayer, type FleetVehicle } from "./VehicleLayer";
import { ChargingStations, type ChargingStation } from "./ChargingStations";
import { LEZones, type LEZone } from "./LEZones";
import { CarbonStats } from "./CarbonStats";
import { CITIES } from "~/lib/mapbox/config";
import fleetData from "~/data/mock-fleet-eco.json";

export function GreenFleet() {
  const [routeMode, setRouteMode] = useState<"fast" | "eco">("eco");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showLEZ, setShowLEZ] = useState(true);
  const [showCharging, setShowCharging] = useState(true);

  const vehicles = fleetData.vehicles as FleetVehicle[];
  const stations = fleetData.chargingStations as ChargingStation[];
  const lezZones = fleetData.lezZones as LEZone[];
  const stats = fleetData.stats;

  const lowBatteryVehicles = vehicles.filter(
    (v) => v.type === "electric" && (v.battery_percent ?? 100) < 40
  );

  const cityConfig = CITIES.casablanca;

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
          onProgress={() => {}}
        />
        {showCharging && (
          <ChargingStations
            stations={stations}
            lowBatteryPositions={lowBatteryVehicles.map((v) => v.waypoints[0])}
          />
        )}
        {showLEZ && <LEZones zones={lezZones} />}
      </MapContainer>

      <SidePanel title="Green Fleet — Casablanca">
        {/* Route mode */}
        <div className="glass-panel p-3">
          <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Mode de routage</span>
          <div className="grid grid-cols-2 gap-2">
            {(["fast", "eco"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setRouteMode(mode)}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  routeMode === mode
                    ? mode === "eco"
                      ? "bg-eco-green/15 border border-eco-green/40 text-eco-green"
                      : "bg-danger/15 border border-danger/40 text-danger"
                    : "glass-button text-white/50"
                }`}
              >
                {mode === "eco" ? "🌿 Éco" : "⚡ Rapide"}
              </button>
            ))}
          </div>
        </div>

        {/* Playback controls */}
        <div className="glass-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={13} className="text-eco-green" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Simulation</span>
          </div>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isPlaying
                  ? "bg-danger/15 border border-danger/30 text-danger"
                  : "bg-eco-green/15 border border-eco-green/30 text-eco-green"
              }`}
            >
              {isPlaying ? <Square size={12} /> : <Play size={12} />}
              {isPlaying ? "Stop" : "Lancer"}
            </button>
          </div>
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>Vitesse</span>
              <span className="font-mono text-white/60">{speed}×</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full accent-eco-green"
            />
          </div>
        </div>

        {/* Layer toggles */}
        <div className="glass-panel p-3">
          <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Couches</span>
          <div className="space-y-2">
            <LayerToggle
              label="Bornes de recharge"
              icon={<Zap size={11} className="text-eco-green" />}
              active={showCharging}
              onToggle={() => setShowCharging(!showCharging)}
            />
            <LayerToggle
              label="Zones ZFE"
              icon={<AlertTriangle size={11} className="text-danger" />}
              active={showLEZ}
              onToggle={() => setShowLEZ(!showLEZ)}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="glass-panel p-3">
          <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Légende</span>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-eco-green/60 border border-eco-green shrink-0" />
              <span className="text-white/70">Électrique — trail vert</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#6B7280]/60 border border-[#6B7280] shrink-0" />
              <span className="text-white/70">Diesel — trail gris</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-danger/30 border border-danger/60 shrink-0" />
              <span className="text-white/70">Zone ZFE (diesel restreint)</span>
            </div>
          </div>
        </div>

        {/* Carbon stats */}
        <CarbonStats stats={stats} routeMode={routeMode} />
      </SidePanel>
    </DemoLayout>
  );
}

function LayerToggle({
  label,
  icon,
  active,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
        active ? "bg-white/8 text-white/80" : "text-white/30 hover:text-white/50"
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      <div className={`w-7 h-4 rounded-full transition-all relative ${active ? "bg-eco-green/40" : "bg-white/10"}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${active ? "bg-eco-green left-3.5" : "bg-white/30 left-0.5"}`} />
      </div>
    </button>
  );
}

import { useState, useMemo } from "react";
import { Tractor, Eye, EyeOff, Play, Square } from "lucide-react";
import { MapContainer } from "~/components/map/MapContainer";
import { DemoLayout } from "~/components/layout/DemoLayout";
import { SidePanel } from "~/components/layout/SidePanel";
import { FarmParcelsLayer, type Parcel } from "./FarmParcelsLayer";
import { HeatmapLayer } from "./HeatmapLayer";
import { WeatherStations, type WeatherStation } from "./WeatherStations";
import { TractorRoute } from "./TractorRoute";
import { AgriStatsPanel } from "./AgriStatsPanel";
import { HideBoundariesLayer } from "~/components/map/HideBoundariesLayer";
import { CITIES } from "~/lib/mapbox/config";
import farmsData from "~/data/mock-farms.json";

type HeatmapType = "hydric" | "treatment" | "yield";

const HEATMAP_OPTIONS: { value: HeatmapType; label: string; color: string }[] = [
  { value: "hydric", label: "Stress hydrique", color: "text-danger" },
  { value: "treatment", label: "Traitements", color: "text-warning" },
  { value: "yield", label: "Rendement", color: "text-eco-green" },
];

export function AgriTech() {
  const [selectedHeatmap, setSelectedHeatmap] = useState<HeatmapType>("hydric");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTractorRoute, setShowTractorRoute] = useState(false);
  const [tractorPlaying, setTractorPlaying] = useState(false);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const parcels = farmsData.parcels as Parcel[];
  const stations = farmsData.weatherStations as WeatherStation[];
  const alerts = farmsData.alerts as Array<{ id: number; type: string; parcel: string; message: string; severity: "warning" | "critical"; timestamp: string }>;
  const waypoints = farmsData.tractorWaypoints as [number, number][];

  const selectedParcel = useMemo(
    () => selectedParcelId ? parcels.find((p) => p.id === selectedParcelId) ?? null : null,
    [parcels, selectedParcelId]
  );

  const cityConfig = CITIES.agadir;

  return (
    <DemoLayout>
      <MapContainer
        center={cityConfig.center}
        zoom={cityConfig.zoom}
        pitch={cityConfig.pitch}
        bearing={cityConfig.bearing}
        style="mapbox://styles/mapbox/satellite-streets-v12"
      >
        <HideBoundariesLayer />
        <FarmParcelsLayer
          parcels={parcels}
          selectedId={selectedParcelId}
          cropStage="growth"
          onSelect={setSelectedParcelId}
        />
        {showHeatmap && <HeatmapLayer parcels={parcels} type={selectedHeatmap} />}
        <WeatherStations stations={stations} />
        {showTractorRoute && (
          <TractorRoute
            waypoints={waypoints}
            isPlaying={tractorPlaying}
            onStop={() => setTractorPlaying(false)}
          />
        )}
      </MapContainer>

      <SidePanel title="AgriTech — Souss-Massa">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/40 uppercase tracking-wider">Couche analyse</label>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all ${showHeatmap ? "text-eco-green" : "text-white/40"}`}
            >
              {showHeatmap ? <Eye size={11} /> : <EyeOff size={11} />}
              {showHeatmap ? "ON" : "OFF"}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {HEATMAP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedHeatmap(opt.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                  selectedHeatmap === opt.value
                    ? "bg-white/10 border border-white/20 text-white"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  opt.value === "hydric" ? "bg-danger" : opt.value === "treatment" ? "bg-warning" : "bg-eco-green"
                }`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Tractor size={13} className="text-eco-green" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Route tracteur</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTractorRoute(!showTractorRoute)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                showTractorRoute
                  ? "bg-eco-green/15 border border-eco-green/30 text-eco-green"
                  : "glass-button text-white/50"
              }`}
            >
              {showTractorRoute ? "Masquer route" : "Afficher route"}
            </button>
            {showTractorRoute && (
              <button
                onClick={() => setTractorPlaying(!tractorPlaying)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  tractorPlaying
                    ? "bg-danger/15 border border-danger/30 text-danger"
                    : "bg-eco-green/15 border border-eco-green/30 text-eco-green"
                }`}
              >
                {tractorPlaying ? <Square size={12} /> : <Play size={12} />}
                {tractorPlaying ? "Stop" : "Lancer"}
              </button>
            )}
          </div>
        </div>

        <div className="glass-panel p-3">
          <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Légende parcelles</span>
          <div className="space-y-1.5">
            {[
              { color: "bg-eco-green", label: "Saine", desc: "Rendement normal" },
              { color: "bg-agri-amber", label: "Stress", desc: "Déficit hydrique ou phytosanitaire" },
              { color: "bg-danger", label: "Critique", desc: "Intervention urgente requise" },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded-sm shrink-0 ${color}`} />
                <span className="text-white/70 font-medium">{label}</span>
                <span className="text-white/30">{desc}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/25 mt-2">Hauteur 3D = rendement prévu (t/ha)</p>
        </div>

        <AgriStatsPanel
          parcels={parcels}
          alerts={alerts}
          stats={farmsData.stats}
          selectedParcel={selectedParcel}
          onClearSelection={() => setSelectedParcelId(null)}
        />
      </SidePanel>
    </DemoLayout>
  );
}

import { useState } from "react";
import { Wind, Droplets, Volume2 } from "lucide-react";
import { MapContainer } from "~/components/map/MapContainer";
import { DemoLayout } from "~/components/layout/DemoLayout";
import { SidePanel } from "~/components/layout/SidePanel";
import { SensorsLayer, SensorDetail, type Sensor } from "./SensorsLayer";
import { PollutionHeatmap } from "./PollutionHeatmap";
import { RiskZones, type RiskZone } from "./RiskZones";
import { ClimateStatsPanel } from "./ClimateStatsPanel";
import { CITIES } from "~/lib/mapbox/config";
import sensorsData from "~/data/mock-sensors.json";

type PollutionType = "air" | "water" | "noise";

const TYPE_OPTIONS: { value: PollutionType; label: string; icon: React.ReactNode }[] = [
  { value: "air", label: "Qualité air", icon: <Wind size={11} /> },
  { value: "water", label: "Qualité eau", icon: <Droplets size={11} /> },
  { value: "noise", label: "Bruit", icon: <Volume2 size={11} /> },
];

export function ClimateMonitor() {
  const [pollutionType, setPollutionType] = useState<PollutionType>("air");
  const [year, setYear] = useState(2026);
  const [scenario, setScenario] = useState<"before" | "after">("after");
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);

  const sensors = sensorsData.sensors as Sensor[];
  const riskZones = sensorsData.riskZones as RiskZone[];
  const alerts = sensorsData.alerts;
  const yearlyData = sensorsData.yearlyData as Record<string, { avg_pm25: number; avg_nitrates: number; avg_noise: number; compliant_percent: number }>;
  const stats = sensorsData.stats;

  const cityConfig = CITIES.casablanca;

  return (
    <DemoLayout>
      <MapContainer
        center={cityConfig.center}
        zoom={cityConfig.zoom}
        pitch={cityConfig.pitch}
        bearing={cityConfig.bearing}
      >
        <PollutionHeatmap sensors={sensors} type={pollutionType} year={year} />
        <SensorsLayer
          sensors={sensors}
          activeType={pollutionType}
          onSelect={setSelectedSensor}
        />
        {showRiskZones && <RiskZones zones={riskZones} />}
      </MapContainer>

      <SidePanel title="Climate Monitor — Casablanca">
        {/* Pollution type selector */}
        <div>
          <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Type de pollution</label>
          <div className="flex flex-col gap-1">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setPollutionType(opt.value); setSelectedSensor(null); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                  pollutionType === opt.value
                    ? "bg-white/10 border border-white/20 text-white"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <span className={`${
                  opt.value === "air" ? "text-climate-blue" : opt.value === "water" ? "text-climate-blue" : "text-agri-amber"
                }`}>
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layer toggle */}
        <div className="glass-panel p-3">
          <button
            onClick={() => setShowRiskZones(!showRiskZones)}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all ${
              showRiskZones ? "text-white/80" : "text-white/30"
            }`}
          >
            <span>Zones à risque (inondation / sécheresse)</span>
            <div className={`w-7 h-4 rounded-full relative ${showRiskZones ? "bg-climate-blue/40" : "bg-white/10"}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${showRiskZones ? "bg-climate-blue left-3.5" : "bg-white/30 left-0.5"}`} />
            </div>
          </button>
        </div>

        {/* Selected sensor detail */}
        {selectedSensor && (
          <SensorDetail sensor={selectedSensor} onClose={() => setSelectedSensor(null)} />
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <Wind size={13} className="text-danger" />
              <span className="text-xs text-white/40 uppercase tracking-wider">Alertes actives</span>
              <span className="ml-auto text-xs bg-danger/20 text-danger border border-danger/30 rounded px-1.5 py-0.5 font-mono">
                {alerts.length}
              </span>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`p-2 rounded-lg border text-xs ${
                    a.severity === "critical"
                      ? "border-danger/30 bg-danger/8"
                      : "border-warning/30 bg-warning/8"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.severity === "critical" ? "bg-danger" : "bg-warning"}`} />
                    <span className={`font-semibold ${a.severity === "critical" ? "text-danger" : "text-warning"}`}>
                      Capteur #{a.sensor_id}
                    </span>
                  </div>
                  <p className="text-white/60 leading-relaxed">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats panel */}
        <ClimateStatsPanel
          stats={stats}
          year={year}
          yearlyData={yearlyData}
          scenario={scenario}
          onYearChange={setYear}
          onScenarioChange={setScenario}
          riskZones={riskZones}
        />
      </SidePanel>
    </DemoLayout>
  );
}

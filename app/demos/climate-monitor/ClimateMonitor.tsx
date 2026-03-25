import { useState, useMemo } from "react";
import { Wind, Droplets, Volume2, AlertTriangle, MapPin } from "lucide-react";
import { MapContainer } from "~/components/map/MapContainer";
import { DemoLayout } from "~/components/layout/DemoLayout";
import { SidePanel } from "~/components/layout/SidePanel";
import { SensorsLayer, SensorDetail, type Sensor } from "./SensorsLayer";
import { PollutionHeatmap } from "./PollutionHeatmap";
import { RiskZones, type RiskZone } from "./RiskZones";
import { ClimateStatsPanel } from "./ClimateStatsPanel";
import { HideBoundariesLayer } from "~/components/map/HideBoundariesLayer";
import { CITIES } from "~/lib/mapbox/config";
import sensorsData from "~/data/mock-sensors.json";

type PollutionType = "air" | "water" | "noise";

const TYPE_OPTIONS: { value: PollutionType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { value: "air", label: "Air", desc: "PM2.5, NO₂, Ozone", icon: <Wind size={13} />, color: "text-climate-blue" },
  { value: "water", label: "Eau", desc: "Nitrates, pH, Turbidité", icon: <Droplets size={13} />, color: "text-climate-blue" },
  { value: "noise", label: "Bruit", desc: "Décibels en zone urbaine", icon: <Volume2 size={13} />, color: "text-agri-amber" },
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

  // Quick summary for current filter
  const filteredSensors = useMemo(() => sensors.filter((s) => s.type === pollutionType), [sensors, pollutionType]);
  const okCount = filteredSensors.filter((s) => s.status === "good").length;
  const warnCount = filteredSensors.filter((s) => s.status === "warning").length;
  const critCount = filteredSensors.filter((s) => s.status === "critical").length;

  return (
    <DemoLayout>
      <MapContainer
        center={cityConfig.center}
        zoom={cityConfig.zoom}
        pitch={cityConfig.pitch}
        bearing={cityConfig.bearing}
      >
        <HideBoundariesLayer />
        <PollutionHeatmap sensors={sensors} type={pollutionType} year={year} />
        <SensorsLayer
          sensors={sensors}
          activeType={pollutionType}
          onSelect={setSelectedSensor}
        />
        {showRiskZones && <RiskZones zones={riskZones} />}
      </MapContainer>

      <SidePanel title="Environnement — Casablanca">
        {/* Intro text */}
        <p className="text-xs text-white/40 leading-relaxed -mt-1">
          Surveillance en temps réel de la qualité de l'air, de l'eau et du bruit.
          Cliquez sur un capteur sur la carte pour voir ses données.
        </p>

        {/* Pollution type selector */}
        <div>
          <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
            Que voulez-vous surveiller ?
          </label>
          <div className="flex flex-col gap-1.5">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setPollutionType(opt.value); setSelectedSensor(null); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  pollutionType === opt.value
                    ? "bg-white/10 border border-white/20"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className={opt.color}>{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-semibold block ${pollutionType === opt.value ? "text-white" : "text-white/60"}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-white/30">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick status summary */}
        <div className="glass-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={12} className="text-white/40" />
            <span className="text-xs text-white/40">
              {filteredSensors.length} capteurs {pollutionType === "air" ? "air" : pollutionType === "water" ? "eau" : "bruit"}
            </span>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-eco-green" />
              <span className="text-white/60">{okCount} OK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-white/60">{warnCount} alerte{warnCount > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-danger" />
              <span className="text-white/60">{critCount} critique{critCount > 1 ? "s" : ""}</span>
            </div>
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
            <span>Zones inondation & sécheresse</span>
            <div className={`w-7 h-4 rounded-full relative ${showRiskZones ? "bg-climate-blue/40" : "bg-white/10"}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${showRiskZones ? "bg-climate-blue left-3.5" : "bg-white/30 left-0.5"}`} />
            </div>
          </button>
        </div>

        {/* Selected sensor detail */}
        {selectedSensor && (
          <SensorDetail sensor={selectedSensor} onClose={() => setSelectedSensor(null)} />
        )}

        {/* Alerts — simplified */}
        {alerts.length > 0 && (
          <div className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={13} className="text-danger" />
              <span className="text-xs text-white/50 font-medium">
                {alerts.length} problème{alerts.length > 1 ? "s" : ""} détecté{alerts.length > 1 ? "s" : ""}
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
                      {a.severity === "critical" ? "Critique" : "Attention"}
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

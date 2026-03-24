import { Wind, Droplets, Volume2, TrendingDown, Users, Download } from "lucide-react";
import { AnimatedNumber } from "~/components/shared/AnimatedNumber";

interface YearData {
  avg_pm25: number;
  avg_nitrates: number;
  avg_noise: number;
  compliant_percent: number;
}

interface Stats {
  sensors_compliant_percent: number;
  zones_exceeding: number;
  population_exposed_pollution: number;
  avg_pm25_reduction_yearly: number;
  water_quality_index: number;
  before_factory_pm25: number;
  after_factory_pm25: number;
}

interface ClimateStatsPanelProps {
  stats: Stats;
  year: number;
  yearlyData: Record<string, YearData>;
  scenario: "before" | "after";
  onYearChange: (y: number) => void;
  onScenarioChange: (s: "before" | "after") => void;
  riskZones: Array<{ name: string; type: string; population_exposed: number; measures: string }>;
}

function exportCSV(stats: Stats, yearlyData: Record<string, YearData>) {
  const header = "Année,PM2.5 moy.,Nitrates moy.,Bruit moy.,Conformité %\n";
  const rows = Object.entries(yearlyData)
    .map(([y, d]) => `${y},${d.avg_pm25},${d.avg_nitrates},${d.avg_noise},${d.compliant_percent}`)
    .join("\n");
  const csv = header + rows + `\n\nPopulation exposée,${stats.population_exposed_pollution}\nZones en dépassement,${stats.zones_exceeding}`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rapport-esg-casablanca.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ClimateStatsPanel({
  stats,
  year,
  yearlyData,
  scenario,
  onYearChange,
  onScenarioChange,
  riskZones,
}: ClimateStatsPanelProps) {
  const currentYear = yearlyData[String(year)];
  const pm25Active = scenario === "before" ? stats.before_factory_pm25 : (currentYear?.avg_pm25 ?? stats.after_factory_pm25);

  return (
    <div className="flex flex-col gap-3">
      {/* Main KPIs */}
      <div className="glass-panel p-4 border-climate-blue/20">
        <div className="flex items-center gap-2 mb-3">
          <Wind size={14} className="text-climate-blue" />
          <span className="text-xs text-white/40 uppercase tracking-wider">Surveillance Environnementale</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <AnimatedNumber value={stats.sensors_compliant_percent} decimals={0} suffix="%" className="text-2xl font-bold text-eco-green font-mono" />
            <span className="text-xs text-white/40 block">Capteurs conformes</span>
          </div>
          <div>
            <AnimatedNumber value={stats.population_exposed_pollution} decimals={0} className="text-2xl font-bold font-mono" />
            <span className="text-xs text-white/40 block">Personnes exposées</span>
          </div>
        </div>
      </div>

      {/* Timeline slider */}
      <div className="glass-panel p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40 uppercase tracking-wider">Évolution temporelle</span>
          <span className="text-xs font-mono font-bold text-white/80">{year}</span>
        </div>
        <input
          type="range"
          min={2020}
          max={2026}
          step={1}
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="w-full accent-climate-blue"
        />
        <div className="flex justify-between text-[9px] text-white/30 mt-0.5">
          <span>2020</span>
          <span>2026</span>
        </div>
        {currentYear && (
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="text-center">
              <span className="font-mono font-bold text-climate-blue">{currentYear.avg_pm25}</span>
              <span className="text-white/30 block text-[9px]">PM2.5</span>
            </div>
            <div className="text-center">
              <span className="font-mono font-bold text-eco-green">{currentYear.compliant_percent}%</span>
              <span className="text-white/30 block text-[9px]">Conformité</span>
            </div>
          </div>
        )}
      </div>

      {/* Before/After scenario */}
      <div className="glass-panel p-3">
        <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Scénario — Fermeture usine</span>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => onScenarioChange("before")}
            className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
              scenario === "before"
                ? "bg-danger/15 border border-danger/40 text-danger"
                : "glass-button text-white/40"
            }`}
          >
            Avant
          </button>
          <button
            onClick={() => onScenarioChange("after")}
            className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
              scenario === "after"
                ? "bg-eco-green/15 border border-eco-green/40 text-eco-green"
                : "glass-button text-white/40"
            }`}
          >
            Après
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <TrendingDown size={11} className="text-eco-green" />
          <span>PM2.5 :</span>
          <span className="font-mono font-bold">{pm25Active} µg/m³</span>
          {scenario === "after" && (
            <span className="text-eco-green text-[10px]">
              (−{stats.before_factory_pm25 - stats.after_factory_pm25} µg/m³)
            </span>
          )}
        </div>
      </div>

      {/* Water + noise KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Droplets size={12} className="text-climate-blue" />
            <span className="text-xs text-white/40">Qualité eau</span>
          </div>
          <AnimatedNumber value={stats.water_quality_index} decimals={0} suffix="/100" className="text-lg font-bold text-climate-blue font-mono" />
        </div>
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Volume2 size={12} className="text-agri-amber" />
            <span className="text-xs text-white/40">{'Zones >seuil'}</span>
          </div>
          <AnimatedNumber value={stats.zones_exceeding} decimals={0} className="text-lg font-bold text-agri-amber font-mono" />
        </div>
      </div>

      {/* Risk zones */}
      {riskZones.length > 0 && (
        <div className="glass-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users size={13} className="text-agri-amber" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Zones à risque</span>
          </div>
          <div className="space-y-2">
            {riskZones.map((z, i) => (
              <div key={i} className={`p-2 rounded-lg border text-xs ${z.type === "flood" ? "border-climate-blue/30 bg-climate-blue/8" : "border-agri-amber/30 bg-agri-amber/8"}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${z.type === "flood" ? "bg-climate-blue" : "bg-agri-amber"}`} />
                  <span className="font-semibold text-white/80">{z.name}</span>
                </div>
                <p className="text-white/40 text-[10px]">{z.population_exposed.toLocaleString()} hab. exposés</p>
                <p className="text-white/30 text-[10px] mt-0.5 leading-relaxed">{z.measures}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export button */}
      <button
        onClick={() => exportCSV(stats, yearlyData)}
        className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium glass-button text-white/60 hover:text-white hover:bg-white/10 transition-all"
      >
        <Download size={12} />
        Export rapport ESG (.csv)
      </button>
    </div>
  );
}

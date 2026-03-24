import { Wind, Droplets, Volume2, TrendingDown, Users, Download, Factory } from "lucide-react";
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
  const pm25Saved = stats.before_factory_pm25 - stats.after_factory_pm25;

  return (
    <div className="flex flex-col gap-3">
      {/* Global health score */}
      <div className="glass-panel p-4 border-climate-blue/20">
        <div className="flex items-center gap-2 mb-3">
          <Wind size={14} className="text-climate-blue" />
          <span className="text-xs text-white/50 font-medium">Bilan environnemental</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <AnimatedNumber
              value={stats.sensors_compliant_percent}
              decimals={0}
              suffix="%"
              className="text-3xl font-bold text-eco-green font-mono"
            />
            <span className="text-xs text-white/40 block mt-0.5">des capteurs dans les normes</span>
          </div>
          <div>
            <AnimatedNumber
              value={stats.population_exposed_pollution}
              decimals={0}
              className="text-3xl font-bold font-mono"
            />
            <span className="text-xs text-white/40 block mt-0.5">habitants exposés</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-panel p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/50 font-medium">Évolution depuis 2020</span>
          <span className="text-xs font-mono font-bold text-white">{year}</span>
        </div>
        <p className="text-[10px] text-white/30 mb-2">
          Faites glisser pour voir comment la pollution a changé au fil des ans.
        </p>
        <input
          type="range"
          min={2020}
          max={2026}
          step={1}
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="w-full accent-climate-blue"
        />
        <div className="flex justify-between text-[9px] text-white/30 mt-0.5 mb-2">
          <span>2020 (pire)</span>
          <span>2026 (actuel)</span>
        </div>
        {currentYear && (
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="bg-white/5 rounded-lg py-1.5">
              <span className="font-mono font-bold text-climate-blue block">{currentYear.avg_pm25}</span>
              <span className="text-[9px] text-white/30">Air (PM2.5)</span>
            </div>
            <div className="bg-white/5 rounded-lg py-1.5">
              <span className="font-mono font-bold text-climate-blue block">{currentYear.avg_nitrates}</span>
              <span className="text-[9px] text-white/30">Eau (NO₃)</span>
            </div>
            <div className="bg-white/5 rounded-lg py-1.5">
              <span className="font-mono font-bold text-eco-green block">{currentYear.compliant_percent}%</span>
              <span className="text-[9px] text-white/30">Conformes</span>
            </div>
          </div>
        )}
      </div>

      {/* Before/After factory */}
      <div className="glass-panel p-3">
        <div className="flex items-center gap-2 mb-1">
          <Factory size={13} className="text-agri-amber" />
          <span className="text-xs text-white/50 font-medium">Impact fermeture usine</span>
        </div>
        <p className="text-[10px] text-white/30 mb-2">
          Comparez la pollution avant et après la fermeture de l'usine industrielle.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => onScenarioChange("before")}
            className={`py-2 rounded-lg text-xs font-medium transition-all ${
              scenario === "before"
                ? "bg-danger/15 border border-danger/40 text-danger"
                : "glass-button text-white/40"
            }`}
          >
            Usine ouverte
          </button>
          <button
            onClick={() => onScenarioChange("after")}
            className={`py-2 rounded-lg text-xs font-medium transition-all ${
              scenario === "after"
                ? "bg-eco-green/15 border border-eco-green/40 text-eco-green"
                : "glass-button text-white/40"
            }`}
          >
            Usine fermée
          </button>
        </div>
        <div className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
          <span className="text-white/50">Pollution air :</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{pm25Active} µg/m³</span>
            {scenario === "after" && (
              <span className="flex items-center gap-0.5 text-eco-green text-[10px] font-semibold">
                <TrendingDown size={10} />
                −{pm25Saved}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Water + zones */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Droplets size={12} className="text-climate-blue" />
            <span className="text-xs text-white/40">Eau potable</span>
          </div>
          <AnimatedNumber value={stats.water_quality_index} decimals={0} suffix="/100" className="text-xl font-bold text-climate-blue font-mono" />
          <span className="text-[9px] text-white/25 block mt-0.5">indice qualité</span>
        </div>
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Volume2 size={12} className="text-agri-amber" />
            <span className="text-xs text-white/40">Zones en alerte</span>
          </div>
          <AnimatedNumber value={stats.zones_exceeding} decimals={0} className="text-xl font-bold text-agri-amber font-mono" />
          <span className="text-[9px] text-white/25 block mt-0.5">dépassent les seuils</span>
        </div>
      </div>

      {/* Risk zones */}
      {riskZones.length > 0 && (
        <div className="glass-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users size={13} className="text-agri-amber" />
            <span className="text-xs text-white/50 font-medium">Zones à risque climatique</span>
          </div>
          <div className="space-y-2">
            {riskZones.map((z, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-lg border text-xs ${
                  z.type === "flood"
                    ? "border-climate-blue/30 bg-climate-blue/8"
                    : "border-agri-amber/30 bg-agri-amber/8"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{z.type === "flood" ? "🌊" : "🏜️"}</span>
                  <div>
                    <span className="font-semibold text-white/80 block leading-tight">{z.name}</span>
                    <span className={`text-[10px] ${z.type === "flood" ? "text-climate-blue" : "text-agri-amber"}`}>
                      {z.type === "flood" ? "Risque inondation" : "Risque sécheresse"}
                    </span>
                  </div>
                </div>
                <p className="text-white/45 text-[10px]">
                  {z.population_exposed.toLocaleString()} habitants exposés
                </p>
                <p className="text-white/30 text-[10px] mt-0.5 leading-relaxed">{z.measures}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <button
        onClick={() => exportCSV(stats, yearlyData)}
        className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium glass-button text-white/60 hover:text-white hover:bg-white/10 transition-all"
      >
        <Download size={12} />
        Télécharger rapport ESG (.csv)
      </button>
    </div>
  );
}

import { Leaf, Fuel, TrendingDown, Zap } from "lucide-react";
import { AnimatedNumber } from "~/components/shared/AnimatedNumber";

interface Stats {
  route_distance_km: number;
  co2_fast_kg: number;
  co2_eco_kg: number;
  co2_saved_kg: number;
  fuel_liters_total: number;
  carbon_cost_eur: number;
  fleet_electric_percent: number;
  lez_alerts: number;
}

interface CarbonStatsProps {
  stats: Stats;
  routeMode: "fast" | "eco";
}

export function CarbonStats({ stats, routeMode }: CarbonStatsProps) {
  const activeCo2 = routeMode === "fast" ? stats.co2_fast_kg : stats.co2_eco_kg;
  const maxBar = stats.co2_fast_kg;

  return (
    <div className="flex flex-col gap-3">
      {/* Main CO2 KPI */}
      <div className="glass-panel p-4 border-eco-green/20">
        <div className="flex items-center gap-2 mb-3">
          <Leaf size={14} className="text-eco-green" />
          <span className="text-xs text-white/40 uppercase tracking-wider">Bilan Carbone Flotte</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <AnimatedNumber value={activeCo2} decimals={1} suffix=" kg" className="text-2xl font-bold font-mono" />
            <span className="text-xs text-white/40 block">CO₂ émis</span>
          </div>
          <div>
            <AnimatedNumber
              value={stats.co2_saved_kg}
              decimals={1}
              suffix=" kg"
              className="text-2xl font-bold text-eco-green font-mono"
            />
            <span className="text-xs text-white/40 block">CO₂ économisé</span>
          </div>
        </div>

        {/* Mode comparison bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={`font-medium ${routeMode === "fast" ? "text-white" : "text-white/40"}`}>Mode Rapide</span>
              <span className={`font-mono ${routeMode === "fast" ? "text-danger" : "text-white/30"}`}>{stats.co2_fast_kg} kg</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-danger/70 rounded-full transition-all duration-500"
                style={{ width: `${(stats.co2_fast_kg / maxBar) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={`font-medium ${routeMode === "eco" ? "text-white" : "text-white/40"}`}>Mode Éco</span>
              <span className={`font-mono ${routeMode === "eco" ? "text-eco-green" : "text-white/30"}`}>{stats.co2_eco_kg} kg</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-eco-green/70 rounded-full transition-all duration-500"
                style={{ width: `${(stats.co2_eco_kg / maxBar) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <TrendingDown size={11} className="text-eco-green" />
          <span className="text-eco-green font-semibold">
            −{Math.round((1 - stats.co2_eco_kg / stats.co2_fast_kg) * 100)}% en mode éco
          </span>
        </div>
      </div>

      {/* Fleet composition */}
      <div className="glass-panel p-3">
        <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Composition Flotte</span>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-eco-green/80 rounded-l-full transition-all duration-500"
              style={{ width: `${stats.fleet_electric_percent}%` }}
            />
            <div
              className="h-full bg-[#6B7280]/80 rounded-r-full"
              style={{ width: `${100 - stats.fleet_electric_percent}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-eco-green font-medium flex items-center gap-1">
            <Zap size={10} />
            {stats.fleet_electric_percent}% Électrique
          </span>
          <span className="text-[#9CA3AF]">{100 - stats.fleet_electric_percent}% Diesel</span>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Fuel size={12} className="text-agri-amber" />
            <span className="text-xs text-white/40">Carburant</span>
          </div>
          <AnimatedNumber value={stats.fuel_liters_total} decimals={1} suffix=" L" className="text-lg font-bold text-agri-amber font-mono" />
        </div>
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-white/40">Coût carbone</span>
          </div>
          <AnimatedNumber value={stats.carbon_cost_eur} decimals={1} suffix=" €" className="text-lg font-bold font-mono" />
        </div>
      </div>

      {/* ZFE alerts */}
      {stats.lez_alerts > 0 && (
        <div className="glass-panel p-3 border-danger/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40 uppercase tracking-wider">Alertes ZFE</span>
            <span className="text-xs bg-danger/20 text-danger border border-danger/30 rounded px-1.5 py-0.5 font-mono">
              {stats.lez_alerts}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1.5">
            {stats.lez_alerts} véhicule{stats.lez_alerts > 1 ? "s" : ""} diesel en zone ZFE
          </p>
        </div>
      )}
    </div>
  );
}

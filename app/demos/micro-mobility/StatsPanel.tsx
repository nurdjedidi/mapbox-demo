import { StatCard } from "~/components/shared/StatCard";
import { AnimatedNumber } from "~/components/shared/AnimatedNumber";
import { DollarSign, TrendingUp, AlertTriangle, RotateCcw } from "lucide-react";

interface StatsPanelProps {
  totalVehicles: number;
  available: number;
  inUse: number;
  charging: number;
  revenue: number;
  tripsToday: number;
  rebalancingNeeded: number;
}

export function StatsPanel({
  totalVehicles,
  available,
  inUse,
  charging,
  revenue,
  tripsToday,
  rebalancingNeeded,
}: StatsPanelProps) {
  const availabilityRate = totalVehicles > 0
    ? Math.round((available / totalVehicles) * 100)
    : 0;
  const rotationRate = totalVehicles > 0
    ? (tripsToday / totalVehicles).toFixed(1)
    : "0";
  const rebalancingCost = rebalancingNeeded * 12; // ~12 AED per rebalance
  const potentialRevenue = rebalancingNeeded * 35; // ~35 AED average ride

  return (
    <div className="flex flex-col gap-3">
      {/* Revenue hero KPI */}
      <div className="glass-panel p-4 border-electric-blue/20">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign size={14} className="text-success" />
          <span className="text-xs text-white/40 uppercase tracking-wider">Revenu journalier</span>
        </div>
        <div className="flex items-end gap-3">
          <AnimatedNumber value={revenue} className="text-3xl font-bold text-success" suffix=" AED" />
          <span className="text-xs text-success/60 mb-1 flex items-center gap-1">
            <TrendingUp size={10} />
            +12.4%
          </span>
        </div>
      </div>

      {/* Operational KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Disponibles" value={available} trend="up" />
        <StatCard label="En course" value={inUse} trend="neutral" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="En charge" value={charging} />
        <StatCard label="Dispo." value={`${availabilityRate}%`} trend={availabilityRate > 60 ? "up" : "down"} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <RotateCcw size={12} className="text-white/40" />
            <span className="text-xs text-white/40">Rotation/jour</span>
          </div>
          <span className="text-lg font-bold font-mono">{rotationRate}x</span>
        </div>
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={12} className="text-white/40" />
            <span className="text-xs text-white/40">Trajets</span>
          </div>
          <AnimatedNumber value={tripsToday} className="text-lg font-bold" />
        </div>
      </div>

      {/* Rebalancing ROI alert */}
      {rebalancingNeeded > 0 && (
        <div className="glass-panel p-4 border-warning/30 border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-warning" />
            <span className="text-xs text-warning uppercase tracking-wider font-semibold">
              Rebalancing requis
            </span>
          </div>
          <p className="text-xs text-white/50 mb-3">
            {rebalancingNeeded} zones sous-desservies detectees
          </p>
          <div className="flex justify-between text-xs">
            <div>
              <span className="text-white/40 block">Cout rebalancing</span>
              <span className="text-danger font-mono font-bold">{rebalancingCost} AED</span>
            </div>
            <div className="text-right">
              <span className="text-white/40 block">Revenu potentiel</span>
              <span className="text-success font-mono font-bold">+{potentialRevenue} AED</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-warning to-success rounded-full"
              style={{ width: `${Math.min((potentialRevenue / (rebalancingCost + potentialRevenue)) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-success/80 mt-1 text-right font-mono">
            ROI: +{Math.round(((potentialRevenue - rebalancingCost) / rebalancingCost) * 100)}%
          </p>
        </div>
      )}
    </div>
  );
}

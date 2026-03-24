import type { RefObject } from "react";
import { TrendingDown, Clock, Fuel } from "lucide-react";
import { StatCard } from "~/components/shared/StatCard";
import { AnimatedNumber } from "~/components/shared/AnimatedNumber";

interface OptimizationPanelProps {
  vehicleCount: number;
  isOptimized: boolean;
  progressBarRef: RefObject<HTMLDivElement | null>;
  progressTextRef: RefObject<HTMLSpanElement | null>;
}

export function OptimizationPanel({ vehicleCount, isOptimized, progressBarRef, progressTextRef }: OptimizationPanelProps) {
  const totalDistance = isOptimized ? 47.3 : 62.8;
  const fuelSaved = isOptimized ? 18 : 0;
  const estimatedTime = isOptimized ? "2h 15min" : "3h 40min";

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs text-white/40 uppercase tracking-wider">Metriques flotte</h3>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Vehicules" value={vehicleCount} />
        <StatCard label="Livraisons" value={vehicleCount * 4} />
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown size={14} className="text-electric-blue" />
          <span className="text-sm text-white/60">Distance totale</span>
        </div>
        <div className="flex items-end gap-2">
          <AnimatedNumber value={totalDistance} decimals={1} suffix=" km" className="text-2xl font-bold text-white" />
          {isOptimized && (
            <span className="text-xs text-success mb-1">-24.7%</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={12} className="text-white/40" />
            <span className="text-xs text-white/40">Temps est.</span>
          </div>
          <span className="text-sm font-bold font-mono">{estimatedTime}</span>
        </div>
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Fuel size={12} className="text-white/40" />
            <span className="text-xs text-white/40">Fuel epargne</span>
          </div>
          <span className="text-sm font-bold font-mono text-success">{fuelSaved}%</span>
        </div>
      </div>

      {/* Progress bar — updated via ref, no re-renders */}
      <div className="glass-panel p-3">
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>Progression journee</span>
          <span ref={progressTextRef} className="font-mono">0%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            ref={progressBarRef}
            className="h-full bg-electric-blue rounded-full transition-none"
            style={{ width: "0%" }}
          />
        </div>
      </div>
    </div>
  );
}

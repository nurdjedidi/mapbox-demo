import { Milk, Thermometer, Fuel, Truck, AlertTriangle, CheckCircle } from "lucide-react";
import { AnimatedNumber } from "~/components/shared/AnimatedNumber";
import { STATUS_COLORS, STATUS_LABELS } from "./CollectionPointsLayer";
import type { CollectionPoint } from "./CollectionPointsLayer";

interface DairyStats {
  total_daily_liters: number;
  cold_chain_compliance_pct: number;
  fuel_saving_pct: number;
  active_tankers: number;
  collection_points_active: number;
}

interface DairyStatsPanelProps {
  stats: DairyStats;
  points: CollectionPoint[];
  hoveredPoint: CollectionPoint | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function DairyStatsPanel({ stats, points, hoveredPoint, isPlaying, onTogglePlay }: DairyStatsPanelProps) {
  const coldOk = points.filter((p) => p.status === "cold_ok").length;
  const warning = points.filter((p) => p.status === "temp_warning").length;
  const critical = points.filter((p) => p.status === "critical_delay").length;

  return (
    <div className="flex flex-col gap-3">
      {/* KPIs */}
      <div className="glass-panel p-4 border-eco-green/30 bg-gradient-to-br from-eco-green/5 to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <Milk size={14} className="text-eco-green" />
          <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">Collecte journalière</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <AnimatedNumber value={stats.total_daily_liters} decimals={0} suffix=" L" className="text-2xl font-bold text-eco-green" />
            <span className="text-[10px] text-white/40 block">Volume collecté</span>
          </div>
          <div>
            <AnimatedNumber value={stats.cold_chain_compliance_pct} decimals={0} suffix="%" className="text-2xl font-bold text-climate-blue" />
            <span className="text-[10px] text-white/40 block">Chaîne du froid</span>
          </div>
        </div>
      </div>

      {/* Tankers control */}
      <div className="glass-panel p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Truck size={13} className="text-white/40" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Flotte active</span>
          </div>
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              isPlaying
                ? "bg-eco-green/20 text-eco-green border border-eco-green/30 hover:bg-eco-green/30"
                : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-eco-green animate-pulse" : "bg-white/30"}`} />
            {isPlaying ? "En route" : "Démarrer"}
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="font-mono font-bold text-white">{stats.active_tankers}</span> citernes
          <span className="text-white/20">·</span>
          <span>Terrain 3D actif</span>
        </div>
      </div>

      {/* ROI fuel savings */}
      <div className="glass-panel p-3">
        <div className="flex items-center gap-2 mb-2">
          <Fuel size={13} className="text-agri-amber" />
          <span className="text-xs text-white/40 uppercase tracking-wider">Optimisation 3D</span>
        </div>
        <div className="flex items-end gap-2">
          <AnimatedNumber value={stats.fuel_saving_pct} decimals={0} suffix="%" className="text-xl font-bold text-agri-amber" />
          <span className="text-xs text-white/40 mb-0.5">économie carburant</span>
        </div>
        <div className="mt-2 text-[10px] text-white/30">
          Route 3D vs route planaire standard
        </div>
      </div>

      {/* Collection points status */}
      <div className="glass-panel p-3">
        <div className="flex items-center gap-2 mb-3">
          <Thermometer size={13} className="text-white/40" />
          <span className="text-xs text-white/40 uppercase tracking-wider">Centres de collecte</span>
          <span className="ml-auto text-[10px] font-mono text-white/30">{points.length} pts</span>
        </div>
        <div className="space-y-2">
          <StatusBar label="Froid OK" count={coldOk} total={points.length} color="bg-climate-blue" />
          <StatusBar label="Alerte temp." count={warning} total={points.length} color="bg-agri-amber" />
          <StatusBar label="Retard critique" count={critical} total={points.length} color="bg-danger" />
        </div>
      </div>

      {/* Hovered point detail */}
      {hoveredPoint && (
        <div className="glass-panel p-4 border" style={{ borderColor: `${STATUS_COLORS[hoveredPoint.status]}40` }}>
          <div className="flex items-start gap-2 mb-3">
            <div
              className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0"
              style={{ backgroundColor: STATUS_COLORS[hoveredPoint.status] }}
            />
            <div>
              <div className="text-sm font-semibold text-white leading-tight">{hoveredPoint.name}</div>
              <div className="text-[10px] mt-0.5" style={{ color: STATUS_COLORS[hoveredPoint.status] }}>
                {STATUS_LABELS[hoveredPoint.status]}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="glass-panel p-2">
              <span className="text-white/40 block text-[10px]">Volume stocké</span>
              <span className="font-mono font-bold text-climate-blue">{hoveredPoint.volume_liters.toLocaleString("fr-FR")} L</span>
            </div>
            <div className="glass-panel p-2">
              <span className="text-white/40 block text-[10px]">Température</span>
              <span className="font-mono font-bold" style={{ color: STATUS_COLORS[hoveredPoint.status] }}>
                {hoveredPoint.temp_celsius}°C
              </span>
            </div>
            <div className="glass-panel p-2 col-span-2">
              <span className="text-white/40 block text-[10px]">Altitude</span>
              <span className="font-mono font-bold text-white/70">{hoveredPoint.altitude_m.toLocaleString("fr-FR")} m</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="glass-panel p-3">
        <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-2">Légende tours 3D</span>
        <div className="flex flex-col gap-1.5">
          {(["cold_ok", "temp_warning", "critical_delay"] as const).map((s) => (
            <div key={s} className="flex items-center gap-2 text-[10px] text-white/50">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s] }} />
              {STATUS_LABELS[s]}
              {s === "cold_ok" && (
                <CheckCircle size={10} className="text-climate-blue ml-auto" />
              )}
              {s === "critical_delay" && (
                <AlertTriangle size={10} className="text-danger ml-auto" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 text-[10px] text-white/25">Hauteur = volume stocké (L)</div>
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-20 text-white/50 shrink-0 text-[10px]">{label}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,255,255,0.2)]`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-4 text-right text-white/60 font-mono">{count}</span>
    </div>
  );
}

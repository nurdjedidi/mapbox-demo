import { Milk, Thermometer, Fuel, Truck, AlertTriangle, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { AnimatedNumber } from "~/components/shared/AnimatedNumber";
import { STATUS_COLORS, STATUS_LABELS } from "./CollectionPointsLayer";
import type { CollectionPoint } from "./CollectionPointsLayer";
import type { Tanker } from "./TankersLayer";
import { tempColor } from "./TankersLayer";
import type { TruckRoute } from "./useFleetRoutes";

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
  tankers: Tanker[];
  hoveredPoint: CollectionPoint | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  selectedTanker?: Tanker | null;
  routeData?: TruckRoute | null;
  onSelectTanker: (id: string | null) => void;
  routesLoading?: boolean;
}

export function DairyStatsPanel({
  stats,
  points,
  tankers,
  hoveredPoint,
  isPlaying,
  onTogglePlay,
  selectedTanker,
  routeData,
  onSelectTanker,
  routesLoading,
}: DairyStatsPanelProps) {
  if (selectedTanker) {
    const color = tempColor(selectedTanker.temp_celsius);
    const statusLabel =
      selectedTanker.temp_celsius <= 4
        ? "Chaîne du froid OK"
        : selectedTanker.temp_celsius <= 6
        ? "Temp. élevée"
        : "Critique";

    return (
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div
          className="glass-panel p-4"
          style={{ borderColor: `${color}30`, background: `linear-gradient(135deg, ${color}08, transparent)` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg viewBox="0 0 28 36" width="14" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 1 L27 35 L14 27 L1 35 Z" fill={color} />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
              Citerne sélectionnée
            </span>
            <button
              onClick={() => onSelectTanker(null)}
              className="ml-auto text-white/30 hover:text-white/70 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="text-white font-bold text-base leading-tight">{selectedTanker.name}</div>
          <div className="text-white/35 text-xs font-mono mt-0.5">{selectedTanker.id}</div>
        </div>

        {/* Temp + Fill */}
        <div className="glass-panel p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-white/40 block mb-1">Température</span>
              <span className="text-xl font-bold font-mono" style={{ color }}>
                {selectedTanker.temp_celsius}°C
              </span>
              <span className="text-[10px] block mt-0.5" style={{ color: `${color}99` }}>
                {statusLabel}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-white/40 block mb-1">Remplissage</span>
              <span className="text-xl font-bold font-mono text-green-400">{selectedTanker.fill_pct}%</span>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-400"
                  style={{ width: `${selectedTanker.fill_pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={12} className="text-white/30" />
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Trajet → Hub Central</span>
          </div>
          {routesLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 size={12} className="text-blue-400/40 animate-spin" />
              <span className="text-white/30 text-xs">Calcul des itinéraires…</span>
            </div>
          ) : routeData ? (
            <div className="flex gap-4">
              <div>
                <span className="text-white text-lg font-bold tabular-nums">
                  {routeData.distance_m >= 1000
                    ? `${(routeData.distance_m / 1000).toFixed(1)} km`
                    : `${Math.round(routeData.distance_m)} m`}
                </span>
                <span className="text-[10px] text-white/40 block mt-0.5">Distance</span>
              </div>
              <div>
                <span className="text-white text-lg font-bold tabular-nums">
                  {Math.round(routeData.duration_s / 60)} min
                </span>
                <span className="text-[10px] text-white/40 block mt-0.5">Durée estimée</span>
              </div>
            </div>
          ) : (
            <span className="text-white/30 text-xs">Route non disponible</span>
          )}
          <div className="mt-2 text-[10px] text-white/25">→ Hub Central</div>
        </div>

        <button
          onClick={() => onSelectTanker(null)}
          className="glass-panel p-3 flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors w-full text-left"
        >
          <ChevronRight size={12} className="rotate-180" />
          Retour à la flotte
        </button>
      </div>
    );
  }

  const coldOk = points.filter((p) => p.status === "cold_ok").length;
  const warning = points.filter((p) => p.status === "temp_warning").length;
  const critical = points.filter((p) => p.status === "critical_delay").length;

  return (
    <div className="flex flex-col gap-3">
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

      {/* Tankers control + roster */}
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

        {/* Truck roster */}
        <div className="space-y-1.5">
          {tankers.map((t) => {
            const color = tempColor(t.temp_celsius);
            const isAlert = t.temp_celsius > 4;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTanker(t.id)}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-white/3 hover:bg-white/8 transition-colors border border-white/5 hover:border-white/10 text-left"
              >
                <svg viewBox="0 0 28 36" width="10" height="13" xmlns="http://www.w3.org/2000/svg"
                     style={{ filter: `drop-shadow(0 0 3px ${color})` }}>
                  <path d="M14 1 L27 35 L14 27 L1 35 Z" fill={color} />
                </svg>
                <span className="text-[11px] text-white/70 flex-1 truncate">{t.name}</span>
                <span className="text-[11px] font-mono font-bold" style={{ color }}>{t.temp_celsius}°C</span>
                {isAlert && <AlertTriangle size={10} style={{ color }} />}
                <ChevronRight size={10} className="text-white/20" />
              </button>
            );
          })}
        </div>

        {routesLoading && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-white/25">
            <Loader2 size={10} className="animate-spin" />
            Calcul des itinéraires réels…
          </div>
        )}
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
        <div className="mt-2 text-[10px] text-white/30">Route 3D vs route planaire standard</div>
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
              {s === "cold_ok" && <CheckCircle size={10} className="text-climate-blue ml-auto" />}
              {s === "critical_delay" && <AlertTriangle size={10} className="text-danger ml-auto" />}
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
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,255,255,0.2)]`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-4 text-right text-white/60 font-mono">{count}</span>
    </div>
  );
}

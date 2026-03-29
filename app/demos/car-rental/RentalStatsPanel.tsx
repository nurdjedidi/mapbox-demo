import { Car, Wrench, MapPin, TrendingUp, Fuel, ChevronRight, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { AnimatedNumber } from "~/components/shared/AnimatedNumber";
import { STATUS_COLORS, STATUS_LABELS, type Vehicle } from "./VehiclesLayer";

interface RentalStats {
  total_vehicles: number;
  available: number;
  rented: number;
  maintenance: number;
  reserved: number;
  utilization_rate_pct: number;
  daily_revenue_dzd: number;
  avg_rental_duration_h: number;
  monthly_revenue_dzd: number;
  active_clients: number;
}

interface RentalStatsPanelProps {
  stats: RentalStats;
  vehicles: Vehicle[];
  isPlaying: boolean;
  onTogglePlay: () => void;
  showZones: boolean;
  onToggleZones: () => void;
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (id: string | null) => void;
}

export function RentalStatsPanel({
  stats,
  vehicles,
  isPlaying,
  onTogglePlay,
  showZones,
  onToggleZones,
  selectedVehicle,
  onSelectVehicle,
}: RentalStatsPanelProps) {
  // ── Selected vehicle detail view ───────────────────────────────────────────
  if (selectedVehicle) {
    const v     = selectedVehicle;
    const color = STATUS_COLORS[v.status];
    const fuelColor = v.fuel_pct < 30 ? "#EF4444" : v.fuel_pct < 60 ? "#F97316" : "#22C55E";

    return (
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="glass-panel p-4" style={{ borderColor: `${color}30`, background: `linear-gradient(135deg, ${color}08, transparent)` }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
              {STATUS_LABELS[v.status]}
            </span>
            <button onClick={() => onSelectVehicle(null)} className="ml-auto text-white/30 hover:text-white/70 transition-colors">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="text-white font-bold text-base">{v.model}</div>
          <div className="text-white/35 text-xs font-mono mt-0.5">{v.plate}</div>
        </div>

        {/* Client / Issue */}
        {(v.client || v.issue) && (
          <div className="glass-panel p-3">
            {v.client && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                  <span className="text-blue-300 text-xs font-bold">{v.client.charAt(v.client.lastIndexOf(" ") + 1)}</span>
                </div>
                <div>
                  <div className="text-white/80 text-xs font-medium">{v.client}</div>
                  <div className="text-white/35 text-[10px]">Client actif</div>
                </div>
              </div>
            )}
            {v.issue && (
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle size={13} className="text-orange-400 shrink-0" />
                <span className="text-orange-300 text-xs">{v.issue}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-panel p-3">
            <span className="text-[10px] text-white/40 block mb-1">Carburant</span>
            <span className="text-xl font-bold font-mono" style={{ color: fuelColor }}>{v.fuel_pct}%</span>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${v.fuel_pct}%`, background: fuelColor }} />
            </div>
          </div>
          <div className="glass-panel p-3">
            <span className="text-[10px] text-white/40 block mb-1">Kilométrage</span>
            <span className="text-xl font-bold font-mono text-white/80">
              {(v.mileage_km / 1000).toFixed(0)}k
            </span>
            <span className="text-[10px] text-white/30 block">km parcourus</span>
          </div>
        </div>

        {/* Return time */}
        {v.returnTime && (
          <div className="glass-panel p-3 flex items-center gap-3">
            <Clock size={14} className="text-white/30 shrink-0" />
            <div>
              <span className="text-[10px] text-white/40 block">Retour / Pickup</span>
              <span className="text-white/80 text-sm font-medium">{v.returnTime}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => onSelectVehicle(null)}
          className="glass-panel p-3 flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors w-full text-left"
        >
          <ChevronRight size={12} className="rotate-180" />
          Retour à la flotte
        </button>
      </div>
    );
  }

  // ── Fleet overview ─────────────────────────────────────────────────────────
  const utilColor = stats.utilization_rate_pct >= 70 ? "#22C55E" : stats.utilization_rate_pct >= 40 ? "#F97316" : "#EF4444";

  return (
    <div className="flex flex-col gap-3">
      {/* Revenue KPIs */}
      <div className="glass-panel p-4" style={{ borderColor: "#3B82F620", background: "linear-gradient(135deg, #3B82F608, transparent)" }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} className="text-blue-400" />
          <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">Performance Flotte</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <AnimatedNumber
              value={stats.daily_revenue_dzd / 1000}
              decimals={0} suffix="k DZD"
              className="text-xl font-bold text-blue-400"
            />
            <span className="text-[10px] text-white/40 block mt-0.5">CA journalier</span>
          </div>
          <div>
            <AnimatedNumber
              value={stats.utilization_rate_pct}
              decimals={0} suffix="%"
              className="text-xl font-bold"
            />
            <span className="text-[10px] text-white/40 block mt-0.5">Taux d'utilisation</span>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${stats.utilization_rate_pct}%`, background: utilColor }}
          />
        </div>
      </div>

      {/* Status breakdown */}
      <div className="glass-panel p-3">
        <div className="flex items-center gap-2 mb-3">
          <Car size={13} className="text-white/40" />
          <span className="text-xs text-white/40 uppercase tracking-wider">État de la flotte</span>
          <span className="ml-auto text-[10px] font-mono text-white/30">{stats.total_vehicles} véh.</span>
        </div>
        <div className="space-y-2">
          {(["available", "rented", "maintenance", "reserved"] as const).map((s) => {
            const count = stats[s as keyof typeof stats] as number;
            const pct   = (count / stats.total_vehicles) * 100;
            return (
              <div key={s} className="flex items-center gap-2 text-[11px]">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[s] }} />
                <span className="text-white/50 flex-1">{STATUS_LABELS[s]}</span>
                <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%`, background: STATUS_COLORS[s], opacity: 0.8 }}
                  />
                </div>
                <span className="w-4 text-right text-white/60 font-mono">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation control */}
      <div className="glass-panel p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-white/30" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Suivi temps réel</span>
          </div>
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              isPlaying
                ? "bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30"
                : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-blue-400 animate-pulse" : "bg-white/30"}`} />
            {isPlaying ? "Live" : "Démarrer"}
          </button>
        </div>
        <button
          onClick={onToggleZones}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${
            showZones ? "bg-white/8 text-white/70" : "text-white/30 hover:text-white/50"
          }`}
        >
          <span className="text-base leading-none">⛳</span>
          <span className="flex-1 text-left">Zones premium & golfs</span>
          <div className={`w-7 h-4 rounded-full relative transition-all ${showZones ? "bg-green-500/40" : "bg-white/10"}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${showZones ? "bg-green-400 left-3.5" : "bg-white/30 left-0.5"}`} />
          </div>
        </button>
      </div>

      {/* Vehicle roster */}
      <div className="glass-panel p-3">
        <span className="text-[10px] text-white/35 uppercase tracking-wider block mb-2">Véhicules — cliquer pour localiser</span>
        <div className="space-y-1">
          {vehicles.map((v) => {
            const color = STATUS_COLORS[v.status];
            const fuelLow = v.fuel_pct < 30;
            return (
              <button
                key={v.id}
                onClick={() => onSelectVehicle(v.id)}
                className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/3 hover:bg-white/7 border border-white/5 hover:border-white/10 transition-all text-left"
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                <span className="text-[11px] text-white/70 flex-1 truncate">{v.model}</span>
                <span className="text-[9px] text-white/30 font-mono">{v.plate.slice(-6)}</span>
                {fuelLow && <Fuel size={9} className="text-red-400 shrink-0" />}
                {v.issue && <Wrench size={9} className="text-orange-400 shrink-0" />}
                {v.status === "available" && <CheckCircle size={9} style={{ color }} className="shrink-0" />}
                <ChevronRight size={9} className="text-white/20 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="glass-panel p-3">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <AnimatedNumber value={stats.avg_rental_duration_h} decimals={1} suffix="h" className="text-lg font-bold text-white/70" />
            <span className="text-[10px] text-white/35 block">Durée moy. location</span>
          </div>
          <div>
            <AnimatedNumber value={stats.active_clients} decimals={0} className="text-lg font-bold text-blue-400" />
            <span className="text-[10px] text-white/35 block">Clients actifs</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="glass-panel p-3">
        <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-2">Zones cartographiées</span>
        <div className="space-y-1.5 text-[10px] text-white/50">
          <div className="flex items-center gap-2"><span className="text-sm">⛳</span> Golf club / Zone verte</div>
          <div className="flex items-center gap-2"><span className="text-sm">★</span> Zone résidentielle premium</div>
          <div className="flex items-center gap-2"><span className="text-sm">✈</span> Aéroport Houari Boumédiène</div>
        </div>
      </div>
    </div>
  );
}

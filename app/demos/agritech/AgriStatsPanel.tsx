import { Droplets, AlertTriangle, Leaf, Wind } from "lucide-react";
import { AnimatedNumber } from "~/components/shared/AnimatedNumber";
import type { Parcel } from "./FarmParcelsLayer";

interface Alert {
  id: number;
  type: string;
  parcel: string;
  message: string;
  severity: "warning" | "critical";
  timestamp: string;
}

interface Stats {
  total_hectares: number;
  avg_yield_predicted: number;
  water_consumption_m3: number;
  parcels_healthy: number;
  parcels_stress: number;
  parcels_critical: number;
  co2_sequestered_tons: number;
}

interface AgriStatsPanelProps {
  parcels: Parcel[];
  alerts: Alert[];
  stats: Stats;
  selectedParcel: Parcel | null;
  onClearSelection: () => void;
}

export function AgriStatsPanel({ parcels, alerts, stats, selectedParcel, onClearSelection }: AgriStatsPanelProps) {
  const healthPct = Math.round((stats.parcels_healthy / parcels.length) * 100);

  return (
    <div className="flex flex-col gap-3">
      {/* Main KPIs */}
      <div className="glass-panel p-4 border-eco-green/20">
        <div className="flex items-center gap-2 mb-3">
          <Leaf size={14} className="text-eco-green" />
          <span className="text-xs text-white/40 uppercase tracking-wider">Exploitation Souss-Massa</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <AnimatedNumber value={stats.total_hectares} decimals={0} suffix=" ha" className="text-2xl font-bold" />
            <span className="text-xs text-white/40 block">Surface totale</span>
          </div>
          <div>
            <AnimatedNumber value={stats.avg_yield_predicted} decimals={1} suffix=" t/ha" className="text-2xl font-bold text-eco-green" />
            <span className="text-xs text-white/40 block">Rendement moyen</span>
          </div>
        </div>
      </div>

      {/* Santé parcelles */}
      <div className="glass-panel p-3">
        <span className="text-xs text-white/40 uppercase tracking-wider block mb-3">Santé cultures</span>
        <div className="space-y-2">
          <HealthBar label="Saines" count={stats.parcels_healthy} total={parcels.length} color="bg-eco-green" />
          <HealthBar label="Stress" count={stats.parcels_stress} total={parcels.length} color="bg-agri-amber" />
          <HealthBar label="Critiques" count={stats.parcels_critical} total={parcels.length} color="bg-danger" />
        </div>
        <div className="mt-2 text-xs text-white/40">
          Taux santé : <span className={`font-mono font-bold ${healthPct > 70 ? "text-eco-green" : healthPct > 50 ? "text-warning" : "text-danger"}`}>{healthPct}%</span>
        </div>
      </div>

      {/* Ressources */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Droplets size={12} className="text-climate-blue" />
            <span className="text-xs text-white/40">Eau consommée</span>
          </div>
          <AnimatedNumber value={stats.water_consumption_m3} suffix=" m³" className="text-lg font-bold text-climate-blue font-mono" />
        </div>
        <div className="glass-panel p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Wind size={12} className="text-eco-green" />
            <span className="text-xs text-white/40">CO₂ séquestré</span>
          </div>
          <AnimatedNumber value={stats.co2_sequestered_tons} suffix=" t" className="text-lg font-bold text-eco-green font-mono" />
        </div>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="glass-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} className="text-warning" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Alertes actives</span>
            <span className="ml-auto text-xs bg-danger/20 text-danger border border-danger/30 rounded px-1.5 py-0.5 font-mono">{alerts.length}</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.map((a) => (
              <div key={a.id} className={`p-2 rounded-lg border text-xs ${a.severity === "critical" ? "border-danger/30 bg-danger/8" : "border-warning/30 bg-warning/8"}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.severity === "critical" ? "bg-danger" : "bg-warning"}`} />
                  <span className={`font-semibold ${a.severity === "critical" ? "text-danger" : "text-warning"}`}>
                    Parcelle {a.parcel}
                  </span>
                </div>
                <p className="text-white/60 leading-relaxed">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parcelle sélectionnée */}
      {selectedParcel && (
        <div className="glass-panel p-4 border border-white/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">{selectedParcel.name}</h3>
              <span className="text-xs text-white/40">{selectedParcel.crop} · {selectedParcel.area_hectares} ha</span>
            </div>
            <button onClick={onClearSelection} className="text-xs text-white/30 hover:text-white/60">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/40 block">Santé</span>
              <span className={`font-semibold capitalize ${selectedParcel.health === "healthy" ? "text-eco-green" : selectedParcel.health === "stress" ? "text-agri-amber" : "text-danger"}`}>
                {selectedParcel.health === "healthy" ? "Saine" : selectedParcel.health === "stress" ? "Stress" : "Critique"}
              </span>
            </div>
            <div>
              <span className="text-white/40 block">Rendement prévu</span>
              <span className="font-mono font-bold">{selectedParcel.yield_predicted} t/ha</span>
            </div>
            <div>
              <span className="text-white/40 block">Irrigation</span>
              <span className="font-mono text-climate-blue">{selectedParcel.irrigation_m3} m³</span>
            </div>
            <div>
              <span className="text-white/40 block">Stade</span>
              <span className="font-medium capitalize">{selectedParcel.stage}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-white/30">
            Dernier traitement : {new Date(selectedParcel.last_treatment).toLocaleDateString("fr-FR")}
          </div>
        </div>
      )}
    </div>
  );
}

function HealthBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 text-white/50 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-4 text-right text-white/60 font-mono">{count}</span>
    </div>
  );
}

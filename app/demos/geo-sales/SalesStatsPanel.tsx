import { TrendingUp, Target, Clock } from "lucide-react";
import { AnimatedNumber } from "~/components/shared/AnimatedNumber";
import type { Customer } from "./CustomerLayer";

interface SalesStatsPanelProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onClearSelection: () => void;
}

export function SalesStatsPanel({ customers, selectedCustomer, onClearSelection }: SalesStatsPanelProps) {
  const active = customers.filter((c) => c.revenue > 0);
  const premium = customers.filter((c) => c.segment === "premium");
  const inactif = customers.filter((c) => c.segment === "inactif");
  const prospects = customers.filter((c) => c.segment === "prospect");
  const stale = customers.filter((c) => c.segment !== "prospect" && c.lastContact > 45);

  const totalRevenue = active.reduce((s, c) => s + c.revenue, 0);
  const avgRevenue = active.length > 0 ? Math.round(totalRevenue / active.length) : 0;

  const byZone = customers.reduce<Record<string, number>>((acc, c) => {
    acc[c.zone] = (acc[c.zone] ?? 0) + c.revenue;
    return acc;
  }, {});
  const topZone = Object.entries(byZone).sort((a, b) => b[1] - a[1])[0];

  const byRep = active.reduce<Record<string, number>>((acc, c) => {
    acc[c.rep] = (acc[c.rep] ?? 0) + c.revenue;
    return acc;
  }, {});
  const topRep = Object.entries(byRep).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Revenue hero */}
      <div className="glass-panel p-4 border-success/20">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-success" />
          <span className="text-xs text-white/40 uppercase tracking-wider">CA mensuel total</span>
        </div>
        <div className="flex items-end gap-3">
          <AnimatedNumber value={totalRevenue} suffix=" MAD" className="text-3xl font-bold text-success" />
        </div>
        <div className="flex gap-4 mt-2 text-xs text-white/40">
          <span>Moy. <span className="text-white/70 font-mono">{Math.round(avgRevenue / 1000)}k</span></span>
          <span>Top zone <span className="text-white/70">{topZone?.[0]?.split(" ")[0]}</span></span>
          <span>Top rep <span className="text-white/70">{topRep?.[0]}</span></span>
        </div>
      </div>

      {/* Segment breakdown */}
      <div className="glass-panel p-3">
        <span className="text-xs text-white/40 uppercase tracking-wider block mb-3">Portefeuille clients</span>
        <div className="space-y-2.5">
          <SegmentBar label="Premium" count={premium.length} total={customers.length} color="bg-success" />
          <SegmentBar label="Standard" count={customers.filter(c => c.segment === "standard").length} total={customers.length} color="bg-electric-blue" />
          <SegmentBar label="Prospects" count={prospects.length} total={customers.length} color="bg-warning" />
          <SegmentBar label="Inactifs" count={inactif.length} total={customers.length} color="bg-white/20" />
        </div>
      </div>

      {/* Alerts */}
      {stale.length > 0 && (
        <div className="glass-panel p-3 border border-warning/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={12} className="text-warning" />
            <span className="text-xs text-warning font-semibold uppercase tracking-wider">Relance urgente</span>
          </div>
          <p className="text-xs text-white/50">{stale.length} clients sans contact depuis +45j</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {stale.slice(0, 3).map((c) => (
              <span key={c.id} className="text-xs bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/60">
                {c.name.split(" ")[0]}
              </span>
            ))}
            {stale.length > 3 && <span className="text-xs text-white/30">+{stale.length - 3}</span>}
          </div>
        </div>
      )}

      {/* Dead zones */}
      {prospects.length > 0 && (
        <div className="glass-panel p-3 border border-electric-blue/20">
          <div className="flex items-center gap-2 mb-1">
            <Target size={12} className="text-electric-blue" />
            <span className="text-xs text-electric-blue font-semibold uppercase tracking-wider">Angles morts</span>
          </div>
          <p className="text-xs text-white/50">{prospects.length} zones à fort potentiel non couverts</p>
        </div>
      )}

      {/* Selected customer */}
      {selectedCustomer && (
        <div className="glass-panel p-4 border border-white/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white leading-tight">{selectedCustomer.name}</h3>
              <span className="text-xs text-white/40">{selectedCustomer.zone} · {selectedCustomer.rep}</span>
            </div>
            <button onClick={onClearSelection} className="text-xs text-white/30 hover:text-white/60 ml-2">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-white/40 block">Segment</span>
              <SegmentBadge segment={selectedCustomer.segment} />
            </div>
            <div>
              <span className="text-white/40 block">CA mensuel</span>
              <span className="font-mono font-bold text-sm">
                {selectedCustomer.revenue > 0 ? `${Math.round(selectedCustomer.revenue / 1000)}k MAD` : "—"}
              </span>
            </div>
            <div>
              <span className="text-white/40 block">Commercial</span>
              <span className="font-medium">{selectedCustomer.rep}</span>
            </div>
            <div>
              <span className="text-white/40 block">Dernier contact</span>
              <span className={`font-mono ${selectedCustomer.lastContact > 45 ? "text-danger" : selectedCustomer.lastContact > 20 ? "text-warning" : "text-success"}`}>
                {selectedCustomer.lastContact === 0 ? "Prospect" : `J-${selectedCustomer.lastContact}`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-white/50 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right text-white/60 font-mono">{count}</span>
    </div>
  );
}

function SegmentBadge({ segment }: { segment: string }) {
  const styles: Record<string, string> = {
    premium: "text-success",
    standard: "text-electric-blue",
    inactif: "text-white/40",
    prospect: "text-warning",
  };
  return <span className={`font-medium capitalize ${styles[segment] ?? ""}`}>{segment}</span>;
}

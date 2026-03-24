import { useState, useMemo } from "react";
import { Layers, Eye, EyeOff } from "lucide-react";
import { MapContainer } from "~/components/map/MapContainer";
import { DemoLayout } from "~/components/layout/DemoLayout";
import { SidePanel } from "~/components/layout/SidePanel";
import { CustomerLayer, type Customer } from "./CustomerLayer";
import { RevenueHeatmap } from "./RevenueHeatmap";
import { TerritoryLayer } from "./TerritoryLayer";
import { SalesStatsPanel } from "./SalesStatsPanel";
import { CITIES } from "~/lib/mapbox/config";
import rawCustomers from "~/data/mock-customers.json";

const SEGMENTS = ["all", "premium", "standard", "inactif", "prospect"] as const;
const REPS = ["all", "Karim", "Leila", "Omar"] as const;

type Segment = typeof SEGMENTS[number];
type Rep = typeof REPS[number];

const SEGMENT_LABELS: Record<string, string> = {
  all: "Tous",
  premium: "Premium",
  standard: "Standard",
  inactif: "Inactifs",
  prospect: "Prospects",
};

const REP_COLORS: Record<string, string> = {
  Karim: "#00D9FF",
  Leila: "#00FF88",
  Omar: "#FFB800",
};

export function GeoSales() {
  const [segment, setSegment] = useState<Segment>("all");
  const [activeRep, setActiveRep] = useState<Rep>("all");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTerritories, setShowTerritories] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const customers = rawCustomers as Customer[];

  const filtered = useMemo(() =>
    customers.filter((c) => {
      if (segment !== "all" && c.segment !== segment) return false;
      if (activeRep !== "all" && c.rep !== activeRep) return false;
      return true;
    }),
    [customers, segment, activeRep]
  );

  const selectedCustomer = selectedId ? customers.find((c) => c.id === selectedId) ?? null : null;

  const cityConfig = CITIES.casablanca;

  return (
    <DemoLayout>
      <MapContainer
        center={cityConfig.center}
        zoom={13.5}
        pitch={45}
        bearing={-10}
      >
        {showTerritories && <TerritoryLayer customers={filtered} activeRep={activeRep} />}
        {showHeatmap && <RevenueHeatmap customers={filtered} />}
        <CustomerLayer
          customers={filtered}
          onSelect={setSelectedId}
          selectedId={selectedId}
          showDeadZones={false}
        />
      </MapContainer>

      <SidePanel title="Geo-Sales Intelligence">
        {/* Segment filter */}
        <div>
          <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Segment</label>
          <div className="flex gap-1 p-1 rounded-lg bg-white/5 flex-wrap">
            {SEGMENTS.map((s) => (
              <button
                key={s}
                onClick={() => setSegment(s)}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all min-w-0 ${
                  segment === s ? "bg-electric-blue/20 text-electric-blue" : "text-white/50 hover:text-white/80"
                }`}
              >
                {SEGMENT_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Rep filter */}
        <div>
          <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Commercial</label>
          <div className="flex gap-1.5">
            {REPS.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRep(r)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  activeRep === r
                    ? r === "all"
                      ? "bg-white/10 border-white/30 text-white"
                      : `border-current text-white`
                    : "border-white/10 text-white/40 hover:text-white/60"
                }`}
                style={activeRep === r && r !== "all" ? { color: REP_COLORS[r], borderColor: REP_COLORS[r] + "66", background: REP_COLORS[r] + "15" } : {}}
              >
                {r === "all" ? "Tous" : r}
              </button>
            ))}
          </div>
        </div>

        {/* Layer toggles */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              showHeatmap ? "bg-success/15 border border-success/30 text-success" : "glass-button text-white/50"
            }`}
          >
            {showHeatmap ? <Eye size={13} /> : <EyeOff size={13} />}
            Heatmap CA
          </button>
          <button
            onClick={() => setShowTerritories(!showTerritories)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              showTerritories ? "bg-electric-blue/15 border border-electric-blue/30 text-electric-blue" : "glass-button text-white/50"
            }`}
          >
            <Layers size={13} />
            Zones
          </button>
        </div>

        {/* Legend */}
        <div className="glass-panel p-3">
          <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Légende</span>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { color: "#00FF88", label: "Premium", desc: ">25k MAD" },
              { color: "#00D9FF", label: "Standard", desc: "5-25k MAD" },
              { color: "#FFB800", label: "Prospect", desc: "En approche" },
              { color: "#4B5563", label: "Inactif", desc: "+60j sans contact" },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                <div>
                  <span className="text-white/70">{label}</span>
                  <span className="text-white/30 block text-[10px]">{desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-white/30">
            Taille = CA mensuel · Taille réduite = contact ancien
          </div>
        </div>

        {/* Stats */}
        <SalesStatsPanel
          customers={filtered}
          selectedCustomer={selectedCustomer}
          onClearSelection={() => setSelectedId(null)}
        />
      </SidePanel>
    </DemoLayout>
  );
}

import { Bike, Zap } from "lucide-react";

type VehicleType = "bike" | "scooter" | "all";

interface VehicleFiltersProps {
  vehicleType: VehicleType;
  onVehicleTypeChange: (type: VehicleType) => void;
  minBattery: number;
  onMinBatteryChange: (value: number) => void;
}

const TYPES: { value: VehicleType; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "bike", label: "Velos" },
  { value: "scooter", label: "Trottinettes" },
];

export function VehicleFilters({
  vehicleType,
  onVehicleTypeChange,
  minBattery,
  onMinBatteryChange,
}: VehicleFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Type tabs */}
      <div>
        <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">
          Type de vehicule
        </label>
        <div className="flex gap-1 p-1 rounded-lg bg-white/5">
          {TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onVehicleTypeChange(value)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                vehicleType === value
                  ? "bg-electric-blue/20 text-electric-blue"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Battery slider */}
      <div className="glass-panel p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-white/60 flex items-center gap-1.5">
            <Zap size={14} />
            Batterie min.
          </span>
          <span className="text-lg font-bold text-electric-blue font-mono">{minBattery}%</span>
        </div>
        <input
          type="range"
          value={minBattery}
          onChange={(e) => onMinBatteryChange(Number(e.target.value))}
          min={0}
          max={100}
          step={5}
          className="w-full accent-electric-blue h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-white/30 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

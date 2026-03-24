interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ label, value, icon, trend, className = "" }: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-danger"
        : "text-white/60";

  return (
    <div className={`glass-panel p-4 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold font-mono text-white">{value}</span>
        {trend && (
          <span className={`text-sm ${trendColor}`}>
            {trend === "up" ? "+" : trend === "down" ? "-" : "~"}
          </span>
        )}
      </div>
    </div>
  );
}

import { ChevronRight, CornerDownRight, CornerUpRight, ArrowUp, RotateCcw } from "lucide-react";
import type { RouteData } from "~/lib/mapbox/routing";

interface RouteInstructionsProps {
  route: RouteData;
}

function getManeuverIcon(type: string, modifier?: string) {
  if (type === "turn" && modifier?.includes("left")) return <CornerDownRight size={14} className="rotate-180" />;
  if (type === "turn" && modifier?.includes("right")) return <CornerUpRight size={14} />;
  if (type === "roundabout" || type === "rotary") return <RotateCcw size={14} />;
  if (type === "arrive") return <ChevronRight size={14} className="text-success" />;
  return <ArrowUp size={14} />;
}

export function RouteInstructions({ route }: RouteInstructionsProps) {
  const steps = route.legs?.[0]?.steps ?? [];

  if (steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs text-white/40 uppercase tracking-wider mb-1">Instructions</h3>
      <div className="max-h-60 overflow-y-auto flex flex-col gap-0.5">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="mt-0.5 text-electric-blue">
              {getManeuverIcon(step.maneuver.type, step.maneuver.modifier)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 truncate">
                {step.maneuver.instruction || "Continuer"}
              </p>
              <p className="text-xs text-white/30 font-mono">
                {step.distance < 1000
                  ? `${Math.round(step.distance)}m`
                  : `${(step.distance / 1000).toFixed(1)}km`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

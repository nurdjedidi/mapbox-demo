import { Play, Pause, RotateCcw, FastForward } from "lucide-react";

interface ReplayControlsProps {
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.5, 1, 2, 4];

export function ReplayControls({
  isPlaying,
  speed,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
}: ReplayControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs text-white/40 uppercase tracking-wider">Controles replay</h3>

      <div className="flex gap-2">
        {/* Play/Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isPlaying
              ? "bg-warning/15 border border-warning/30 text-warning"
              : "bg-electric-blue/15 border border-electric-blue/30 text-electric-blue"
          }`}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? "Pause" : "Lancer"}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="glass-button px-4 flex items-center gap-1.5 text-sm"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Speed selector */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/5">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`flex-1 py-1.5 rounded-md text-xs font-mono font-medium transition-all flex items-center justify-center gap-1 ${
              speed === s
                ? "bg-electric-blue/20 text-electric-blue"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <FastForward size={10} />
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

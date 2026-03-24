import { useState, type ReactNode } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";

interface SidePanelProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}

export function SidePanel({ title, children, onClose }: SidePanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Desktop: right panel */}
      <div className="hidden md:flex absolute top-16 right-4 bottom-4 w-[380px] glass-panel p-5 overflow-y-auto z-10 flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} className="text-white/60" />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-4 flex-1">{children}</div>
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className={`md:hidden fixed left-0 right-0 bottom-0 z-20 glass-panel rounded-t-2xl transition-all duration-300 ${
          expanded ? "max-h-[80vh]" : "max-h-[45vh]"
        }`}
      >
        {/* Drag handle + header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex flex-col items-center pt-2 pb-3 px-5"
        >
          <div className="w-10 h-1 rounded-full bg-white/20 mb-3" />
          <div className="flex items-center justify-between w-full">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {expanded ? (
              <ChevronDown size={18} className="text-white/40" />
            ) : (
              <ChevronUp size={18} className="text-white/40" />
            )}
          </div>
        </button>

        {/* Content */}
        <div className="px-5 pb-6 overflow-y-auto flex flex-col gap-3" style={{ maxHeight: expanded ? "calc(80vh - 70px)" : "calc(45vh - 70px)" }}>
          {children}
        </div>
      </div>
    </>
  );
}

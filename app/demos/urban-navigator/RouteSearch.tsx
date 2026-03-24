import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Navigation } from "lucide-react";
import { searchLandmarks, getLandmarksByCity, type Landmark } from "~/lib/mapbox/geocoding";
import type { CityKey } from "~/lib/mapbox/config";

interface RouteSearchProps {
  city: CityKey;
  onSearch: (start: [number, number], end: [number, number]) => void;
  isLoading?: boolean;
}

export function RouteSearch({ city, onSearch, isLoading }: RouteSearchProps) {
  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [startSuggestions, setStartSuggestions] = useState<Landmark[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<Landmark[]>([]);
  const [selectedStart, setSelectedStart] = useState<Landmark | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Landmark | null>(null);
  const [focusedField, setFocusedField] = useState<"start" | "end" | null>(null);

  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStartQuery("");
    setEndQuery("");
    setSelectedStart(null);
    setSelectedEnd(null);

    // Set defaults for the selected city
    const landmarks = getLandmarksByCity(city);
    if (landmarks.length >= 2) {
      setSelectedStart(landmarks[0]);
      setSelectedEnd(landmarks[1]);
      setStartQuery(landmarks[0].name);
      setEndQuery(landmarks[1].name);
    }
  }, [city]);

  useEffect(() => {
    if (startQuery.length > 0 && !selectedStart) {
      setStartSuggestions(searchLandmarks(startQuery, city));
    } else {
      setStartSuggestions([]);
    }
  }, [startQuery, city, selectedStart]);

  useEffect(() => {
    if (endQuery.length > 0 && !selectedEnd) {
      setEndSuggestions(searchLandmarks(endQuery, city));
    } else {
      setEndSuggestions([]);
    }
  }, [endQuery, city, selectedEnd]);

  const handleSearch = () => {
    if (selectedStart && selectedEnd) {
      onSearch(selectedStart.coords, selectedEnd.coords);
    }
  };

  const selectStart = (landmark: Landmark) => {
    setSelectedStart(landmark);
    setStartQuery(landmark.name);
    setFocusedField(null);
  };

  const selectEnd = (landmark: Landmark) => {
    setSelectedEnd(landmark);
    setEndQuery(landmark.name);
    setFocusedField(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Start input */}
      <div ref={startRef} className="relative">
        <label className="text-xs text-white/40 mb-1 block uppercase tracking-wider">Depart</label>
        <div className="relative">
          <Navigation size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-success" />
          <input
            value={startQuery}
            onChange={(e) => {
              setStartQuery(e.target.value);
              setSelectedStart(null);
            }}
            onFocus={() => setFocusedField("start")}
            onBlur={() => setTimeout(() => setFocusedField(null), 200)}
            placeholder="Lieu de depart..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-electric-blue/50 transition-colors"
          />
        </div>
        {focusedField === "start" && startSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 glass-panel p-1 z-50 max-h-48 overflow-y-auto">
            {startSuggestions.map((l) => (
              <button
                key={l.name}
                onMouseDown={() => selectStart(l)}
                className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
              >
                {l.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* End input */}
      <div ref={endRef} className="relative">
        <label className="text-xs text-white/40 mb-1 block uppercase tracking-wider">Arrivee</label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-danger" />
          <input
            value={endQuery}
            onChange={(e) => {
              setEndQuery(e.target.value);
              setSelectedEnd(null);
            }}
            onFocus={() => setFocusedField("end")}
            onBlur={() => setTimeout(() => setFocusedField(null), 200)}
            placeholder="Destination..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-electric-blue/50 transition-colors"
          />
        </div>
        {focusedField === "end" && endSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 glass-panel p-1 z-50 max-h-48 overflow-y-auto">
            {endSuggestions.map((l) => (
              <button
                key={l.name}
                onMouseDown={() => selectEnd(l)}
                className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
              >
                {l.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search button */}
      <button
        onClick={handleSearch}
        disabled={!selectedStart || !selectedEnd || isLoading}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-electric-blue/20 border border-electric-blue/40 text-electric-blue font-medium text-sm hover:bg-electric-blue/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Search size={16} />
        {isLoading ? "Calcul en cours..." : "Calculer l'itineraire"}
      </button>
    </div>
  );
}

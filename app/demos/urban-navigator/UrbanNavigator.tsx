import { useState } from "react";
import { Play } from "lucide-react";
import { MapContainer } from "~/components/map/MapContainer";
import { DemoLayout } from "~/components/layout/DemoLayout";
import { SidePanel } from "~/components/layout/SidePanel";
import { StatCard } from "~/components/shared/StatCard";
import { RouteSearch } from "./RouteSearch";
import { RouteAnimation } from "./RouteAnimation";
import { RouteInstructions } from "./RouteInstructions";
import { getRoute, formatDuration, formatDistance, type RouteData } from "~/lib/mapbox/routing";
import { CITIES, type CityKey } from "~/lib/mapbox/config";

const ROUTE_LABELS = ["Rapide", "Balanced", "Scenic"];

export function UrbanNavigator() {
  const [city, setCity] = useState<CityKey>("dubai");
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cityConfig = CITIES[city];
  const selectedRoute = routes[selectedIndex] ?? null;

  const handleSearch = async (start: [number, number], end: [number, number]) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedRoutes = await getRoute(start, end, {
        alternatives: true,
        steps: true,
      });
      setRoutes(fetchedRoutes);
      setSelectedIndex(0);
    } catch (e) {
      setError("Impossible de calculer l'itineraire");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DemoLayout>
      <MapContainer
        center={cityConfig.center}
        zoom={cityConfig.zoom}
        pitch={cityConfig.pitch}
        bearing={cityConfig.bearing}
      >
        {routes.length > 0 && (
          <RouteAnimation
            routes={routes}
            selectedIndex={selectedIndex}
            isAnimating={isAnimating}
            onAnimationEnd={() => setIsAnimating(false)}
          />
        )}
      </MapContainer>

      <SidePanel title="Urban Navigator">
        {/* City selector */}
        <div className="flex gap-2">
          {(Object.keys(CITIES) as CityKey[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                setCity(key);
                setRoutes([]);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                city === key
                  ? "glass-button-active"
                  : "glass-button"
              }`}
            >
              {CITIES[key].name}
            </button>
          ))}
        </div>

        {/* Route search */}
        <RouteSearch city={city} onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
            {error}
          </div>
        )}

        {/* Route alternatives */}
        {routes.length > 0 && (
          <>
            <div className="flex gap-2">
              {routes.map((route, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setIsAnimating(false);
                  }}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                    selectedIndex === idx ? "glass-button-active" : "glass-button"
                  }`}
                >
                  <div>{ROUTE_LABELS[idx] ?? `Route ${idx + 1}`}</div>
                  <div className="text-white/40 mt-0.5">{formatDuration(route.duration)}</div>
                </button>
              ))}
            </div>

            {selectedRoute && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <StatCard
                    label="Distance"
                    value={formatDistance(selectedRoute.distance)}
                    icon=""
                  />
                  <StatCard
                    label="Duree"
                    value={formatDuration(selectedRoute.duration)}
                    icon=""
                  />
                  <StatCard
                    label="Vitesse"
                    value={`${Math.round((selectedRoute.distance / selectedRoute.duration) * 3.6)} km/h`}
                    icon=""
                  />
                </div>

                {/* Animate button */}
                <button
                  onClick={() => setIsAnimating(true)}
                  disabled={isAnimating}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-electric-blue/20 border border-electric-blue/40 text-electric-blue font-medium text-sm hover:bg-electric-blue/30 transition-all disabled:opacity-40"
                >
                  <Play size={16} />
                  {isAnimating ? "Animation en cours..." : "Animer le trajet"}
                </button>

                {/* Instructions */}
                <RouteInstructions route={selectedRoute} />
              </>
            )}
          </>
        )}
      </SidePanel>
    </DemoLayout>
  );
}

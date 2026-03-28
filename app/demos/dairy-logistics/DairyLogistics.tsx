import { useState, useCallback, useMemo } from "react";
import { MapContainer } from "~/components/map/MapContainer";
import { DemoLayout } from "~/components/layout/DemoLayout";
import { SidePanel } from "~/components/layout/SidePanel";
import { HideBoundariesLayer } from "~/components/map/HideBoundariesLayer";
import { CITIES } from "~/lib/mapbox/config";
import { TerrainLayer } from "./TerrainLayer";
import { CleanMapLayer } from "./CleanMapLayer";
import { AkbouHub } from "./AkbouHub";
import { CollectionPointsLayer, type CollectionPoint } from "./CollectionPointsLayer";
import { TankersLayer, type Tanker } from "./TankersLayer";
import { DairyStatsPanel } from "./DairyStatsPanel";
import { useFleetRoutes } from "./useFleetRoutes";
import dairyData from "~/data/mock-dairy.json";

const HUB_COORDS = dairyData.akbouHub.coordinates as [number, number];

export function DairyLogistics() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<CollectionPoint | null>(null);
  const [selectedTankerId, setSelectedTankerId] = useState<string | null>(null);

  const points  = dairyData.collectionPoints as CollectionPoint[];
  const tankers = dairyData.tankers as Tanker[];

  const { routes, loading } = useFleetRoutes(tankers, HUB_COORDS);

  const realRoutes = useMemo(
    () => new Map(Array.from(routes.entries()).map(([id, r]) => [id, r.coords])),
    [routes]
  );
  const selectedRoute = selectedTankerId ? routes.get(selectedTankerId) ?? null : null;
  const selectedTanker = tankers.find((t) => t.id === selectedTankerId) ?? null;

  const handleSelectTanker = useCallback((id: string | null) => {
    setSelectedTankerId(id);
  }, []);

  return (
    <DemoLayout>
      <MapContainer
        center={CITIES.akbou.center}
        zoom={CITIES.akbou.zoom}
        pitch={CITIES.akbou.pitch}
        bearing={CITIES.akbou.bearing}
        style="mapbox://styles/mapbox/navigation-night-v1"
      >
        <HideBoundariesLayer />
        <CleanMapLayer />
        <TerrainLayer />
        <AkbouHub
          coordinates={HUB_COORDS}
          currentVolume={dairyData.akbouHub.currentVolume_liters}
          capacity={dairyData.akbouHub.capacity_liters}
        />
        <CollectionPointsLayer points={points} onHover={setHoveredPoint} />
        <TankersLayer
          tankers={tankers}
          isPlaying={isPlaying}
          selectedTankerId={selectedTankerId}
          onSelectTanker={handleSelectTanker}
          realRoutes={realRoutes}
        />
      </MapContainer>

      <SidePanel title="Dairy Logistics">
        <DairyStatsPanel
          stats={dairyData.stats}
          points={points}
          tankers={tankers}
          hoveredPoint={hoveredPoint}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          selectedTanker={selectedTanker}
          routeData={selectedRoute}
          onSelectTanker={handleSelectTanker}
          routesLoading={loading}
        />
      </SidePanel>
    </DemoLayout>
  );
}

import { useState } from "react";
import { MapContainer } from "~/components/map/MapContainer";
import { DemoLayout } from "~/components/layout/DemoLayout";
import { SidePanel } from "~/components/layout/SidePanel";
import { HideBoundariesLayer } from "~/components/map/HideBoundariesLayer";
import { CITIES } from "~/lib/mapbox/config";
import { TerrainLayer } from "./TerrainLayer";
import { AkbouHub } from "./AkbouHub";
import { CollectionPointsLayer, type CollectionPoint } from "./CollectionPointsLayer";
import { TankersLayer, type Tanker } from "./TankersLayer";
import { DairyStatsPanel } from "./DairyStatsPanel";
import dairyData from "~/data/mock-dairy.json";

export function DairyLogistics() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<CollectionPoint | null>(null);
  const [selectedTankerId, setSelectedTankerId] = useState<string | null>(null);

  const cityConfig = CITIES.akbou;
  const points = dairyData.collectionPoints as CollectionPoint[];
  const tankers = dairyData.tankers as Tanker[];

  return (
    <DemoLayout>
      <MapContainer
        center={cityConfig.center}
        zoom={cityConfig.zoom}
        pitch={cityConfig.pitch}
        bearing={cityConfig.bearing}
        style="mapbox://styles/mapbox/navigation-night-v1"
      >
        <HideBoundariesLayer />
        <TerrainLayer />
        <AkbouHub
          coordinates={dairyData.akbouHub.coordinates as [number, number]}
          currentVolume={dairyData.akbouHub.currentVolume_liters}
          capacity={dairyData.akbouHub.capacity_liters}
        />
        <CollectionPointsLayer points={points} onHover={setHoveredPoint} />
        <TankersLayer 
          tankers={tankers} 
          isPlaying={isPlaying} 
          selectedTankerId={selectedTankerId}
          onSelectTanker={setSelectedTankerId}
        />
      </MapContainer>

      <SidePanel title="Dairy Logistics — Soummam">
        <DairyStatsPanel
          stats={dairyData.stats}
          points={points}
          hoveredPoint={hoveredPoint}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
        />
      </SidePanel>
    </DemoLayout>
  );
}

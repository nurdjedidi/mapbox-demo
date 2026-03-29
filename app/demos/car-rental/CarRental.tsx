import { useState, useCallback } from "react";
import { MapContainer } from "~/components/map/MapContainer";
import { DemoLayout } from "~/components/layout/DemoLayout";
import { SidePanel } from "~/components/layout/SidePanel";
import { HideBoundariesLayer } from "~/components/map/HideBoundariesLayer";
import { CITIES } from "~/lib/mapbox/config";
import { VehiclesLayer, type Vehicle } from "./VehiclesLayer";
import { PremiumZones, type PremiumZone, type Garage } from "./PremiumZones";
import { RentalStatsPanel } from "./RentalStatsPanel";
import rentalData from "~/data/mock-car-rental.json";

export function CarRental() {
  const [isPlaying, setIsPlaying]             = useState(false);
  const [showZones, setShowZones]             = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const vehicles     = rentalData.vehicles     as Vehicle[];
  const zones        = rentalData.premiumZones as PremiumZone[];
  const garages      = rentalData.garages      as Garage[];

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;

  const handleSelectVehicle = useCallback((id: string | null) => {
    setSelectedVehicleId(id);
  }, []);

  return (
    <DemoLayout>
      <MapContainer
        center={CITIES.alger.center}
        zoom={CITIES.alger.zoom}
        pitch={CITIES.alger.pitch}
        bearing={CITIES.alger.bearing}
      >
        <HideBoundariesLayer />
        <PremiumZones zones={zones} garages={garages} visible={showZones} />
        <VehiclesLayer
          vehicles={vehicles}
          isPlaying={isPlaying}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={handleSelectVehicle}
        />
      </MapContainer>

      <SidePanel title="Location Automobile — Alger">
        <RentalStatsPanel
          stats={rentalData.stats}
          vehicles={vehicles}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          showZones={showZones}
          onToggleZones={() => setShowZones((z) => !z)}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={handleSelectVehicle}
        />
      </SidePanel>
    </DemoLayout>
  );
}

import { CarRental } from "~/demos/car-rental/CarRental";

export function meta() {
  return [
    { title: "ImpactMap — Location Automobile · Alger" },
    { name: "description", content: "Localisation flotte de location en temps réel — Alger, zones golf & premium, suivi maintenance." },
  ];
}

export default function CarRentalRoute() {
  return <CarRental />;
}

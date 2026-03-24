import { FleetRouter } from "~/demos/fleet-router/FleetRouter";

export function meta() {
  return [
    { title: "Fleet Router 3D | Mapbox Demos" },
    { name: "description", content: "Fleet optimization with animated vehicles and TSP algorithm" },
  ];
}

export default function FleetRouterRoute() {
  return <FleetRouter />;
}

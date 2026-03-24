import { MicroMobility } from "~/demos/micro-mobility/MicroMobility";

export function meta() {
  return [
    { title: "Micro-Mobility Dashboard | Mapbox Demos" },
    { name: "description", content: "Real-time micro-mobility vehicle tracking with heatmaps" },
  ];
}

export default function MicroMobilityRoute() {
  return <MicroMobility />;
}

import { UrbanNavigator } from "~/demos/urban-navigator/UrbanNavigator";

export function meta() {
  return [
    { title: "Urban Navigator 3D | Mapbox Demos" },
    { name: "description", content: "3D navigation with route alternatives and animated journeys" },
  ];
}

export default function UrbanNavigatorRoute() {
  return <UrbanNavigator />;
}

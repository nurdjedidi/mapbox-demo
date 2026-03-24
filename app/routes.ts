import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("agritech", "routes/agritech.tsx"),
  route("green-fleet", "routes/green-fleet.tsx"),
  route("climate-monitor", "routes/climate-monitor.tsx"),
] satisfies RouteConfig;

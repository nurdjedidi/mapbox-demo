import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("urban-navigator", "routes/urban-navigator.tsx"),
  route("micro-mobility", "routes/micro-mobility.tsx"),
  route("fleet-router", "routes/fleet-router.tsx"),
  route("geo-sales", "routes/geo-sales.tsx"),
] satisfies RouteConfig;

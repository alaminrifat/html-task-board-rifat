import { type RouteConfig, layout, route } from "@react-router/dev/routes";
import { authRoutes } from "./routes/auth.routes";
import { appRoutes } from "./routes/app.routes";

export default [
  route("/", "pages/splash.tsx"),
  layout("pages/auth/layout.tsx", authRoutes),
  layout("pages/layout.tsx", appRoutes),
] satisfies RouteConfig;

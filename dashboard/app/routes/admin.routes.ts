import { route } from "@react-router/dev/routes";

export const adminRoutes = [
  route("", "pages/dashboard.tsx", { index: true }),
  route("users", "pages/users/list.tsx"),
  route("projects", "pages/projects/list.tsx"),
  route("reports", "pages/reports/index.tsx"),
  route("settings", "pages/system-config.tsx"),
];

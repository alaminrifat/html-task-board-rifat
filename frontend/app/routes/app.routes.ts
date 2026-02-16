import { route } from "@react-router/dev/routes";
import { projectRoutes } from "./project.routes";

export const appRoutes = [
  route("projects", "pages/projects/layout.tsx", projectRoutes),
  route("my-tasks", "pages/my-tasks.tsx"),
  route("notifications", "pages/notifications.tsx"),
  route("profile", "pages/profile/index.tsx"),
  route("profile/edit", "pages/profile/edit.tsx"),
];

import { route, index } from "@react-router/dev/routes";

export const projectRoutes = [
  index("pages/projects/list.tsx"),
  route("new", "pages/projects/create.tsx"),
  route("new/template", "pages/projects/board-template.tsx"),
  route(":projectId/board", "pages/projects/board.tsx"),
  route(":projectId/calendar", "pages/projects/calendar.tsx"),
  route(":projectId/tasks/:taskId", "pages/projects/task-detail.tsx"),
  route(":projectId/trash", "pages/projects/trash.tsx"),
  route(":projectId/settings", "pages/projects/settings.tsx"),
  route(":projectId/dashboard", "pages/projects/dashboard.tsx"),
];

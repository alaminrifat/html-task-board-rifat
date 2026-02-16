import { route } from "@react-router/dev/routes";

export const authRoutes = [
  route("login", "pages/auth/login.tsx"),
  route("forgot-password", "pages/auth/forgot-password.tsx"),
  route("reset-password", "pages/auth/reset-password.tsx"),
  route("signup", "pages/auth/signup.tsx"),
];

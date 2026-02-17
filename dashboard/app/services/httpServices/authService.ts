import { httpService } from '~/services/httpService';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface LoginResponse {
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive?: boolean;
  };
}

interface CheckLoginUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export const authService = {
  login: (data: LoginPayload) =>
    httpService.post<LoginResponse>('/auth/admin-login', data),

  register: (data: RegisterPayload) =>
    httpService.post<LoginResponse>('/users', data),

  logout: () =>
    httpService.get<string>('/auth/logout'),

  refresh: (refreshToken?: string) =>
    httpService.get<LoginResponse>('/auth/refresh-access-token', {
      params: refreshToken ? { refreshToken } : undefined,
    }),

  checkLogin: () =>
    httpService.get<CheckLoginUser>('/auth/check-login'),

  forgotPassword: (email: string) =>
    httpService.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    httpService.post<LoginResponse>('/auth/reset-password', { token, password }),
};

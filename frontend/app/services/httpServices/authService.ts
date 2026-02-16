import { httpService } from '~/services/httpService';
import type { User } from '~/types/user';

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  jobTitle?: string;
  avatarUrl?: string;
  invitationToken?: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

interface LoginResponse {
  user: User;
}

interface GoogleAuthResponse {
  user: User;
  isNewUser: boolean;
}

export const authService = {
  login: (data: LoginRequest) =>
    httpService.post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    httpService.post<User>('/auth/register', data),

  googleAuth: (data: { idToken: string }) =>
    httpService.post<GoogleAuthResponse>('/auth/social-login', data),

  forgotPassword: (data: { email: string }) =>
    httpService.post<{ message: string }>('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    httpService.post<{ message: string }>('/auth/reset-password', data),

  verifyEmail: (data: { token: string }) =>
    httpService.post<{ message: string }>('/auth/verify-email', data),

  resendVerification: () =>
    httpService.post<{ message: string }>('/auth/resend-verification'),

  logout: () =>
    httpService.get<{ message: string }>('/auth/logout'),

  refresh: () =>
    httpService.get<{ message: string }>('/auth/refresh-access-token'),
};

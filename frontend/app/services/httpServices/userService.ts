import { httpService } from '~/services/httpService';
import type { User } from '~/types/user';

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationPreferences {
  pushEnabled?: boolean;
  digestFrequency?: 'OFF' | 'DAILY' | 'WEEKLY';
}

export const userService = {
  getMe: () =>
    httpService.get<User>('/users/me'),

  updateMe: (data: UpdateProfileRequest) =>
    httpService.patch<User>('/users/me', data),

  uploadAvatar: (formData: FormData) =>
    httpService.post<User>('/users/me/avatar', formData, {
      headers: { 'Content-Type': undefined },
    }),

  changePassword: (data: ChangePasswordRequest) =>
    httpService.patch<{ message: string }>('/users/me/password', data),

  updateNotifications: (data: NotificationPreferences) =>
    httpService.patch<User>('/users/me/notifications', data),

  registerDevice: (data: { token: string; platform: string }) =>
    httpService.post<void>('/users/me/devices', data),

  removeDevice: (deviceId: string) =>
    httpService.delete<void>(`/users/me/devices/${deviceId}`),

  deleteAccount: () =>
    httpService.delete<void>('/users/me'),
};

import { httpService } from '~/services/httpService';
import type { Notification } from '~/types/notification';
import type { PaginatedResponse, PaginationParams } from '~/types/common';

export const notificationService = {
  list: (params?: PaginationParams) =>
    httpService.get<PaginatedResponse<Notification>>('/notifications', { params }),

  markRead: (notificationId: string) =>
    httpService.patch<Notification>(`/notifications/${notificationId}/read`),

  markAllRead: () =>
    httpService.post<{ message: string }>('/notifications/read-all'),

  delete: (notificationId: string) =>
    httpService.delete<void>(`/notifications/${notificationId}`),
};

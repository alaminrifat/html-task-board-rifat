import { httpService } from '~/services/httpService';
import type { Notification } from '~/types/notification';
import type { PaginationParams } from '~/types/common';

export const notificationService = {
  list: (params?: PaginationParams) =>
    httpService.getPaginated<Notification>('/notifications', { params }),

  getUnreadCount: async (): Promise<number> => {
    const response = await httpService.getFullResponse<Notification[]>(
      '/notifications',
      { params: { limit: 1 } },
    );
    return (response as unknown as { unreadCount?: number }).unreadCount ?? 0;
  },

  markRead: (notificationId: string) =>
    httpService.patch<Notification>(`/notifications/${notificationId}/read`),

  markAllRead: () =>
    httpService.post<{ message: string }>('/notifications/read-all'),

  delete: (notificationId: string) =>
    httpService.delete<void>(`/notifications/${notificationId}`),
};

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { notificationService } from '~/services/httpServices/notificationService';

const API = 'http://localhost:3000/api';

describe('Notifications Integration', () => {
  describe('List Notifications', () => {
    it('should list notifications', async () => {
      const result = await notificationService.list({ limit: 50 });
      expect(result).toBeDefined();
    });

    it('should pass pagination params', async () => {
      let capturedParams: URLSearchParams | null = null;
      server.use(
        http.get(`${API}/notifications`, ({ request }) => {
          capturedParams = new URL(request.url).searchParams;
          return HttpResponse.json({
            data: [],
            meta: { page: 1, limit: 50, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
          });
        })
      );

      await notificationService.list({ limit: 50 });
      expect(capturedParams).not.toBeNull();
      expect(capturedParams!.get('limit')).toBe('50');
    });
  });

  describe('Mark Read', () => {
    it('should mark a single notification as read', async () => {
      let capturedUrl = '';
      server.use(
        http.patch(`${API}/notifications/:id/read`, ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          return HttpResponse.json({
            success: true,
            statusCode: 200,
            data: { id: 'notif-1', isRead: true },
          });
        })
      );

      await notificationService.markRead('notif-1');
      expect(capturedUrl).toContain('/notifications/notif-1/read');
    });
  });

  describe('Mark All Read', () => {
    it('should mark all notifications as read via POST /notifications/read-all', async () => {
      let wasCalled = false;
      server.use(
        http.post(`${API}/notifications/read-all`, () => {
          wasCalled = true;
          return HttpResponse.json({ success: true, statusCode: 200, data: { message: 'Done' } });
        })
      );

      await notificationService.markAllRead();
      expect(wasCalled).toBe(true);
    });
  });

  describe('Delete Notification', () => {
    it('should delete a notification', async () => {
      let capturedUrl = '';
      server.use(
        http.delete(`${API}/notifications/:id`, ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          return HttpResponse.json({ success: true, statusCode: 200, data: null });
        })
      );

      await notificationService.delete('notif-1');
      expect(capturedUrl).toContain('/notifications/notif-1');
    });
  });
});

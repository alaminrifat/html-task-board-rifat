import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { dashboardService } from '~/services/httpServices/dashboardService';

const API = 'http://localhost:3000/api';
const PROJECT_ID = 'proj-1';

describe('Dashboard Integration', () => {
  describe('Summary', () => {
    it('should fetch dashboard summary', async () => {
      const result = await dashboardService.summary(PROJECT_ID);
      expect(result).toBeDefined();
      expect(result.totalTasks).toBe(10);
      expect(result.completedTasks).toBe(3);
      expect(result.overdueTasks).toBe(1);
      expect(result.totalMembers).toBe(4);
    });
  });

  describe('Charts', () => {
    it('should fetch chart data', async () => {
      const result = await dashboardService.charts(PROJECT_ID);
      expect(result).toBeDefined();
      expect(result.tasksByStatus).toBeDefined();
      expect(result.tasksByPriority).toBeDefined();
      expect(result.taskCompletionTrend).toBeDefined();
    });
  });

  describe('Export', () => {
    it('should export project data as CSV', async () => {
      let capturedParams: URLSearchParams | null = null;
      server.use(
        http.get(`${API}/projects/:projectId/export`, ({ request }) => {
          capturedParams = new URL(request.url).searchParams;
          return new HttpResponse('csv,data', {
            headers: { 'Content-Type': 'text/csv' },
          });
        })
      );

      await dashboardService.export(PROJECT_ID, 'csv');
      expect(capturedParams).not.toBeNull();
      expect(capturedParams!.get('format')).toBe('csv');
    });
  });

  describe('Calendar', () => {
    it('should fetch calendar events', async () => {
      const result = await dashboardService.calendar(PROJECT_ID);
      expect(result).toBeDefined();
    });

    it('should pass month and year params', async () => {
      let capturedParams: URLSearchParams | null = null;
      server.use(
        http.get(`${API}/projects/:projectId/calendar`, ({ request }) => {
          capturedParams = new URL(request.url).searchParams;
          return HttpResponse.json({ success: true, statusCode: 200, data: [] });
        })
      );

      await dashboardService.calendar(PROJECT_ID, { month: 3, year: 2025 });
      expect(capturedParams).not.toBeNull();
      expect(capturedParams!.get('month')).toBe('3');
      expect(capturedParams!.get('year')).toBe('2025');
    });
  });

  describe('Reschedule Task', () => {
    it('should reschedule a task on calendar', async () => {
      let capturedBody: Record<string, unknown> = {};
      server.use(
        http.patch(
          `${API}/projects/:projectId/calendar/tasks/:taskId/reschedule`,
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json({ success: true, statusCode: 200, data: null });
          }
        )
      );

      await dashboardService.rescheduleTask(PROJECT_ID, 'task-1', {
        dueDate: '2025-06-15',
      });
      expect(capturedBody.dueDate).toBe('2025-06-15');
    });
  });
});

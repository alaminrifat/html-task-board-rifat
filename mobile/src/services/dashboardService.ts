import { httpService } from '~/services/httpService';

export interface DashboardSummary {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalMembers: number;
}

export interface MemberWorkload {
  userId: string;
  name: string;
  avatarUrl: string | null;
  assignedTasks: number;
  completedTasks: number;
}

export interface DashboardCharts {
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  taskCompletionTrend: Array<{ date: string; count: number }>;
  memberWorkload: MemberWorkload[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  columnTitle: string;
}

interface CalendarResponse {
  data: CalendarEvent[];
  month: number;
  year: number;
}

export const dashboardService = {
  summary: (
    projectId: string,
    params?: { dateFrom?: string; dateTo?: string },
  ) =>
    httpService.get<DashboardSummary>(
      `/projects/${projectId}/dashboard/summary`,
      { params },
    ),
  charts: (
    projectId: string,
    params?: {
      dateFrom?: string;
      dateTo?: string;
      assigneeId?: string;
      priority?: string;
    },
  ) =>
    httpService.get<DashboardCharts>(
      `/projects/${projectId}/dashboard/charts`,
      { params },
    ),
  calendar: async (
    projectId: string,
    params?: { month?: number; year?: number },
  ) => {
    const response = await httpService.get<CalendarResponse>(
      `/projects/${projectId}/calendar`,
      { params },
    );
    return response.data;
  },
  rescheduleTask: (
    projectId: string,
    taskId: string,
    data: { dueDate: string },
  ) =>
    httpService.patch<void>(
      `/projects/${projectId}/calendar/tasks/${taskId}/reschedule`,
      data,
    ),
};

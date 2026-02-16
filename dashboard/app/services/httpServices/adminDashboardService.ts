import { httpService } from '~/services/httpService';
import type { DashboardStats, DashboardCharts, ChartDataPoint, RecentActivity } from '~/types/admin';

// ---------------------------------------------------------------------------
// Raw backend response shapes
// ---------------------------------------------------------------------------

interface RawStats {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  activeUsersToday: number;
  period?: { type: string; from: string; to: string };
}

interface RawCharts {
  userRegistrationTrend: { date: string; count: number }[];
  projectCreationTrend: { date: string; count: number }[];
  taskCompletionRate: { date: string; completed: number; total: number; rate: number }[];
  top5ActiveProjects: { projectId: string; projectTitle: string; activityCount: number }[];
  period?: { type: string; from: string; to: string };
}

interface RawActivity {
  id: string;
  action: string;
  user: { id: string; name: string; avatarUrl?: string | null } | null;
  project: { id: string; title: string };
  taskId?: string | null;
  taskTitle?: string | null;
  details?: unknown;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Transform helpers
// ---------------------------------------------------------------------------

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function transformStats(raw: RawStats): DashboardStats {
  return {
    totalUsers: raw.totalUsers ?? 0,
    newUsersThisWeek: 0, // Not provided by backend; will display 0
    totalProjects: raw.totalProjects ?? 0,
    activeProjects: raw.totalProjects ?? 0, // Backend doesn't separate active; use total as approximation
    totalTasks: raw.totalTasks ?? 0,
    completedThisWeek: 0, // Not provided by backend; will display 0
    activeUsersToday: raw.activeUsersToday ?? 0,
  };
}

function transformCharts(raw: RawCharts): DashboardCharts {
  const userGrowth: ChartDataPoint[] = (raw.userRegistrationTrend ?? []).map((row) => ({
    label: formatDateLabel(row.date),
    value: row.count ?? 0,
  }));

  const taskCompletion: ChartDataPoint[] = (raw.taskCompletionRate ?? []).map((row) => ({
    label: formatDateLabel(row.date),
    value: row.completed ?? 0,
  }));

  const projectActivity: ChartDataPoint[] = (raw.top5ActiveProjects ?? []).map((row) => ({
    label: row.projectTitle ?? '',
    value: row.activityCount ?? 0,
  }));

  return { userGrowth, taskCompletion, projectActivity };
}

/**
 * Map backend activity action strings to the UI activity type enum.
 */
const ACTION_TYPE_MAP: Record<string, RecentActivity['type']> = {
  TASK_COMPLETED: 'TASK_COMPLETED',
  USER_CREATED: 'USER_CREATED',
  PROJECT_CREATED: 'PROJECT_CREATED',
  USER_SUSPENDED: 'USER_SUSPENDED',
};

function transformActivity(raw: RawActivity[]): RecentActivity[] {
  return (raw ?? []).map((item) => {
    const action = (item.action ?? '').toUpperCase();
    const type: RecentActivity['type'] = ACTION_TYPE_MAP[action] ?? 'TASK_COMPLETED';
    const actorName = item.user?.name ?? 'System';
    const projectTitle = item.project?.title ?? '';
    const taskTitle = item.taskTitle ?? '';

    // Build a human-readable description from the action and context
    let description: string;
    switch (action) {
      case 'USER_CREATED':
        description = 'created a new user account';
        break;
      case 'PROJECT_CREATED':
        description = `created project "${projectTitle}"`;
        break;
      case 'TASK_COMPLETED':
        description = taskTitle
          ? `completed task "${taskTitle}" in ${projectTitle}`
          : `completed a task in ${projectTitle}`;
        break;
      case 'USER_SUSPENDED':
        description = 'suspended a user account';
        break;
      default:
        description = taskTitle
          ? `${action.toLowerCase().replace(/_/g, ' ')} "${taskTitle}" in ${projectTitle}`
          : `${action.toLowerCase().replace(/_/g, ' ')} in ${projectTitle}`;
    }

    return {
      id: item.id,
      type,
      description,
      actorName,
      createdAt: item.createdAt,
    };
  });
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const adminDashboardService = {
  getStats: async (params?: { period?: string; dateFrom?: string; dateTo?: string }): Promise<DashboardStats> => {
    const raw = await httpService.get<RawStats>('/admin/dashboard/stats', { params });
    return transformStats(raw);
  },

  getCharts: async (params?: { period?: string; dateFrom?: string; dateTo?: string }): Promise<DashboardCharts> => {
    const raw = await httpService.get<RawCharts>('/admin/dashboard/charts', { params });
    return transformCharts(raw);
  },

  getRecentActivity: async (): Promise<RecentActivity[]> => {
    const raw = await httpService.get<RawActivity[]>('/admin/dashboard/recent-activity');
    return transformActivity(raw);
  },
};

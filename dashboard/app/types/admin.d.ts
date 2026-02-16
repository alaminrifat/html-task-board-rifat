export interface DashboardStats {
  totalUsers: number;
  newUsersThisWeek: number;
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedThisWeek: number;
  activeUsersToday: number;
}

export interface DashboardCharts {
  userGrowth: ChartDataPoint[];
  taskCompletion: ChartDataPoint[];
  projectActivity: ChartDataPoint[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface RecentActivity {
  id: string;
  type: 'USER_CREATED' | 'PROJECT_CREATED' | 'TASK_COMPLETED' | 'USER_SUSPENDED';
  description: string;
  actorName: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'PROJECT_OWNER' | 'TEAM_MEMBER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  avatarUrl?: string | null;
  projectsCount: number;
  tasksCount: number;
  createdAt: string;
  lastActiveAt: string | null;
}

export interface AdminUserDetail extends AdminUser {
  jobTitle?: string;
  emailVerified?: boolean;
  updatedAt?: string;
  projects: AdminUserProject[];
  recentTasks: AdminUserTask[];
  stats: AdminUserStats;
}

export interface AdminUserProject {
  id: string;
  title: string;
  role: string;
  status?: string;
}

export interface AdminUserTask {
  id: string;
  title: string;
  projectTitle?: string;
  columnTitle?: string;
  priority?: string;
  dueDate?: string | null;
  createdAt?: string;
}

export interface AdminUserStats {
  projectsCount: number;
  tasksAssigned: number;
  tasksCompleted: number;
  totalTimeLoggedMinutes: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: 'PROJECT_OWNER' | 'TEAM_MEMBER';
}

export interface UpdateUserPayload {
  name?: string;
  jobTitle?: string;
  avatarUrl?: string;
}

export interface AdminProject {
  id: string;
  title: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  deadline: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  membersCount: number;
  tasksCount: number;
  completionPercent: number;
}

export interface AdminProjectDetail extends AdminProject {
  members: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
    projectRole: string;
    joinedAt?: string;
  }[];
  taskSummary: {
    total: number;
    byStatus: { column: string; count: number }[];
    overdueCount: number;
  };
  recentActivity?: {
    id: string;
    action: string;
    user: { id: string; name: string } | null;
    details: unknown;
    createdAt: string;
  }[];
}

export interface AdminSettings {
  general: {
    appName: string;
    defaultTemplateColumns: string[];
    maxFileUploadSize: number;
    allowedFileTypes: string[];
  };
  notifications: {
    globalEmailEnabled: boolean;
    defaultDigestFrequency: 'OFF' | 'DAILY' | 'WEEKLY';
    deadlineReminderHours: number;
  };
}

export interface AdminLabel {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface BulkUserActionPayload {
  userIds: string[];
  action: 'activate' | 'suspend' | 'delete';
}

export interface BulkProjectActionPayload {
  projectIds: string[];
  action: 'archive' | 'delete';
}

export interface CreateProjectPayload {
  title: string;
  description?: string;
  ownerId: string;
  template?: 'DEFAULT' | 'MINIMAL' | 'CUSTOM';
  startDate?: string;
  deadline?: string;
  status?: 'ACTIVE' | 'COMPLETED';
  notifyTeam?: boolean;
}

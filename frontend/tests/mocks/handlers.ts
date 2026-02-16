import { http, HttpResponse } from 'msw';

const API = 'http://localhost:3000/api';

// ── Mock Data ───────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  role: 'USER',
  isActive: true,
  jobTitle: 'Developer',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockProject = {
  id: 'proj-1',
  title: 'Test Project',
  description: 'A test project',
  status: 'ACTIVE',
  template: 'DEFAULT',
  ownerId: 'user-1',
  memberCount: 2,
  taskCount: 5,
  completedTaskCount: 2,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockColumn = {
  id: 'col-1',
  title: 'To Do',
  position: 0,
  wipLimit: 10,
  projectId: 'proj-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'A test task',
  priority: 'MEDIUM',
  position: 0,
  columnId: 'col-1',
  projectId: 'proj-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockNotification = {
  id: 'notif-1',
  type: 'TASK_ASSIGNED',
  message: 'You were assigned a task',
  isRead: false,
  taskId: 'task-1',
  projectId: 'proj-1',
  createdAt: '2025-01-10T00:00:00.000Z',
};

const mockMember = {
  id: 'member-1',
  userId: 'user-1',
  projectId: 'proj-1',
  role: 'OWNER',
  user: mockUser,
  createdAt: '2025-01-01T00:00:00.000Z',
};

const mockInvitation = {
  id: 'inv-1',
  email: 'invited@example.com',
  projectId: 'proj-1',
  status: 'PENDING',
  token: 'inv-token-123',
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ── Helper ──────────────────────────────────────────────────────────────

function wrap<T>(data: T) {
  return { success: true, statusCode: 200, data, message: 'OK' };
}

function wrapPaginated<T>(data: T[], page = 1, limit = 10) {
  return {
    data,
    meta: {
      page,
      limit,
      total: data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

function wrapCreated<T>(data: T) {
  return { success: true, statusCode: 201, data, message: 'Created' };
}

function wrapDeleted() {
  return { success: true, statusCode: 200, data: null, message: 'Deleted' };
}

// ── Handlers ────────────────────────────────────────────────────────────

export const handlers = [
  // ── Auth ──────────────────────────────────────────────────────────────
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json(wrap({ user: mockUser }));
    }
    return HttpResponse.json(
      { success: false, statusCode: 401, message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API}/users`, async () => {
    return HttpResponse.json(wrapCreated(mockUser), { status: 201 });
  }),

  http.post(`${API}/auth/forgot-password`, async () => {
    return HttpResponse.json(wrap({ message: 'OTP sent to your email' }));
  }),

  http.post(`${API}/auth/reset-password`, async () => {
    return HttpResponse.json(wrap({ user: mockUser }));
  }),

  http.post(`${API}/auth/social-login`, async () => {
    return HttpResponse.json(wrap({ user: mockUser, isNewUser: false }));
  }),

  http.get(`${API}/auth/refresh-access-token`, () => {
    return HttpResponse.json(wrap({ message: 'Token refreshed' }));
  }),

  http.get(`${API}/auth/logout`, () => {
    return HttpResponse.json(wrap({ message: 'Logged out' }));
  }),

  http.get(`${API}/auth/check-login`, () => {
    return HttpResponse.json(wrap({ user: mockUser }));
  }),

  // ── Users ─────────────────────────────────────────────────────────────
  http.get(`${API}/users/me`, () => {
    return HttpResponse.json(wrap(mockUser));
  }),

  http.patch(`${API}/users/me`, async () => {
    return HttpResponse.json(wrap({ ...mockUser, firstName: 'Updated' }));
  }),

  http.post(`${API}/users/me/avatar`, async () => {
    return HttpResponse.json(wrap({ ...mockUser, profilePhotoUrl: '/uploads/avatar.jpg' }));
  }),

  http.patch(`${API}/users/me/password`, async () => {
    return HttpResponse.json(wrap(null));
  }),

  http.patch(`${API}/users/me/notifications`, async () => {
    return HttpResponse.json(wrap(mockUser));
  }),

  http.post(`${API}/users/me/devices`, async () => {
    return HttpResponse.json(wrapCreated({ id: 'dev-1', token: 'tok', platform: 'web' }), { status: 201 });
  }),

  http.delete(`${API}/users/me/devices/:deviceId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  http.delete(`${API}/users/me`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  // ── Projects ──────────────────────────────────────────────────────────
  http.get(`${API}/projects`, () => {
    return HttpResponse.json(wrapPaginated([mockProject]));
  }),

  http.get(`${API}/projects/:projectId`, () => {
    return HttpResponse.json(wrap(mockProject));
  }),

  http.get(`${API}/projects/:projectId/board`, () => {
    return HttpResponse.json(
      wrap({ columns: [{ ...mockColumn, tasks: [mockTask] }] })
    );
  }),

  http.post(`${API}/projects`, async () => {
    return HttpResponse.json(wrapCreated(mockProject), { status: 201 });
  }),

  http.patch(`${API}/projects/:projectId`, async () => {
    return HttpResponse.json(wrap({ ...mockProject, title: 'Updated' }));
  }),

  http.post(`${API}/projects/:projectId/archive`, () => {
    return HttpResponse.json(wrap({ ...mockProject, status: 'ARCHIVED' }));
  }),

  http.delete(`${API}/projects/:projectId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  // ── Columns ───────────────────────────────────────────────────────────
  http.get(`${API}/projects/:projectId/columns`, () => {
    return HttpResponse.json(wrap([mockColumn]));
  }),

  http.post(`${API}/projects/:projectId/columns`, async () => {
    return HttpResponse.json(wrapCreated({ ...mockColumn, id: 'col-new' }), { status: 201 });
  }),

  http.patch(`${API}/projects/:projectId/columns/:columnId`, async () => {
    return HttpResponse.json(wrap({ ...mockColumn, title: 'Updated' }));
  }),

  http.delete(`${API}/projects/:projectId/columns/:columnId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  http.patch(`${API}/projects/:projectId/columns/reorder`, async () => {
    return HttpResponse.json(wrap(null));
  }),

  // ── Tasks ─────────────────────────────────────────────────────────────
  http.get(`${API}/projects/:projectId/tasks`, () => {
    return HttpResponse.json(wrapPaginated([mockTask]));
  }),

  http.get(`${API}/projects/:projectId/tasks/trash`, () => {
    return HttpResponse.json(wrap([]));
  }),

  http.get(`${API}/projects/:projectId/tasks/:taskId`, () => {
    return HttpResponse.json(wrap(mockTask));
  }),

  http.post(`${API}/projects/:projectId/tasks`, async () => {
    return HttpResponse.json(wrapCreated({ ...mockTask, id: 'task-new' }), { status: 201 });
  }),

  http.patch(`${API}/projects/:projectId/tasks/:taskId`, async () => {
    return HttpResponse.json(wrap({ ...mockTask, title: 'Updated' }));
  }),

  http.patch(`${API}/projects/:projectId/tasks/:taskId/move`, async () => {
    return HttpResponse.json(wrap(mockTask));
  }),

  http.delete(`${API}/projects/:projectId/tasks/:taskId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  http.post(`${API}/projects/:projectId/tasks/:taskId/restore`, () => {
    return HttpResponse.json(wrap(mockTask));
  }),

  http.delete(`${API}/projects/:projectId/tasks/trash/:taskId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  http.get(`${API}/users/me/tasks`, () => {
    return HttpResponse.json(wrapPaginated([mockTask]));
  }),

  // ── SubTasks (actual route uses /subtasks, no hyphen) ────────────────
  http.get(`${API}/projects/:projectId/tasks/:taskId/subtasks`, () => {
    return HttpResponse.json(wrap([]));
  }),

  http.post(`${API}/projects/:projectId/tasks/:taskId/subtasks`, async () => {
    return HttpResponse.json(
      wrapCreated({ id: 'sub-1', title: 'Sub Task', completed: false }),
      { status: 201 }
    );
  }),

  http.patch(`${API}/projects/:projectId/tasks/:taskId/subtasks/:subTaskId`, async () => {
    return HttpResponse.json(wrap({ id: 'sub-1', title: 'Updated', completed: true }));
  }),

  http.delete(`${API}/projects/:projectId/tasks/:taskId/subtasks/:subTaskId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  http.patch(`${API}/projects/:projectId/tasks/:taskId/subtasks/reorder`, async () => {
    return HttpResponse.json(wrap(null));
  }),

  // ── Comments ──────────────────────────────────────────────────────────
  http.get(`${API}/projects/:projectId/tasks/:taskId/comments`, () => {
    return HttpResponse.json(wrap([]));
  }),

  http.post(`${API}/projects/:projectId/tasks/:taskId/comments`, async () => {
    return HttpResponse.json(
      wrapCreated({ id: 'comment-1', content: 'Hello', createdAt: '2025-01-01T00:00:00.000Z' }),
      { status: 201 }
    );
  }),

  http.patch(`${API}/projects/:projectId/tasks/:taskId/comments/:commentId`, async () => {
    return HttpResponse.json(wrap({ id: 'comment-1', content: 'Updated' }));
  }),

  http.delete(`${API}/projects/:projectId/tasks/:taskId/comments/:commentId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  // ── Labels ────────────────────────────────────────────────────────────
  http.get(`${API}/projects/:projectId/labels`, () => {
    return HttpResponse.json(wrap([]));
  }),

  http.post(`${API}/projects/:projectId/labels`, async () => {
    return HttpResponse.json(wrapCreated({ id: 'label-1', name: 'Bug', color: '#EF4444' }), { status: 201 });
  }),

  http.patch(`${API}/projects/:projectId/labels/:labelId`, async () => {
    return HttpResponse.json(wrap({ id: 'label-1', name: 'Updated', color: '#3B82F6' }));
  }),

  http.delete(`${API}/projects/:projectId/labels/:labelId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  // ── Members ───────────────────────────────────────────────────────────
  http.get(`${API}/projects/:projectId/members`, () => {
    return HttpResponse.json(wrap([mockMember]));
  }),

  http.post(`${API}/projects/:projectId/members/invite`, async () => {
    return HttpResponse.json(wrapCreated(mockInvitation), { status: 201 });
  }),

  http.delete(`${API}/projects/:projectId/members/:userId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  http.get(`${API}/projects/:projectId/invitations`, () => {
    return HttpResponse.json(wrap([mockInvitation]));
  }),

  http.post(`${API}/projects/:projectId/invitations/:invitationId/resend`, () => {
    return HttpResponse.json(wrap(mockInvitation));
  }),

  http.delete(`${API}/projects/:projectId/invitations/:invitationId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  http.post(`${API}/invitations/:token/accept`, () => {
    return HttpResponse.json(wrap({ message: 'Invitation accepted' }));
  }),

  http.post(`${API}/invitations/:token/decline`, () => {
    return HttpResponse.json(wrap({ message: 'Invitation declined' }));
  }),

  // ── Notifications ─────────────────────────────────────────────────────
  http.get(`${API}/notifications`, () => {
    // notificationService.list uses httpService.get (not getPaginated)
    // so it unwraps ResponsePayloadDto → returns data field
    return HttpResponse.json(wrap({
      data: [mockNotification],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    }));
  }),

  http.patch(`${API}/notifications/:id/read`, () => {
    return HttpResponse.json(wrap({ ...mockNotification, isRead: true }));
  }),

  // markAllRead uses POST /notifications/read-all (not PATCH /mark-all-read)
  http.post(`${API}/notifications/read-all`, () => {
    return HttpResponse.json(wrap({ message: 'All notifications marked as read' }));
  }),

  http.delete(`${API}/notifications/:id`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  // ── Dashboard ─────────────────────────────────────────────────────────
  http.get(`${API}/projects/:projectId/dashboard/summary`, () => {
    return HttpResponse.json(
      wrap({ totalTasks: 10, completedTasks: 3, overdueTasks: 1, totalMembers: 4 })
    );
  }),

  http.get(`${API}/projects/:projectId/dashboard/charts`, () => {
    return HttpResponse.json(
      wrap({
        tasksByStatus: { 'To Do': 4, 'In Progress': 3, Done: 3 },
        tasksByPriority: { URGENT: 1, HIGH: 2, MEDIUM: 4, LOW: 3 },
        taskCompletionTrend: [],
      })
    );
  }),

  http.get(`${API}/projects/:projectId/export`, () => {
    return new HttpResponse('csv,data', {
      headers: { 'Content-Type': 'text/csv' },
    });
  }),

  http.get(`${API}/projects/:projectId/calendar`, () => {
    return HttpResponse.json(wrap([]));
  }),

  http.patch(`${API}/projects/:projectId/calendar/tasks/:taskId/reschedule`, async () => {
    return HttpResponse.json(wrap(null));
  }),

  // ── Attachments ───────────────────────────────────────────────────────
  http.get(`${API}/projects/:projectId/tasks/:taskId/attachments`, () => {
    return HttpResponse.json(wrap([]));
  }),

  http.post(`${API}/projects/:projectId/tasks/:taskId/attachments`, async () => {
    return HttpResponse.json(
      wrapCreated({ id: 'att-1', fileName: 'test.pdf', fileSize: 1024 }),
      { status: 201 }
    );
  }),

  http.get(`${API}/projects/:projectId/attachments/:attachmentId/download`, () => {
    return new HttpResponse('file content', {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  }),

  http.delete(`${API}/projects/:projectId/attachments/:attachmentId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  // ── Time Entries ──────────────────────────────────────────────────────
  http.get(`${API}/projects/:projectId/tasks/:taskId/time-entries`, () => {
    return HttpResponse.json(wrap([]));
  }),

  http.post(`${API}/projects/:projectId/tasks/:taskId/time-entries`, async () => {
    return HttpResponse.json(
      wrapCreated({ id: 'te-1', duration: 3600, description: 'Work' }),
      { status: 201 }
    );
  }),

  http.post(`${API}/projects/:projectId/tasks/:taskId/time-entries/start`, () => {
    return HttpResponse.json(wrapCreated({ id: 'te-2', startTime: new Date().toISOString() }), { status: 201 });
  }),

  http.post(`${API}/time-entries/:timeEntryId/stop`, () => {
    return HttpResponse.json(wrap({ id: 'te-2', duration: 1800 }));
  }),

  http.patch(`${API}/time-entries/:timeEntryId`, async () => {
    return HttpResponse.json(wrap({ id: 'te-1', duration: 7200 }));
  }),

  http.delete(`${API}/time-entries/:timeEntryId`, () => {
    return HttpResponse.json(wrapDeleted());
  }),

  // ── Activity Logs (actual route: /activity, not /activity-logs) ──────
  http.get(`${API}/projects/:projectId/activity`, () => {
    return HttpResponse.json(wrap({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }));
  }),
];

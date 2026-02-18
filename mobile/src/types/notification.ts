export interface Notification {
  id: string;
  userId: string;
  type: 'TASK_ASSIGNED' | 'DUE_DATE_REMINDER' | 'STATUS_CHANGE' | 'COMMENT_MENTION' | 'NEW_COMMENT' | 'INVITATION' | 'PROJECT_CREATED';
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  isRead: boolean;
  createdAt: string;
}

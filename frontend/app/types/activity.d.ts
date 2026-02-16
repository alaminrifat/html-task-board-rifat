export interface ActivityLog {
  id: string;
  projectId: string;
  taskId?: string;
  userId: string;
  action:
    | 'TASK_CREATED'
    | 'TASK_UPDATED'
    | 'TASK_MOVED'
    | 'TASK_DELETED'
    | 'TASK_RESTORED'
    | 'COMMENT_ADDED'
    | 'ATTACHMENT_ADDED'
    | 'ATTACHMENT_REMOVED'
    | 'MEMBER_ADDED'
    | 'MEMBER_REMOVED'
    | 'COLUMN_CREATED'
    | 'COLUMN_UPDATED'
    | 'COLUMN_DELETED'
    | 'PROJECT_UPDATED'
    | 'PROJECT_ARCHIVED'
    | 'SUB_TASK_ADDED'
    | 'SUB_TASK_COMPLETED'
    | 'TIME_LOGGED';
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  user?: { id: string; fullName: string; avatarUrl?: string };
  parentId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

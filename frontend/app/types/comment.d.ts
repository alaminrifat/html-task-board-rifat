export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  parentId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

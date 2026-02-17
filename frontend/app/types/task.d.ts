export interface Task {
  id: string;
  columnId: string;
  projectId: string;
  creatorId: string;
  assigneeId?: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  position: number;
  deletedById?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Relations (populated by backend when loading with joins)
  labels?: { id: string; name: string; color: string }[];
  column?: { id: string; title: string };
  project?: { id: string; title: string };
  assignee?: { id: string; fullName: string; avatarUrl?: string };
  creator?: { id: string; fullName: string; avatarUrl?: string };
}

export interface SubTask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

import { httpService } from '~/services/httpService';
import type { Task } from '~/types/task';
import type { PaginationParams } from '~/types/common';

interface CreateTaskRequest {
  title: string;
  description?: string;
  columnId: string;
  assigneeId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
}

interface MoveTaskRequest {
  columnId: string;
  position: number;
}

export const taskService = {
  list: (projectId: string, params?: PaginationParams) =>
    httpService.getPaginated<Task>(`/projects/${projectId}/tasks`, { params }),

  getById: (projectId: string, taskId: string) =>
    httpService.get<Task>(`/projects/${projectId}/tasks/${taskId}`),

  create: (projectId: string, data: CreateTaskRequest) =>
    httpService.post<Task>(`/projects/${projectId}/tasks`, data),

  update: (projectId: string, taskId: string, data: UpdateTaskRequest) =>
    httpService.patch<Task>(`/projects/${projectId}/tasks/${taskId}`, data),

  move: (projectId: string, taskId: string, data: MoveTaskRequest) =>
    httpService.patch<Task>(`/projects/${projectId}/tasks/${taskId}/move`, data),

  delete: (projectId: string, taskId: string) =>
    httpService.delete<void>(`/projects/${projectId}/tasks/${taskId}`),

  listTrash: (projectId: string) =>
    httpService.get<Task[]>(`/projects/${projectId}/tasks/trash`),

  restore: (projectId: string, taskId: string) =>
    httpService.post<Task>(`/projects/${projectId}/tasks/${taskId}/restore`),

  permanentDelete: (projectId: string, taskId: string) =>
    httpService.delete<void>(`/projects/${projectId}/tasks/trash/${taskId}`),

  myTasks: (params?: PaginationParams) =>
    httpService.getPaginated<Task>('/users/me/tasks', { params }),
};

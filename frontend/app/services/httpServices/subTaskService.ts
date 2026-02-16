import { httpService } from '~/services/httpService';
import type { SubTask } from '~/types/task';

interface CreateSubTaskRequest {
  title: string;
}

interface UpdateSubTaskRequest {
  title?: string;
  isCompleted?: boolean;
}

interface ReorderSubTasksRequest {
  subTaskIds: string[];
}

export const subTaskService = {
  list: (projectId: string, taskId: string) =>
    httpService.get<SubTask[]>(`/projects/${projectId}/tasks/${taskId}/subtasks`),

  create: (projectId: string, taskId: string, data: CreateSubTaskRequest) =>
    httpService.post<SubTask>(`/projects/${projectId}/tasks/${taskId}/subtasks`, data),

  update: (projectId: string, taskId: string, subTaskId: string, data: UpdateSubTaskRequest) =>
    httpService.patch<SubTask>(`/projects/${projectId}/tasks/${taskId}/subtasks/${subTaskId}`, data),

  delete: (projectId: string, taskId: string, subTaskId: string) =>
    httpService.delete<void>(`/projects/${projectId}/tasks/${taskId}/subtasks/${subTaskId}`),

  reorder: (projectId: string, taskId: string, data: ReorderSubTasksRequest) =>
    httpService.patch<SubTask[]>(`/projects/${projectId}/tasks/${taskId}/subtasks/reorder`, data),
};

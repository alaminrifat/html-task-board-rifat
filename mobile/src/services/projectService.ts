import { httpService } from '~/services/httpService';
import type { Project } from '~/types/project';
import type { PaginationParams } from '~/types/common';

interface CreateProjectRequest {
  title: string;
  description?: string;
  template: 'DEFAULT' | 'MINIMAL' | 'CUSTOM';
  deadline?: string;
}

interface UpdateProjectRequest {
  title?: string;
  description?: string;
  deadline?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}

export const projectService = {
  list: (params?: PaginationParams) =>
    httpService.getPaginated<Project>('/projects', { params }),
  getById: (projectId: string) =>
    httpService.get<Project>(`/projects/${projectId}`),
  getBoard: (projectId: string) =>
    httpService.get<unknown>(`/projects/${projectId}/board`),
  create: (data: CreateProjectRequest) =>
    httpService.post<Project>('/projects', data),
  update: (projectId: string, data: UpdateProjectRequest) =>
    httpService.patch<Project>(`/projects/${projectId}`, data),
  archive: (projectId: string) =>
    httpService.post<Project>(`/projects/${projectId}/archive`),
  delete: (projectId: string) =>
    httpService.delete<void>(`/projects/${projectId}`),
};

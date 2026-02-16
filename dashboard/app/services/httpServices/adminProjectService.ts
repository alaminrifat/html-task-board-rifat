import { httpService } from '~/services/httpService';
import type {
  AdminProject,
  AdminProjectDetail,
  BulkProjectActionPayload,
  CreateProjectPayload,
} from '~/types/admin';
import type { PaginationParams } from '~/types/common';

interface ProjectListParams extends PaginationParams {
  status?: string;
  ownerId?: string;
}

export const adminProjectService = {
  getProjects: (params?: ProjectListParams) =>
    httpService.getPaginated<AdminProject>('/admin/projects', { params }),

  createProject: (data: CreateProjectPayload) =>
    httpService.post<AdminProject>('/admin/projects', data),

  getProjectById: (projectId: string) =>
    httpService.get<AdminProjectDetail>(`/admin/projects/${projectId}`),

  archiveProject: (projectId: string) =>
    httpService.post<AdminProject>(`/admin/projects/${projectId}/archive`),

  deleteProject: (projectId: string) =>
    httpService.delete(`/admin/projects/${projectId}`),

  bulkAction: (data: BulkProjectActionPayload) =>
    httpService.post<{ affected: number }>('/admin/projects/bulk', data),

  exportProjects: (params?: { format?: string }) =>
    httpService.get<Blob>('/admin/projects/export', {
      params,
      responseType: 'blob',
    }),
};

import { httpService } from '~/services/httpService';

export const adminExportService = {
  exportUsers: (params?: { format?: string }) =>
    httpService.get<Blob>('/admin/export/users', {
      params,
      responseType: 'blob',
    }),

  exportProjects: (params?: { format?: string }) =>
    httpService.get<Blob>('/admin/export/projects', {
      params,
      responseType: 'blob',
    }),

  exportTasks: (params?: { format?: string }) =>
    httpService.get<Blob>('/admin/export/tasks', {
      params,
      responseType: 'blob',
    }),
};

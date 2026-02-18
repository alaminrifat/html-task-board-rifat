import { httpService } from '~/services/httpService';

interface ExportParams {
  dateFrom?: string;
  dateTo?: string;
}

export const adminExportService = {
  exportUsers: (params?: ExportParams) =>
    httpService.getBlob('/admin/export/users', { params }),

  exportProjects: (params?: ExportParams) =>
    httpService.getBlob('/admin/export/projects', { params }),

  exportTasks: (params?: ExportParams) =>
    httpService.getBlob('/admin/export/tasks', { params }),
};
